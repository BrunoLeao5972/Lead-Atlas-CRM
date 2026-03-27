import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import { useCrmData } from "@/hooks/useCrmData";
import AppSidebar from "@/components/AppSidebar";
import DashboardPage from "@/pages/DashboardPage";
import LeadsPage from "@/pages/LeadsPage";
import FunnelPage from "@/pages/FunnelPage";
import ClientsPage from "@/pages/ClientsPage";
import MapPage from "@/pages/MapPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function CrmApp() {
  const { theme, toggleTheme } = useTheme();
  const crm = useCrmData();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar theme={theme} onToggleTheme={toggleTheme} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8">
          <Routes>
            <Route path="/" element={<DashboardPage leads={crm.leads} clients={crm.clients} />} />
            <Route
              path="/leads"
              element={
                <LeadsPage
                  leads={crm.leads}
                  onAdd={crm.addLead}
                  onUpdate={crm.updateLead}
                  onDelete={crm.removeLead}
                  onConvert={crm.convertLeadToClient}
                />
              }
            />
            <Route
              path="/funil"
              element={
                <FunnelPage
                  leads={crm.leads}
                  onAdd={crm.addLead}
                  onUpdate={crm.updateLead}
                />
              }
            />
            <Route
              path="/funil-de-vendas"
              element={
                <FunnelPage
                  leads={crm.leads}
                  onAdd={crm.addLead}
                  onUpdate={crm.updateLead}
                />
              }
            />
            <Route
              path="/clientes"
              element={
                <ClientsPage
                  clients={crm.clients}
                  onAdd={crm.addClient}
                  onUpdate={crm.updateClient}
                  onDelete={crm.removeClient}
                />
              }
            />
            <Route path="/mapa" element={<MapPage leads={crm.leads} clients={crm.clients} />} />
            <Route path="/configuracoes" element={<SettingsPage theme={theme} onToggleTheme={toggleTheme} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CrmApp />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
