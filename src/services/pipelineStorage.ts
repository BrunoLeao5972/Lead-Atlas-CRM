import type { Lead, LeadHistoryEntry, PipelineStage } from '@/types/crm';

const PIPELINE_STAGES_KEY = 'crm_pipeline_stages';
const LEAD_HISTORY_KEY = 'crm_lead_history';

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'stage-novo', nome: 'Novo', ordem: 0, statusKey: 'novo', cor: '#0ea5e9', isSystem: true },
  { id: 'stage-contato', nome: 'Contato', ordem: 1, statusKey: 'contato', cor: '#f59e0b', isSystem: true },
  { id: 'stage-proposta', nome: 'Proposta', ordem: 2, statusKey: 'proposta', cor: '#8b5cf6', isSystem: true },
  { id: 'stage-fechado', nome: 'Fechado', ordem: 3, statusKey: 'fechado', cor: '#10b981', isSystem: true },
];

const LEGACY_STATUS_MAP: Record<string, string> = {
  novo: 'stage-novo',
  contato: 'stage-contato',
  negociacao: 'stage-proposta',
  convertido: 'stage-fechado',
};

function normalizeStageOrder(stages: PipelineStage[]): PipelineStage[] {
  return [...stages]
    .sort((a, b) => a.ordem - b.ordem)
    .map((stage, index) => ({ ...stage, ordem: index }));
}

export function getDefaultPipelineStages(): PipelineStage[] {
  return normalizeStageOrder(DEFAULT_STAGES);
}

export function loadPipelineStages(): PipelineStage[] {
  try {
    const raw = localStorage.getItem(PIPELINE_STAGES_KEY);
    if (!raw) return getDefaultPipelineStages();
    const parsed = JSON.parse(raw) as PipelineStage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return getDefaultPipelineStages();
    return normalizeStageOrder(parsed);
  } catch {
    return getDefaultPipelineStages();
  }
}

export function persistPipelineStages(stages: PipelineStage[]): PipelineStage[] {
  const ordered = normalizeStageOrder(stages);
  localStorage.setItem(PIPELINE_STAGES_KEY, JSON.stringify(ordered));
  return ordered;
}

export function appendPipelineStage(name: string): PipelineStage {
  const stages = loadPipelineStages();
  const stage: PipelineStage = {
    id: crypto.randomUUID(),
    nome: name,
    ordem: stages.length,
    statusKey: slugifyStageName(name),
    cor: '#64748b',
    isSystem: false,
  };
  persistPipelineStages([...stages, stage]);
  return stage;
}

export function renamePipelineStage(stageId: string, name: string): PipelineStage[] {
  const stages = loadPipelineStages();
  const renamed = stages.map((stage) =>
    stage.id === stageId ? { ...stage, nome: name, statusKey: stage.isSystem ? stage.statusKey : slugifyStageName(name) } : stage,
  );
  return persistPipelineStages(renamed);
}

export function removePipelineStage(stageId: string): PipelineStage[] {
  const filtered = loadPipelineStages().filter((stage) => stage.id !== stageId);
  return persistPipelineStages(filtered.length > 0 ? filtered : getDefaultPipelineStages());
}

export function reorderPipelineStages(orderedIds: string[]): PipelineStage[] {
  const current = loadPipelineStages();
  const byId = new Map(current.map((stage) => [stage.id, stage]));
  const reordered = orderedIds
    .map((id) => byId.get(id))
    .filter((stage): stage is PipelineStage => Boolean(stage));

  const missing = current.filter((stage) => !orderedIds.includes(stage.id));
  return persistPipelineStages([...reordered, ...missing]);
}

export function loadLeadHistory(): LeadHistoryEntry[] {
  try {
    const raw = localStorage.getItem(LEAD_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeadHistoryEntry[];
    return Array.isArray(parsed)
      ? [...parsed].sort((a, b) => new Date(b.movidoEm).getTime() - new Date(a.movidoEm).getTime())
      : [];
  } catch {
    return [];
  }
}

export function saveLeadHistoryEntry(entry: Omit<LeadHistoryEntry, 'id' | 'movidoEm'>): LeadHistoryEntry {
  const current = loadLeadHistory();
  const newEntry: LeadHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    movidoEm: new Date().toISOString(),
  };

  localStorage.setItem(LEAD_HISTORY_KEY, JSON.stringify([newEntry, ...current]));
  return newEntry;
}

export function listLeadHistoryByLead(leadId: string): LeadHistoryEntry[] {
  return loadLeadHistory().filter((item) => item.leadId === leadId);
}

export function resolveLeadStageId(lead: Lead, stages: PipelineStage[]): string {
  if (lead.pipelineStageId && stages.some((stage) => stage.id === lead.pipelineStageId)) {
    return lead.pipelineStageId;
  }

  const mapped = LEGACY_STATUS_MAP[lead.status?.toLowerCase() ?? ''];
  if (mapped && stages.some((stage) => stage.id === mapped)) {
    return mapped;
  }

  return stages[0]?.id ?? 'stage-novo';
}

export function slugifyStageName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
