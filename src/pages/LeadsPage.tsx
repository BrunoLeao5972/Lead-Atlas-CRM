import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import LeadFormDialog from '@/components/LeadFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, MapPin, Pencil, Trash2, UserCheck } from 'lucide-react';
import type { Lead } from '@/types/crm';

interface LeadsPageProps {
  leads: Lead[];
  onAdd: (data: Omit<Lead, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  onUpdate: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onConvert: (id: string) => void;
}

export default function LeadsPage({ leads, onAdd, onUpdate, onDelete, onConvert }: LeadsPageProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = leads.filter((l) =>
    l.nome.toLowerCase().includes(search.toLowerCase()) ||
    l.endereco.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data: Omit<Lead, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    if (editing) {
      onUpdate({ ...editing, ...data, atualizadoEm: new Date().toISOString() });
      setEditing(null);
    } else {
      onAdd(data);
    }
  };

  const openMap = (lead: Lead) => {
    navigate(`/mapa?type=lead&lat=${lead.lat}&lng=${lead.lng}&id=${lead.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} lead${leads.length !== 1 ? 's' : ''} cadastrado${leads.length !== 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} className="mr-1.5" /> Novo Lead
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar leads..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Telefone</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Endereço</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{lead.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{lead.telefone}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{lead.endereco}</td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver no mapa" onClick={() => openMap(lead)}>
                          <MapPin size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => { setEditing(lead); setFormOpen(true); }}>
                          <Pencil size={15} />
                        </Button>
                        {lead.status !== 'convertido' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-status-converted" title="Converter" onClick={() => onConvert(lead.id)}>
                            <UserCheck size={15} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={() => setDeleteId(lead.id)}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Dialog */}
      <LeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={editing}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
