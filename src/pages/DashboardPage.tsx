import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { Users, UserCheck, TrendingUp, AlertCircle } from 'lucide-react';
import type { Lead, Client, LeadStatus } from '@/types/crm';
import { LEAD_STATUS_LABELS } from '@/types/crm';

interface DashboardPageProps {
  leads: Lead[];
  clients: Client[];
}

export default function DashboardPage({ leads, clients }: DashboardPageProps) {
  const navigate = useNavigate();

  const statusCounts = useMemo(() => {
    const counts: Record<LeadStatus, number> = {
      novo: 0, contato: 0, negociacao: 0, perdido: 0, convertido: 0,
    };
    leads.forEach((l) => { counts[l.status]++; });
    return counts;
  }, [leads]);

  const recentLeads = useMemo(
    () => [...leads].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 5),
    [leads],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dashboard" subtitle="Visão geral do seu CRM" />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Leads"
          value={leads.length}
          icon={<Users size={20} />}
        />
        <StatCard
          title="Total de Clientes"
          value={clients.length}
          icon={<UserCheck size={20} />}
          accent="bg-status-converted/10 text-status-converted"
        />
        <StatCard
          title="Em Negociação"
          value={statusCounts.negociacao}
          icon={<TrendingUp size={20} />}
          accent="bg-status-negotiation/10 text-status-negotiation"
        />
        <StatCard
          title="Leads Perdidos"
          value={statusCounts.perdido}
          icon={<AlertCircle size={20} />}
          accent="bg-status-lost/10 text-status-lost"
        />
      </div>

      {/* Status breakdown + recent leads */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-card-foreground mb-4">Leads por Status</h2>
          <div className="space-y-3">
            {(Object.entries(statusCounts) as [LeadStatus, number][]).map(([status, count]) => {
              const pct = leads.length > 0 ? (count / leads.length) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === 'novo' ? 'bg-status-new' :
                        status === 'contato' ? 'bg-status-contact' :
                        status === 'negociacao' ? 'bg-status-negotiation' :
                        status === 'perdido' ? 'bg-status-lost' :
                        'bg-status-converted'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-card-foreground mb-4">Leads Recentes</h2>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lead cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => navigate('/leads')}
                  className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{lead.nome}</p>
                    <p className="text-xs text-muted-foreground">{lead.endereco}</p>
                  </div>
                  <StatusBadge status={lead.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
