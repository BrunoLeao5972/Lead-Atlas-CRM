import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  UserCheck,
  Flame,
  Search,
  X,
  Phone,
  MapPin,
  ExternalLink,
  Navigation,
  Eye,
  Layers,
  LocateFixed,
} from 'lucide-react';
import type { Lead, Client, MapFilter } from '@/types/crm';
import LeafletMap, { type MapPoint } from '@/components/LeafletMap';

// ─── Constants ────────────────────────────────────────────

const FORTALEZA_CENTER: [number, number] = [-3.7319, -38.5267];

// ─── Helpers ──────────────────────────────────────────────

function getUniqueCities(
  leads: Lead[],
  clients: Client[],
  showLeads: boolean,
  showClients: boolean,
): string[] {
  const cities = new Set<string>();
  if (showLeads) leads.forEach((l) => l.cidade && cities.add(l.cidade));
  if (showClients) clients.forEach((c) => c.cidade && cities.add(c.cidade));
  return Array.from(cities).sort();
}

function getUniqueBairros(
  leads: Lead[],
  clients: Client[],
  showLeads: boolean,
  showClients: boolean,
  cityFilter: string,
): string[] {
  const bairros = new Set<string>();
  if (showLeads) {
    leads.forEach((l) => {
      if (l.bairro && (cityFilter === 'all' || l.cidade === cityFilter)) bairros.add(l.bairro);
    });
  }
  if (showClients) {
    clients.forEach((c) => {
      if (c.bairro && (cityFilter === 'all' || c.cidade === cityFilter)) bairros.add(c.bairro);
    });
  }
  return Array.from(bairros).sort();
}

// ─── Main Component ──────────────────────────────────────

interface MapPageProps {
  leads: Lead[];
  clients: Client[];
}

