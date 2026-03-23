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
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        return <Couples />;
      case 'planner':
        return <Planner />;
      case 'checklist':
        return <Checklist />;
      case 'contrato':
        return <Contrato />;
      case 'roteiros':
        return <Roteiros />;
      case 'emergencias':
        return <Emergencias />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="ml-64 p-12 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
