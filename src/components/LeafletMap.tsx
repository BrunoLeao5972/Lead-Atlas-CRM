import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';

// ─── Types ────────────────────────────────────────────────

export interface MapPoint {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  status?: string;
  lat: number;
  lng: number;
  tipo: 'lead' | 'cliente';
  cidade?: string;
  bairro?: string;
}

interface LeafletMapProps {
  points: MapPoint[];
  center: [number, number];
  zoom: number;
  showHeatmap: boolean;
  onPointClick?: (point: MapPoint) => void;
  selectedPointId?: string | null;
}

// ─── Custom markers ───────────────────────────────────────

function createSvgIcon(tipo: 'lead' | 'cliente', isSelected: boolean) {
  const color = tipo === 'lead' ? '#f59e0b' : '#2dd4bf';
  const border = isSelected ? '#1e293b' : '#fff';
  const size = isSelected ? 18 : 14;
  const anchor = isSelected ? 18 : 14;

  return L.divIcon({
    className: 'leaflet-marker-custom',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 3px solid ${border};
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      transition: transform 0.15s;
      ${isSelected ? 'transform: scale(1.3);' : ''}
    "></div>`,
    iconSize: [anchor, anchor],
    iconAnchor: [anchor / 2, anchor / 2],
    popupAnchor: [0, -(anchor / 2 + 4)],
  });
}

// ─── Cluster icon factory ─────────────────────────────────

function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  let size = 36;
  let cls = 'cluster-small';

  if (count >= 100) {
    size = 50;
    cls = 'cluster-large';
  } else if (count >= 10) {
    size = 42;
    cls = 'cluster-medium';
  }

  return L.divIcon({
    html: `<div class="leaflet-cluster-icon ${cls}"><span>${count}</span></div>`,
    className: 'leaflet-marker-cluster-custom',
    iconSize: L.point(size, size),
  });
}

// ─── Component ────────────────────────────────────────────

export default function LeafletMap({
  points,
  center,
  zoom,
  showHeatmap,
  onPointClick,
  selectedPointId,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
    });

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Tile layer – OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable callback ref
  const onPointClickRef = useRef(onPointClick);
  onPointClickRef.current = onPointClick;

  // Update markers when points change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: createClusterIcon,
      animate: true,
    });

    const newMarkersMap = new Map<string, L.Marker>();

    points.forEach((point) => {
      if (!point.lat || !point.lng) return;

      const isSelected = point.id === selectedPointId;
      const icon = createSvgIcon(point.tipo, isSelected);

      const marker = L.marker([point.lat, point.lng], { icon });

      const statusLabel = point.status
        ? `<span class="popup-status">${point.status}</span>`
        : '';

      const tipoBadge =
        point.tipo === 'lead'
          ? '<span class="popup-badge popup-badge-lead">Lead</span>'
          : '<span class="popup-badge popup-badge-client">Cliente</span>';

      marker.bindPopup(
        `<div class="crm-popup">
          <div class="popup-header">
            <strong>${escapeHtml(point.nome)}</strong>
            ${tipoBadge}
          </div>
          ${point.telefone ? `<div class="popup-row">📞 ${escapeHtml(point.telefone)}</div>` : ''}
          ${point.endereco ? `<div class="popup-row">📍 ${escapeHtml(point.endereco)}</div>` : ''}
          ${statusLabel}
          <div class="popup-actions">
            <button class="popup-btn popup-btn-route" data-lat="${point.lat}" data-lng="${point.lng}">🗺️ Rota</button>
            <button class="popup-btn popup-btn-detail" data-id="${escapeHtml(point.id)}" data-tipo="${point.tipo}">👁️ Detalhes</button>
          </div>
        </div>`,
        { maxWidth: 280, className: 'crm-popup-container' },
      );

      marker.on('click', () => {
        onPointClickRef.current?.(point);
      });

      clusterGroup.addLayer(marker);
      newMarkersMap.set(point.id, marker);
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
    markersMapRef.current = newMarkersMap;

    // Fit bounds if we have points
    if (points.length > 0) {
      const validPoints = points.filter((p) => p.lat && p.lng);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } else {
      map.setView(center, zoom);
    }
  }, [points, selectedPointId, center, zoom]);

  // Heatmap layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (showHeatmap && points.length > 0) {
      const heatData = points
        .filter((p) => p.lat && p.lng)
        .map((p) => [p.lat, p.lng, 0.6] as [number, number, number]);

      if (heatData.length > 0) {
        const heat = L.heatLayer(heatData, {
          radius: 25,
          blur: 20,
          maxZoom: 16,
          max: 1.0,
          gradient: {
            0.2: '#2563eb',
            0.4: '#06b6d4',
            0.6: '#22c55e',
            0.8: '#f59e0b',
            1.0: '#ef4444',
          },
        });
        heat.addTo(map);
        heatLayerRef.current = heat;
      }
    }
  }, [showHeatmap, points]);

  // Focus on selected point
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPointId) return;

    const marker = markersMapRef.current.get(selectedPointId);
    if (marker) {
      map.setView(marker.getLatLng(), 16, { animate: true });
      marker.openPopup();
    }
  }, [selectedPointId]);

  // Handle popup button clicks (event delegation)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handlePopupClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('popup-btn')) return;

      if (target.classList.contains('popup-btn-route')) {
        const lat = target.dataset.lat;
        const lng = target.dataset.lng;
        if (lat && lng) {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        }
      }

      if (target.classList.contains('popup-btn-detail')) {
        const tipo = target.dataset.tipo;
        if (tipo === 'lead') {
          window.location.hash = '#/leads';
        } else {
          window.location.hash = '#/clientes';
        }
      }
    };

    const container = containerRef.current;
    container?.addEventListener('click', handlePopupClick);
    return () => container?.removeEventListener('click', handlePopupClick);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-xl"
      style={{ minHeight: 500 }}
    />
  );
}

// ─── Helpers ──────────────────────────────────────────────

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
