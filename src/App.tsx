import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Couples from './components/Couples';
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
        return (
          <div className="animate-page-in">
            <h2 className="text-3xl font-display font-medium text-ink mb-2">Planner do Evento</h2>
            <p className="text-stone text-sm font-light mb-8">Monte o cronograma completo do grande dia</p>
            <div className="bg-white p-12 rounded-2xl border border-divider text-center text-stone">
              Funcionalidade em desenvolvimento...
            </div>
          </div>
        );
      case 'checklist':
        return (
          <div className="animate-page-in">
            <h2 className="text-3xl font-display font-medium text-ink mb-2">Checklist</h2>
            <p className="text-stone text-sm font-light mb-8">Acompanhe cada etapa antes e durante o evento</p>
            <div className="bg-white p-12 rounded-2xl border border-divider text-center text-stone">
              Funcionalidade em desenvolvimento...
            </div>
          </div>
        );
      case 'contrato':
        return (
          <div className="animate-page-in">
            <h2 className="text-3xl font-display font-medium text-ink mb-2">Gerar Contrato</h2>
            <p className="text-stone text-sm font-light mb-8">Preencha os dados para gerar o contrato personalizado</p>
            <div className="bg-white p-12 rounded-2xl border border-divider text-center text-stone">
              Funcionalidade em desenvolvimento...
            </div>
          </div>
        );
      case 'roteiros':
        return (
          <div className="animate-page-in">
            <h2 className="text-3xl font-display font-medium text-ink mb-2">Roteiros de Fala</h2>
            <p className="text-stone text-sm font-light mb-8">Textos de referência para cada momento da cerimônia</p>
            <div className="bg-white p-12 rounded-2xl border border-divider text-center text-stone">
              Funcionalidade em desenvolvimento...
            </div>
          </div>
        );
      case 'emergencias':
        return (
          <div className="animate-page-in">
            <h2 className="text-3xl font-display font-medium text-ink mb-2">Guia de Imprevistos</h2>
            <p className="text-stone text-sm font-light mb-8">Como conduzir situações inesperadas com serenidade</p>
            <div className="bg-white p-12 rounded-2xl border border-divider text-center text-stone">
              Funcionalidade em desenvolvimento...
            </div>
          </div>
        );
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
