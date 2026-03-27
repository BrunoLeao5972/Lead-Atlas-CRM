import { Edit3, Trash2 } from 'lucide-react';
import type { Lead, PipelineStage } from '@/types/crm';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import KanbanLeadCard from '@/components/kanban/KanbanLeadCard';

interface KanbanStageColumnProps {
  stage: PipelineStage;
  leads: Lead[];
  draggingLeadId: string | null;
  onLeadClick: (lead: Lead) => void;
  onDragLeadStart: (leadId: string) => void;
  onDragLeadEnd: () => void;
  onDropLead: (stageId: string, leadId: string) => void;
  onEditStage: (stage: PipelineStage) => void;
  onDeleteStage: (stage: PipelineStage) => void;
  getLeadSignals: (lead: Lead) => { isRecent: boolean; isStale: boolean };
}

export default function KanbanStageColumn({
  stage,
  leads,
  draggingLeadId,
  onLeadClick,
  onDragLeadStart,
  onDragLeadEnd,
  onDropLead,
  onEditStage,
  onDeleteStage,
  getLeadSignals,
}: KanbanStageColumnProps) {
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const leadId = event.dataTransfer.getData('text/plain');
    if (leadId) onDropLead(stage.id, leadId);
  };

  return (
    <section
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className={cn(
        'flex w-[320px] flex-shrink-0 flex-col rounded-2xl border border-border/70 bg-muted/30',
        'max-h-[calc(100vh-220px)] min-h-[420px] overflow-hidden',
      )}
    >
      <header className="border-b border-border/70 bg-background/70 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.cor }} />
            <h3 className="text-sm font-semibold text-foreground">{stage.nome}</h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {leads.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditStage(stage)}>
              <Edit3 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => onDeleteStage(stage)}
              disabled={stage.isSystem}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {leads.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
            Arraste um lead para esta etapa
          </div>
        ) : (
          leads.map((lead) => {
            const { isRecent, isStale } = getLeadSignals(lead);
            return (
              <KanbanLeadCard
                key={lead.id}
                lead={lead}
                stageName={stage.nome}
                isDragging={draggingLeadId === lead.id}
                isRecent={isRecent}
                isStale={isStale}
                onClick={onLeadClick}
                onDragStart={onDragLeadStart}
                onDragEnd={onDragLeadEnd}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
