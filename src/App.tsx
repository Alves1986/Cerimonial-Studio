import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Couples from './components/Couples';
import Planner from './components/Planner';
import Checklist from './components/Checklist';
import Contrato from './components/Contrato';
import Roteiros from './components/Roteiros';
import Emergencias from './components/Emergencias';
import Profile from './components/Profile';
import Pricing from './components/Pricing';
import { ToastProvider, useToast } from './components/Toast';
import { usePlan } from './hooks/usePlan';
import { Menu, X, Loader2, Sparkles } from 'lucide-react';

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { plan, loading: planLoading } = usePlan();
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN') showToast('Bem-vindo de volta!', 'success');
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />;
      case 'casais': return <Couples userPlan={plan.label} />;
      case 'planner': return <Planner />;
      case 'checklist': return <Checklist />;
      case 'contrato': return <Contrato userPlan={plan.label} onUpgrade={() => setActivePage('pricing')} />;
      case 'roteiros': return <Roteiros userPlan={plan.label} onUpgrade={() => setActivePage('pricing')} />;
      case 'emergencias': return <Emergencias />;
      case 'perfil': return <Profile />;
      case 'pricing': return <Pricing />;
      default: return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-divider p-4 flex justify-between items-center z-[60] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blush rounded-full flex items-center justify-center">
            <span className="font-display italic text-rose-dark text-sm">C</span>
          </div>
          <span className="font-display text-lg font-medium text-ink">Cerimonial Studio</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-stone hover:text-rose transition-colors"
        >
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        userPlan={plan.label}
      />

      <main className="flex-1 md:ml-64 p-6 md:p-12 mt-16 md:mt-0 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {planLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-rose" />
            </div>
          ) : (
            renderPage()
          )}
        </div>
        
        <footer className="mt-20 pt-8 border-t border-divider flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-stone/40 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Cerimonial Studio &copy; 2026
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-rose transition-colors">Termos</a>
            <a href="#" className="hover:text-rose transition-colors">Privacidade</a>
            <a href="#" className="hover:text-rose transition-colors">Suporte</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
