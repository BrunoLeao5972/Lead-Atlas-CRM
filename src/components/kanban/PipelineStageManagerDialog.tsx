import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { PipelineStage } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface PipelineStageManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: PipelineStage[];
  onCreateStage: (name: string) => void | Promise<void>;
  onRenameStage: (stageId: string, stageName: string) => void | Promise<void>;
  onDeleteStage: (stageId: string) => void | Promise<void>;
  onReorderStage: (sourceIndex: number, targetIndex: number) => void | Promise<void>;
}

export default function PipelineStageManagerDialog({
  open,
  onOpenChange,
  stages,
  onCreateStage,
  onRenameStage,
  onDeleteStage,
  onReorderStage,
}: PipelineStageManagerDialogProps) {
  const [newStageName, setNewStageName] = useState('');
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setDraftNames((prev) => {
      const nextEntries = Object.entries(prev).filter(([stageId]) => stages.some((stage) => stage.id === stageId));
      return nextEntries.length === Object.keys(prev).length ? prev : Object.fromEntries(nextEntries);
    });
  }, [stages]);

  const stageDrafts = useMemo(() => {
    return stages.map((stage) => ({
      ...stage,
      draftName: draftNames[stage.id] ?? stage.nome,
    }));
  }, [draftNames, stages]);

  const handleCreateStage = async () => {
    const trimmedName = newStageName.trim();
    if (!trimmedName || isBusy) return;

    setIsBusy(true);
    try {
      await onCreateStage(trimmedName);
      setNewStageName('');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRenameStage = async (stageId: string, stageName: string) => {
    const trimmedName = stageName.trim();
    if (!trimmedName || isBusy) return;

    setIsBusy(true);
    try {
      await onRenameStage(stageId, trimmedName);
      setDraftNames((prev) => {
        const next = { ...prev };
        delete next[stageId];
        return next;
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleReorderStage = async (sourceIndex: number, targetIndex: number) => {
    if (isBusy || sourceIndex === targetIndex) return;

    setIsBusy(true);
    try {
      await onReorderStage(sourceIndex, targetIndex);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (isBusy) return;

    setIsBusy(true);
    try {
      await onDeleteStage(stageId);
      setDraftNames((prev) => {
        const next = { ...prev };
        delete next[stageId];
        return next;
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Personalizar Funil de Vendas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Input
              value={newStageName}
              onChange={(event) => setNewStageName(event.target.value)}
              placeholder="Nome da nova etapa"
              disabled={isBusy}
            />
            <Button
              type="button"
              onClick={handleCreateStage}
              disabled={!newStageName.trim() || isBusy}
            >
              <Plus size={14} className="mr-1" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {stageDrafts.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.cor }} />
                <Input
                  value={stage.draftName}
                  onChange={(event) => setDraftNames((prev) => ({ ...prev, [stage.id]: event.target.value }))}
                  disabled={isBusy}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRenameStage(stage.id, stage.draftName)}
                  disabled={!stage.draftName.trim() || isBusy}
                >
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleReorderStage(index, Math.max(0, index - 1))}
                  disabled={index === 0 || isBusy}
                >
                  <ArrowUp size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleReorderStage(index, Math.min(stageDrafts.length - 1, index + 1))}
                  disabled={index === stageDrafts.length - 1 || isBusy}
                >
                  <ArrowDown size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDeleteStage(stage.id)}
                  disabled={stage.isSystem || isBusy}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
