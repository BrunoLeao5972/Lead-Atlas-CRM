import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  accent?: string;
}

export default function StatCard({ title, value, icon, accent }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`rounded-lg p-2 ${accent ?? 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-card-foreground">{value}</p>
    </div>
  );
}
