import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
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
import { Loader2, Menu, X } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserPlan(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserPlan(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserPlan = async (userId: string) => {
    try {
      const { data: plan } = await supabase.rpc('get_user_plan', { user_uuid: userId });
      setUserPlan(plan || 'free');
    } catch (error) {
      console.error('Error fetching plan:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <Loader2 className="w-10 h-10 animate-spin text-rose" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={setActivePage} />;
      case 'casais':
        return <Couples userPlan={userPlan} />;
      case 'planner':
        return <Planner />;
      case 'checklist':
        return <Checklist />;
      case 'contrato':
        return <Contrato userPlan={userPlan} onUpgrade={() => setActivePage('pricing')} />;
      case 'roteiros':
        return <Roteiros userPlan={userPlan} onUpgrade={() => setActivePage('pricing')} />;
      case 'emergencias':
        return <Emergencias />;
      case 'perfil':
        return <Profile />;
      case 'pricing':
        return <Pricing />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-divider p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blush rounded-full flex items-center justify-center">
            <span className="font-display italic text-rose-dark text-sm">C</span>
          </div>
          <h1 className="font-display text-base font-medium text-ink tracking-tight">Cerimonial Studio</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-stone hover:text-ink transition-colors">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen} 
        userPlan={userPlan}
      />
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-ink/20 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 md:ml-64 p-4 md:p-12 min-h-screen w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
