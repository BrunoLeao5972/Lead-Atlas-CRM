import type { LeadHistoryEntry, PipelineStage } from '@/types/crm';
import {
  appendPipelineStage,
  listLeadHistoryByLead,
  loadLeadHistory,
  loadPipelineStages,
  removePipelineStage,
  renamePipelineStage,
  reorderPipelineStages,
  saveLeadHistoryEntry,
} from '@/services/pipelineStorage';

/**
 * API adapter for pipeline operations.
 * This preserves a backend-like contract and can be swapped by HTTP requests later.
 */
export const pipelineApi = {
  async listStages(): Promise<PipelineStage[]> {
    return loadPipelineStages();
  },

  async createStage(name: string): Promise<PipelineStage> {
    return appendPipelineStage(name);
  },

  async updateStageName(stageId: string, name: string): Promise<PipelineStage[]> {
    return renamePipelineStage(stageId, name);
  },

  async deleteStage(stageId: string): Promise<PipelineStage[]> {
    return removePipelineStage(stageId);
  },

  async reorderStages(orderedIds: string[]): Promise<PipelineStage[]> {
    return reorderPipelineStages(orderedIds);
  },

  async listHistory(): Promise<LeadHistoryEntry[]> {
    return loadLeadHistory();
  },

  async listLeadHistory(leadId: string): Promise<LeadHistoryEntry[]> {
    return listLeadHistoryByLead(leadId);
  },

  async recordLeadMovement(entry: Omit<LeadHistoryEntry, 'id' | 'movidoEm'>): Promise<LeadHistoryEntry> {
    return saveLeadHistoryEntry(entry);
  },
};
