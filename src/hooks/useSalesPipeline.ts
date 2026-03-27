import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Lead, LeadHistoryEntry, PipelineStage } from '@/types/crm';
import { pipelineApi } from '@/services/pipelineApi';
import { resolveLeadStageId, slugifyStageName } from '@/services/pipelineStorage';

interface UseSalesPipelineParams {
  leads: Lead[];
  updateLead: (lead: Lead) => void;
  currentUser?: string;
}

export function useSalesPipeline({ leads, updateLead, currentUser = 'Equipe Comercial' }: UseSalesPipelineParams) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [history, setHistory] = useState<LeadHistoryEntry[]>([]);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);

  const refreshPipeline = useCallback(async () => {
    const [stageList, historyList] = await Promise.all([
      pipelineApi.listStages(),
      pipelineApi.listHistory(),
    ]);
    setStages(stageList);
    setHistory(historyList);
  }, []);

  useEffect(() => {
    refreshPipeline();
  }, [refreshPipeline]);

  useEffect(() => {
    if (stages.length === 0 || leads.length === 0) return;

    leads.forEach((lead) => {
      const resolvedStageId = resolveLeadStageId(lead, stages);
      if (!lead.pipelineStageId || lead.pipelineStageId !== resolvedStageId) {
        updateLead({
          ...lead,
          pipelineStageId: resolvedStageId,
          atualizadoEm: new Date().toISOString(),
        });
      }
    });
  }, [leads, stages, updateLead]);

  const leadsByStage = useMemo(() => {
    const initial = new Map<string, Lead[]>();
    stages.forEach((stage) => initial.set(stage.id, []));

    leads.forEach((lead) => {
      const stageId = resolveLeadStageId(lead, stages);
      if (!initial.has(stageId)) initial.set(stageId, []);
      initial.get(stageId)?.push(lead);
    });

    return initial;
  }, [leads, stages]);

  const moveLeadToStage = useCallback(async (lead: Lead, targetStageId: string) => {
    const fromStageId = resolveLeadStageId(lead, stages);
    if (fromStageId === targetStageId) return;

    const fromStage = stages.find((stage) => stage.id === fromStageId);
    const toStage = stages.find((stage) => stage.id === targetStageId);
    if (!toStage) return;

    updateLead({
      ...lead,
      pipelineStageId: toStage.id,
      status: slugifyStageName(toStage.nome),
      atualizadoEm: new Date().toISOString(),
    });

    const entry = await pipelineApi.recordLeadMovement({
      leadId: lead.id,
      fromStageId,
      toStageId: toStage.id,
      fromStageNome: fromStage?.nome,
      toStageNome: toStage.nome,
      movidoPor: currentUser,
      observacao: `Lead movido para ${toStage.nome}`,
    });

    setHistory((prev) => [entry, ...prev]);
  }, [currentUser, stages, updateLead]);

  const createStage = useCallback(async (name: string) => {
    if (!name.trim()) return;
    await pipelineApi.createStage(name.trim());
    await refreshPipeline();
  }, [refreshPipeline]);

  const renameStage = useCallback(async (stageId: string, stageName: string) => {
    if (!stageName.trim()) return;
    const updated = await pipelineApi.updateStageName(stageId, stageName.trim());
    setStages(updated);
  }, []);

  const deleteStage = useCallback(async (stageId: string) => {
    const currentStage = stages.find((stage) => stage.id === stageId);
    if (!currentStage) return;

    const fallbackStage = stages.find((stage) => stage.id !== stageId);
    if (!fallbackStage) return;

    const affectedLeads = leads.filter((lead) => resolveLeadStageId(lead, stages) === stageId);

    for (const lead of affectedLeads) {
      updateLead({
        ...lead,
        pipelineStageId: fallbackStage.id,
        status: slugifyStageName(fallbackStage.nome),
        atualizadoEm: new Date().toISOString(),
      });

      const entry = await pipelineApi.recordLeadMovement({
        leadId: lead.id,
        fromStageId: stageId,
        toStageId: fallbackStage.id,
        fromStageNome: currentStage.nome,
        toStageNome: fallbackStage.nome,
        movidoPor: currentUser,
        observacao: `Lead realocado apos exclusao da etapa ${currentStage.nome}`,
      });
      setHistory((prev) => [entry, ...prev]);
    }

    const nextStages = await pipelineApi.deleteStage(stageId);
    setStages(nextStages);
  }, [currentUser, leads, stages, updateLead]);

  const reorderStages = useCallback(async (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) return;

    const ordered = [...stages];
    const [removed] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, removed);

    const updated = await pipelineApi.reorderStages(ordered.map((stage) => stage.id));
    setStages(updated);
  }, [stages]);

  const getLeadHistory = useCallback((leadId: string) => {
    return history.filter((entry) => entry.leadId === leadId);
  }, [history]);

  const getLeadSignals = useCallback((lead: Lead) => {
    const createdAt = new Date(lead.criadoEm).getTime();
    const updatedAt = new Date(lead.atualizadoEm).getTime();
    const now = Date.now();

    const isRecent = now - createdAt < 1000 * 60 * 60 * 48;
    const isStale = now - updatedAt > 1000 * 60 * 60 * 24 * 7;

    return { isRecent, isStale };
  }, []);

  return {
    stages,
    history,
    leadsByStage,
    draggingLeadId,
    setDraggingLeadId,
    moveLeadToStage,
    createStage,
    renameStage,
    deleteStage,
    reorderStages,
    getLeadHistory,
    getLeadSignals,
    refreshPipeline,
  };
}
