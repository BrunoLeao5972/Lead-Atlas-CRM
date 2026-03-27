import { useMemo, useState } from 'react';
import { Filter, Plus } from 'lucide-react';
import type { Lead, PipelineStage } from '@/types/crm';
import { useSalesPipeline } from '@/hooks/useSalesPipeline';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LeadFormDialog from '@/components/LeadFormDialog';
import KanbanStageColumn from '@/components/kanban/KanbanStageColumn';
import PipelineStageManagerDialog from '@/components/kanban/PipelineStageManagerDialog';
import LeadTimelineDialog from '@/components/kanban/LeadTimelineDialog';
import { toast } from '@/hooks/use-toast';

interface FunnelPageProps {
  leads: Lead[];
  onAdd: (data: Omit<Lead, 'id' | 'criadoEm' | 'atualizadoEm'>) => Lead;
  onUpdate: (lead: Lead) => void;
}

export default function FunnelPage({ leads, onAdd, onUpdate }: FunnelPageProps) {
  const [search, setSearch] = useState('');
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const pipeline = useSalesPipeline({ leads, updateLead: onUpdate });

  const filteredIds = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return null;

    const ids = new Set<string>();
    leads.forEach((lead) => {
      if (
        lead.nome.toLowerCase().includes(query) ||
        lead.telefone.toLowerCase().includes(query) ||
        (lead.responsavel?.toLowerCase().includes(query) ?? false)
      ) {
        ids.add(lead.id);
      }
    });

    return ids;
  }, [leads, search]);

  const handleLeadDrop = (stageId: string, leadId: string) => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    pipeline.moveLeadToStage(lead, stageId);
  };

  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadDialogOpen(true);
  };

  const handleDeleteStage = async (stage: PipelineStage) => {
    if (stage.isSystem) {
      toast({
        title: 'Etapa protegida',
        description: 'As etapas padrão não podem ser removidas.',
        variant: 'destructive',
      });
      return;
    }
    await pipeline.deleteStage(stage.id);
  };

  const handleDeleteStageById = async (stageId: string) => {
    const stage = pipeline.stages.find((item) => item.id === stageId);
    if (!stage) {
      toast({
        title: 'Etapa não encontrada',
        description: 'Atualize a página e tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await handleDeleteStage(stage);
    } catch {
      toast({
        title: 'Não foi possível excluir a etapa',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    }
  };

  const handleReorderStage = async (sourceIndex: number, targetIndex: number) => {
    const isOutOfBounds =
      sourceIndex < 0 ||
      targetIndex < 0 ||
      sourceIndex >= pipeline.stages.length ||
      targetIndex >= pipeline.stages.length;

    if (isOutOfBounds || sourceIndex === targetIndex) return;

    try {
      await pipeline.reorderStages(sourceIndex, targetIndex);
    } catch {
      toast({
        title: 'Não foi possível reordenar as etapas',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveLead = (payload: Omit<Lead, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const createdLead = onAdd(payload);
    pipeline.moveLeadToStage(createdLead, pipeline.stages[0]?.id ?? 'stage-novo');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Funil de Vendas"
        subtitle="Kanban de oportunidades com histórico completo de movimentações"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setStageModalOpen(true)}>
              <Filter size={15} className="mr-1.5" />
              Personalizar Etapas
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={15} className="mr-1.5" />
              Novo Lead
            </Button>
          </div>
        }
      />

      <div className="max-w-sm">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, telefone ou responsável"
        />
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="flex min-h-[520px] gap-4">
          {pipeline.stages.map((stage) => {
            const baseLeads = pipeline.leadsByStage.get(stage.id) ?? [];
            const stageLeads = filteredIds
              ? baseLeads.filter((lead) => filteredIds.has(lead.id))
              : baseLeads;

            return (
              <KanbanStageColumn
                key={stage.id}
                stage={stage}
                leads={stageLeads}
                draggingLeadId={pipeline.draggingLeadId}
                onLeadClick={handleOpenLead}
                onDragLeadStart={pipeline.setDraggingLeadId}
                onDragLeadEnd={() => pipeline.setDraggingLeadId(null)}
                onDropLead={handleLeadDrop}
                onEditStage={() => setStageModalOpen(true)}
                onDeleteStage={handleDeleteStage}
                getLeadSignals={pipeline.getLeadSignals}
              />
            );
          })}
        </div>
      </div>

      <PipelineStageManagerDialog
        open={stageModalOpen}
        onOpenChange={setStageModalOpen}
        stages={pipeline.stages}
        onCreateStage={pipeline.createStage}
        onRenameStage={pipeline.renameStage}
        onDeleteStage={handleDeleteStageById}
        onReorderStage={handleReorderStage}
      />

      <LeadTimelineDialog
        lead={selectedLead}
        history={selectedLead ? pipeline.getLeadHistory(selectedLead.id) : []}
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
      />

      <LeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={null}
        onSave={handleSaveLead}
      />
    </div>
  );
}
