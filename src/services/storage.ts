/**
 * Local storage service for CRM data persistence.
 * Designed to be replaced with API calls when backend is ready.
 */

import type { Lead, Client } from '@/types/crm';

const LEADS_KEY = 'crm_leads';
const CLIENTS_KEY = 'crm_clients';

// ─── Leads ──────────────────────────────────────────────

export function getLeads(): Lead[] {
  try {
    const data = localStorage.getItem(LEADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLead(lead: Lead): void {
  const leads = getLeads();
  const index = leads.findIndex((l) => l.id === lead.id);
  if (index >= 0) {
    leads[index] = { ...lead, atualizadoEm: new Date().toISOString() };
  } else {
    leads.push(lead);
  }
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

export function deleteLead(id: string): void {
  const leads = getLeads().filter((l) => l.id !== id);
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

// ─── Clients ────────────────────────────────────────────

export function getClients(): Client[] {
  try {
    const data = localStorage.getItem(CLIENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveClient(client: Client): void {
  const clients = getClients();
  const index = clients.findIndex((c) => c.id === client.id);
  if (index >= 0) {
    clients[index] = { ...client, atualizadoEm: new Date().toISOString() };
  } else {
    clients.push(client);
  }
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

export function deleteClient(id: string): void {
  const clients = getClients().filter((c) => c.id !== id);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

// ─── Seed Data ──────────────────────────────────────────

export function seedDemoData(): void {
  if (getLeads().length > 0 || getClients().length > 0) return;

  const now = new Date().toISOString();

  const demoLeads: Lead[] = [
    {
      id: crypto.randomUUID(),
      nome: 'Maria Silva',
      telefone: '(11) 98765-4321',
      endereco: 'Av. Paulista, 1000 - São Paulo, SP',
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
      lat: -23.5635,
      lng: -46.6543,
      status: 'novo',
      responsavel: 'Camila Rocha',
      observacoes: 'Interessada em plano empresarial',
      criadoEm: now,
      atualizadoEm: now,
    },
    {
      id: crypto.randomUUID(),
      nome: 'João Santos',
      telefone: '(21) 99876-5432',
      endereco: 'Rua Copacabana, 500 - Rio de Janeiro, RJ',
      cep: '22021-001',
      logradouro: 'Rua Barata Ribeiro',
      numero: '500',
      bairro: 'Copacabana',
      cidade: 'Rio de Janeiro',
      uf: 'RJ',
      lat: -22.9711,
      lng: -43.1863,
      status: 'contato',
      responsavel: 'Henrique Lima',
      observacoes: 'Retornar ligação sexta-feira',
      criadoEm: now,
      atualizadoEm: now,
    },
    {
      id: crypto.randomUUID(),
      nome: 'Ana Oliveira',
      telefone: '(31) 97654-3210',
      endereco: 'Praça da Liberdade, 200 - Belo Horizonte, MG',
      cep: '30140-010',
      logradouro: 'Praça da Liberdade',
      numero: '200',
      bairro: 'Funcionários',
      cidade: 'Belo Horizonte',
      uf: 'MG',
      lat: -19.9332,
      lng: -43.9381,
      status: 'negociacao',
      responsavel: 'Luiza Medeiros',
      observacoes: 'Proposta enviada, aguardando retorno',
      criadoEm: now,
      atualizadoEm: now,
    },
  ];

  const demoClients: Client[] = [
    {
      id: crypto.randomUUID(),
      nome: 'Carlos Ferreira',
      telefone: '(41) 96543-2109',
      endereco: 'Rua XV de Novembro, 300 - Curitiba, PR',
      cep: '80020-310',
      logradouro: 'Rua XV de Novembro',
      numero: '300',
      bairro: 'Centro',
      cidade: 'Curitiba',
      uf: 'PR',
      lat: -25.4296,
      lng: -49.2713,
      historico: 'Cliente desde 2024. Plano Premium.',
      observacoes: 'Renovação em março',
      criadoEm: now,
      atualizadoEm: now,
    },
    {
      id: crypto.randomUUID(),
      nome: 'Fernanda Costa',
      telefone: '(51) 95432-1098',
      endereco: 'Av. Borges de Medeiros, 1500 - Porto Alegre, RS',
      cep: '90110-150',
      logradouro: 'Avenida Borges de Medeiros',
      numero: '1500',
      bairro: 'Praia de Belas',
      cidade: 'Porto Alegre',
      uf: 'RS',
      lat: -30.0346,
      lng: -51.2177,
      historico: 'Convertida de lead em janeiro.',
      observacoes: 'Satisfeita com o serviço',
      criadoEm: now,
      atualizadoEm: now,
    },
  ];

  demoLeads.forEach(saveLead);
  demoClients.forEach(saveClient);
}
