/** Core CRM types */

export type LeadStatus = string;

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  lat: number;
  lng: number;
  status: LeadStatus;
  pipelineStageId?: string;
  responsavel?: string;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PipelineStage {
  id: string;
  nome: string;
  ordem: number;
  statusKey: string;
  cor: string;
  isSystem?: boolean;
}

export interface LeadHistoryEntry {
  id: string;
  leadId: string;
  fromStageId?: string;
  toStageId: string;
  fromStageNome?: string;
  toStageNome: string;
  movidoPor: string;
  movidoEm: string;
  observacao?: string;
}

export interface PipelineConfig {
  id: string;
  nome: string;
  stages: PipelineStage[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface Client {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  lat: number;
  lng: number;
  historico: string;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
  convertidoDeLeadId?: string;
}

export interface MapFilter {
  showLeads: boolean;
  showClients: boolean;
}

export type ThemeMode = 'light' | 'dark';

export const LEAD_STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  contato: 'Contato',
  proposta: 'Proposta',
  fechado: 'Fechado',
  negociacao: 'Negociação',
  perdido: 'Perdido',
  convertido: 'Convertido',
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  novo: 'bg-status-new',
  contato: 'bg-status-contact',
  proposta: 'bg-status-negotiation',
  fechado: 'bg-status-converted',
  negociacao: 'bg-status-negotiation',
  perdido: 'bg-status-lost',
  convertido: 'bg-status-converted',
};
