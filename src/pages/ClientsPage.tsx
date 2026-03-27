import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import ClientFormDialog from '@/components/ClientFormDialog';
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
import { Plus, Search, MapPin, Pencil, Trash2 } from 'lucide-react';
import type { Client } from '@/types/crm';

interface ClientsPageProps {
  clients: Client[];
  onAdd: (data: Omit<Client, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  onUpdate: (client: Client) => void;
  onDelete: (id: string) => void;
}

export default function ClientsPage({ clients, onAdd, onUpdate, onDelete }: ClientsPageProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = clients.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.endereco.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data: Omit<Client, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    if (editing) {
      onUpdate({ ...editing, ...data, atualizadoEm: new Date().toISOString() });
      setEditing(null);
    } else {
      onAdd(data);
    }
  };

  const openMap = (client: Client) => {
    navigate(`/mapa?type=client&lat=${client.lat}&lng=${client.lng}&id=${client.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} cliente${clients.length !== 1 ? 's' : ''} cadastrado${clients.length !== 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} className="mr-1.5" /> Novo Cliente
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar clientes..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Telefone</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Endereço</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Histórico</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{client.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{client.telefone}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{client.endereco}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">{client.historico}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver no mapa" onClick={() => openMap(client)}>
                          <MapPin size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => { setEditing(client); setFormOpen(true); }}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={() => setDeleteId(client.id)}>
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

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editing} onSave={handleSave} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
