import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, type LeadStatus } from '@/types/crm';

interface StatusBadgeProps {
  status: LeadStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase?.() ?? 'novo';
  const statusClass = LEAD_STATUS_COLORS[normalizedStatus] ?? 'bg-muted text-foreground';
  const statusLabel = LEAD_STATUS_LABELS[normalizedStatus] ?? status;

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-primary-foreground
        ${statusClass}
      `}
    >
      {statusLabel}
    </span>
  );
}
