import { Clock3, Phone, UserCircle2 } from 'lucide-react';
import type { Lead } from '@/types/crm';
import { cn } from '@/lib/utils';

interface KanbanLeadCardProps {
  lead: Lead;
  stageName: string;
  isDragging: boolean;
  isRecent: boolean;
  isStale: boolean;
  onClick: (lead: Lead) => void;
  onDragStart: (leadId: string) => void;
  onDragEnd: () => void;
}

export default function KanbanLeadCard({
  lead,
  stageName,
  isDragging,
  isRecent,
  isStale,
  onClick,
  onDragStart,
  onDragEnd,
}: KanbanLeadCardProps) {
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', lead.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(lead.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onClick(lead)}
      className={cn(
        'group cursor-pointer rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md',
        isDragging && 'opacity-60 scale-[0.98]',
      )}
    >
      <header className="mb-2.5 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground leading-tight">{lead.nome}</h4>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {stageName}
        </span>
      </header>

      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <Phone size={13} />
          {lead.telefone || 'Telefone não informado'}
        </p>
        <p className="flex items-center gap-1.5">
          <UserCircle2 size={13} />
          {lead.responsavel?.trim() || 'Sem responsável'}
        </p>
      </div>

      <footer className="mt-3 flex items-center gap-1.5">
        {isRecent && (
          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Recente
          </span>
        )}
        {isStale && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
            <Clock3 size={10} />
            Parado
          </span>
        )}
      </footer>
    </article>
  );
}
