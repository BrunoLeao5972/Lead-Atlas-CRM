import { useState, useEffect } from 'react';
import type { Client } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { geocodeAddress, geocodeStructuredAddress } from '@/lib/googleMaps';
import { extractCep, lookupAddressByCep } from '@/lib/viaCep';
import { formatPhoneWithDdd } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave: (data: Omit<Client, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
}

const INITIAL: Omit<Client, 'id' | 'criadoEm' | 'atualizadoEm'> = {
  nome: '',
  telefone: '',
  endereco: '',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
  lat: -23.5505,
  lng: -46.6333,
  historico: '',
  observacoes: '',
};

export default function ClientFormDialog({ open, onOpenChange, client, onSave }: ClientFormDialogProps) {
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const buildEndereco = (data: typeof form) => {
    const firstLine = [data.logradouro.trim(), data.numero.trim()].filter(Boolean).join(', ');
    const location = [data.bairro.trim(), `${data.cidade.trim()} - ${data.uf.trim()}`].filter(Boolean).join(', ');
    const cepPart = data.cep.trim() ? `CEP ${data.cep.trim()}` : '';
    return [firstLine, location, cepPart].filter(Boolean).join(', ');
  };

  const handleCepLookup = async () => {
    const cep = extractCep(form.cep);
    if (!cep) return;

    setSearchingCep(true);
    const viaCep = await lookupAddressByCep(cep);
    setSearchingCep(false);

    if (!viaCep) {
      toast({
        title: 'CEP nao encontrado',
        description: 'Confira o CEP digitado e tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      cep: viaCep.cep,
      logradouro: viaCep.logradouro,
      bairro: viaCep.bairro,
      cidade: viaCep.localidade,
      uf: viaCep.uf,
    }));
  };

  useEffect(() => {
    if (client) {
      setForm({
        nome: client.nome,
        telefone: client.telefone,
        endereco: client.endereco,
        cep: client.cep ?? '',
        logradouro: client.logradouro ?? '',
        numero: client.numero ?? '',
        bairro: client.bairro ?? '',
        cidade: client.cidade ?? '',
        uf: client.uf ?? '',
        lat: client.lat,
        lng: client.lng,
        historico: client.historico,
        observacoes: client.observacoes,
        convertidoDeLeadId: client.convertidoDeLeadId,
      });
    } else {
      setForm(INITIAL);
    }
    setSubmitting(false);
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const enderecoDigitado = buildEndereco(form);
    if (!enderecoDigitado) return;

    setSubmitting(true);

    let geocoded = await geocodeStructuredAddress({
      cep: form.cep,
      logradouro: form.logradouro,
      numero: form.numero,
      bairro: form.bairro,
      cidade: form.cidade,
      uf: form.uf,
    });

    if (!geocoded) {
      geocoded = await geocodeAddress(enderecoDigitado);
    }

    if (!geocoded && form.cidade.trim() && form.uf.trim()) {
      geocoded = await geocodeAddress(`${form.cidade.trim()} - ${form.uf.trim()}, Brasil`);
    }

    onSave({
      ...form,
      endereco: enderecoDigitado,
      lat: geocoded?.lat ?? form.lat,
      lng: geocoded?.lng ?? form.lng,
    });

    if (!geocoded) {
      toast({
        title: 'Endereco salvo sem coordenadas precisas',
        description: 'O pin no mapa sera aberto pela busca do endereco informado.',
      });
    }

    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="c-nome">Nome *</Label>
            <Input id="c-nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-telefone">Telefone</Label>
            <Input
              id="c-telefone"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: formatPhoneWithDdd(e.target.value) })}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-cep">CEP *</Label>
            <Input
              id="c-cep"
              required
              value={form.cep}
              onChange={(e) => setForm({ ...form, cep: formatCep(e.target.value) })}
              onBlur={handleCepLookup}
              placeholder="00000-000"
            />
            <p className="text-xs text-muted-foreground">
              {searchingCep ? 'Buscando CEP...' : 'Ao informar o CEP, rua, bairro, cidade e UF sao preenchidos automaticamente.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-logradouro">Rua *</Label>
              <Input
                id="c-logradouro"
                required
                value={form.logradouro}
                onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-numero">Numero *</Label>
              <Input
                id="c-numero"
                required
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="c-bairro">Bairro *</Label>
              <Input
                id="c-bairro"
                required
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-cidade">Cidade *</Label>
              <Input
                id="c-cidade"
                required
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-uf">UF *</Label>
            <Input
              id="c-uf"
              required
              maxLength={2}
              value={form.uf}
              onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
              placeholder="SP"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-historico">Histórico</Label>
            <Textarea id="c-historico" rows={3} value={form.historico} onChange={(e) => setForm({ ...form, historico: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-obs">Observações</Label>
            <Textarea id="c-obs" rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Validando endereco...' : 'Salvar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
