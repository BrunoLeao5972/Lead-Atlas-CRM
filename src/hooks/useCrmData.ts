import { useState, useCallback, useEffect } from 'react';
import type { Lead, Client } from '@/types/crm';
import * as storage from '@/services/storage';

/**
 * Central hook for CRM data management.
 * Provides reactive access to leads and clients with CRUD operations.
 */
export function useCrmData() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const refresh = useCallback(() => {
    setLeads(storage.getLeads());
    setClients(storage.getClients());
  }, []);

  useEffect(() => {
    storage.seedDemoData();
    refresh();
  }, [refresh]);

  // ─── Lead Operations ─────────────────────────────

  const addLead = useCallback((lead: Omit<Lead, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const now = new Date().toISOString();
    const newLead: Lead = {
      ...lead,
      responsavel: lead.responsavel?.trim() || 'Equipe Comercial',
      id: crypto.randomUUID(),
      criadoEm: now,
      atualizadoEm: now,
    };
    storage.saveLead(newLead);
    refresh();
    return newLead;
  }, [refresh]);

  const updateLead = useCallback((lead: Lead) => {
    storage.saveLead(lead);
    refresh();
  }, [refresh]);

  const removeLead = useCallback((id: string) => {
    storage.deleteLead(id);
    refresh();
  }, [refresh]);

  const convertLeadToClient = useCallback((leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const now = new Date().toISOString();
    const client: Client = {
      id: crypto.randomUUID(),
      nome: lead.nome,
      telefone: lead.telefone,
      endereco: lead.endereco,
      cep: lead.cep,
      logradouro: lead.logradouro,
      numero: lead.numero,
      bairro: lead.bairro,
      cidade: lead.cidade,
      uf: lead.uf,
      lat: lead.lat,
      lng: lead.lng,
      historico: `Convertido de lead em ${new Date().toLocaleDateString('pt-BR')}`,
      observacoes: lead.observacoes,
      criadoEm: now,
      atualizadoEm: now,
      convertidoDeLeadId: lead.id,
    };

    storage.saveClient(client);
    storage.saveLead({ ...lead, status: 'convertido', atualizadoEm: now });
    refresh();
  }, [leads, refresh]);

  // ─── Client Operations ───────────────────────────

  const addClient = useCallback((client: Omit<Client, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const now = new Date().toISOString();
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      criadoEm: now,
      atualizadoEm: now,
    };
    storage.saveClient(newClient);
    refresh();
    return newClient;
  }, [refresh]);

  const updateClient = useCallback((client: Client) => {
    storage.saveClient(client);
    refresh();
  }, [refresh]);

  const removeClient = useCallback((id: string) => {
    storage.deleteClient(id);
    refresh();
  }, [refresh]);

  return {
    leads,
    clients,
    addLead,
    updateLead,
    removeLead,
    convertLeadToClient,
    addClient,
    updateClient,
    removeClient,
    refresh,
  };
}
