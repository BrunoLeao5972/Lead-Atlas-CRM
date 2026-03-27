import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Info } from 'lucide-react';

interface SettingsPageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function SettingsPage({ theme, onToggleTheme }: SettingsPageProps) {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title="Configurações" subtitle="Preferências do sistema" />

      {/* Theme */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-card-foreground">Aparência</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-card-foreground">Tema</p>
            <p className="text-xs text-muted-foreground">Alterne entre modo claro e escuro</p>
          </div>
          <Button variant="outline" size="sm" onClick={onToggleTheme} className="gap-2">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </Button>
        </div>
      </section>

      {/* Info */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-card-foreground">Sobre o Sistema</h2>
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
          <Info size={18} className="text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong className="text-card-foreground">CRM Pro</strong> — v1.0.0</p>
            <p>Sistema de gerenciamento de relacionamento com clientes. Preparado para autenticação, multiusuário e integrações futuras.</p>
            <p>Os dados estão armazenados localmente no navegador.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