export default function MapPage({ leads, clients }: MapPageProps) {
  const navigate = useNavigate();

  // Filters
  const [filter, setFilter] = useState<MapFilter>({ showLeads: true, showClients: true });
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [bairroFilter, setBairroFilter] = useState<string>('all');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Derived data
  const cities = useMemo(
    () => getUniqueCities(leads, clients, filter.showLeads, filter.showClients),
    [leads, clients, filter.showLeads, filter.showClients],
  );
  const bairros = useMemo(
    () => getUniqueBairros(leads, clients, filter.showLeads, filter.showClients, cityFilter),
    [leads, clients, filter.showLeads, filter.showClients, cityFilter],
  );

  // Reset bairro when city changes or when the selected bairro is no longer available
  useEffect(() => {
    if (bairroFilter !== 'all' && !bairros.includes(bairroFilter)) {
      setBairroFilter('all');
    }
  }, [bairros, bairroFilter]);

  // Reset city when it's no longer available (e.g. type filter changed)
  useEffect(() => {
    if (cityFilter !== 'all' && !cities.includes(cityFilter)) {
      setCityFilter('all');
    }
  }, [cities, cityFilter]);

  const allPoints = useMemo<MapPoint[]>(() => {
    const leadPoints: MapPoint[] = leads.map((lead) => ({
      id: `lead-${lead.id}`,
      nome: lead.nome,
      telefone: lead.telefone,
      endereco: lead.endereco,
      lat: lead.lat,
      lng: lead.lng,
      tipo: 'lead' as const,
      status: lead.status,
      cidade: lead.cidade,
      bairro: lead.bairro,
    }));

    const clientPoints: MapPoint[] = clients.map((client) => ({
      id: `client-${client.id}`,
      nome: client.nome,
      telefone: client.telefone,
      endereco: client.endereco,
      lat: client.lat,
      lng: client.lng,
      tipo: 'cliente' as const,
      cidade: client.cidade,
      bairro: client.bairro,
    }));

    return [...leadPoints, ...clientPoints];
  }, [leads, clients]);

  const visiblePoints = useMemo(() => {
    return allPoints.filter((point) => {
      // Type filter
      if (point.tipo === 'lead' && !filter.showLeads) return false;
      if (point.tipo === 'cliente' && !filter.showClients) return false;

      // City filter
      if (cityFilter !== 'all' && point.cidade !== cityFilter) return false;

      // Bairro filter
      if (bairroFilter !== 'all' && point.bairro !== bairroFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = point.nome.toLowerCase().includes(q);
        const matchesAddress = point.endereco?.toLowerCase().includes(q);
        const matchesPhone = point.telefone?.toLowerCase().includes(q);
        if (!matchesName && !matchesAddress && !matchesPhone) return false;
      }

      return true;
    });
  }, [allPoints, filter, cityFilter, bairroFilter, searchQuery]);

  // Reset selected point when it becomes invisible
  useEffect(() => {
    if (selectedPointId && !visiblePoints.some((p) => p.id === selectedPointId)) {
      setSelectedPointId(null);
    }
  }, [visiblePoints, selectedPointId]);

  // Stats
  const leadCount = visiblePoints.filter((p) => p.tipo === 'lead').length;
  const clientCount = visiblePoints.filter((p) => p.tipo === 'cliente').length;

  const handlePointClick = (point: MapPoint) => {
    setSelectedPointId(point.id);
  };

  const clearFilters = () => {
    setFilter({ showLeads: true, showClients: true });
    setCityFilter('all');
    setBairroFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters =
    !filter.showLeads || !filter.showClients || cityFilter !== 'all' || bairroFilter !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <PageHeader title="Mapa" subtitle="Visualize leads e clientes no mapa interativo" />

      {/* ─── Controls Bar ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 relative z-[1100]">
        {/* Type filters */}
        <Button
          variant={filter.showLeads ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter((f) => ({ ...f, showLeads: !f.showLeads }))}
          className="gap-1.5"
        >
          <Users size={14} />
          Leads
          <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px]">{leadCount}</span>
        </Button>
        <Button
          variant={filter.showClients ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter((f) => ({ ...f, showClients: !f.showClients }))}
          className="gap-1.5"
        >
          <UserCheck size={14} />
          Clientes
          <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px]">{clientCount}</span>
        </Button>

        {/* Heatmap toggle */}
        <Button
          variant={showHeatmap ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowHeatmap((v) => !v)}
          className="gap-1.5"
        >
          <Flame size={14} />
          Heatmap
        </Button>

        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        {/* Region filters */}
        <Select value={cityFilter} onValueChange={(v) => { setCityFilter(v); setBairroFilter('all'); }}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent className="z-[1200]">
            <SelectItem value="all">Todas as cidades</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={bairroFilter} onValueChange={setBairroFilter}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="Bairro" />
          </SelectTrigger>
          <SelectContent className="z-[1200]">
            <SelectItem value="all">Todos os bairros</SelectItem>
            {bairros.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar nome, endereço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-8 w-[200px] text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-muted-foreground">
            <X size={12} /> Limpar filtros
          </Button>
        )}
      </div>

      {/* ─── Map + Sidebar ─────────────────────────────── */}
      <div className="flex-1 min-h-[500px] grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Map */}
        <div className="relative min-h-[500px] rounded-xl border border-border overflow-hidden shadow-sm bg-muted">
          <LeafletMap
            points={visiblePoints}
            center={FORTALEZA_CENTER}
            zoom={12}
            showHeatmap={showHeatmap}
            onPointClick={handlePointClick}
            selectedPointId={selectedPointId}
          />

          {/* Floating stats */}
          <div className="absolute left-3 bottom-3 z-[1000] flex gap-2">
            <div className="rounded-lg bg-card/90 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-md border border-border flex items-center gap-1.5">
              <Layers size={12} />
              {visiblePoints.length} pontos
            </div>
          </div>
        </div>

        {/* Sidebar – Point list */}
        <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pontos no mapa ({visiblePoints.length})
            </p>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2 max-h-[calc(500px-40px)]">
            {visiblePoints.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MapPin size={32} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum ponto encontrado</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Ajuste os filtros para ver resultados</p>
              </div>
            )}

            {visiblePoints.map((point) => {
              const isSelected = point.id === selectedPointId;
              return (
                <div
                  key={point.id}
                  onClick={() => setSelectedPointId(point.id)}
                  className={`rounded-lg border p-3 space-y-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-background hover:bg-muted/30 hover:border-muted-foreground/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{point.nome}</p>
                      {point.endereco && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          <MapPin size={10} className="inline mr-1" />
                          {point.endereco}
                        </p>
                      )}
                      {point.telefone && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <Phone size={10} className="inline mr-1" />
                          {point.telefone}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        point.tipo === 'lead'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
                      }`}
                    >
                      {point.tipo === 'lead' ? 'Lead' : 'Cliente'}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(point.tipo === 'lead' ? '/leads' : '/clientes');
                        }}
                      >
                        <Eye size={11} /> Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps?q=${point.lat},${point.lng}`, '_blank');
                        }}
                      >
                        <ExternalLink size={11} /> Maps
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`, '_blank');
                        }}
                      >
                        <Navigation size={11} /> Rota
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Legend ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground pb-2">
        <span className="font-medium text-foreground/70 flex items-center gap-1.5">
          <Layers size={12} /> Legenda:
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" /> Leads
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-teal-400 border-2 border-white shadow-sm" /> Clientes
        </span>
        {showHeatmap && (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-8 rounded-sm" style={{
              background: 'linear-gradient(90deg, #2563eb, #06b6d4, #22c55e, #f59e0b, #ef4444)',
            }} /> Densidade (heatmap)
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="h-5 w-5 rounded-full bg-primary/80 text-white text-[9px] font-bold flex items-center justify-center">5</span>
          Agrupamento (cluster)
        </span>
      </div>
    </div>
  );
}
