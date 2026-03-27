import { Clock3, UserCircle2 } from 'lucide-react';
import type { Lead, LeadHistoryEntry } from '@/types/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LeadTimelineDialogProps {
  lead: Lead | null;
  history: LeadHistoryEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadTimelineDialog({ lead, history, open, onOpenChange }: LeadTimelineDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Lead</DialogTitle>
        </DialogHeader>

        {!lead ? null : (
          <div className="space-y-5 pt-1">
            <section className="rounded-xl border border-border p-3">
              <h3 className="text-sm font-semibold text-foreground">{lead.nome}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{lead.telefone || 'Telefone não informado'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{lead.endereco || 'Endereço não informado'}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <UserCircle2 size={13} />
                Responsável: {lead.responsavel?.trim() || 'Sem responsável'}
              </p>
            </section>

            <section>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Histórico de movimentação</h4>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    Nenhuma movimentação registrada para este lead.
                  </div>
                ) : (
                  history.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
                      <p className="text-xs font-medium text-foreground">
                        {entry.fromStageNome ? `${entry.fromStageNome} -> ${entry.toStageNome}` : `Entrada em ${entry.toStageNome}`}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{entry.observacao || 'Movimentação de etapa registrada.'}</p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <UserCircle2 size={12} />
                          {entry.movidoPor}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={12} />
                          {new Date(entry.movidoEm).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
