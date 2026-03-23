import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/database';
import { format, differenceInDays, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, Calendar, FileText, CheckSquare, ChevronRight, Loader2 } from 'lucide-react';

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    contracts: 0,
    checklists: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState<Couple[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch couples
      const { data: couples, error: couplesError } = await supabase
        .from('couples')
        .select('*')
        .order('event_date', { ascending: true });

      if (couplesError) throw couplesError;

      const now = startOfDay(new Date());
      const upcoming = couples?.filter(c => c.event_date && isAfter(new Date(c.event_date), now)) || [];
      const next30Days = upcoming.filter(c => differenceInDays(new Date(c.event_date!), now) <= 30);

      setStats({
        total: couples?.length || 0,
        upcoming: next30Days.length,
        contracts: 0, // Need to implement contracts table
        checklists: 0 // Need to implement checklists table
      });

      setUpcomingEvents(upcoming.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-rose" />
      </div>
    );
  }

  return (
    <div className="animate-page-in">
      <div className="mb-8 pb-6 border-b border-divider flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-medium text-ink">Visão Geral</h2>
          <p className="text-stone text-sm font-light mt-1">Bem-vindo ao seu studio de cerimonial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Casais"
          value={stats.total}
          sub="cadastrados"
          accent
        />
        <StatCard
          label="Próximos"
          value={stats.upcoming}
          sub="em 30 dias"
        />
        <StatCard
          label="Contratos"
          value={stats.contracts}
          sub="gerados"
        />
        <StatCard
          label="Checklists"
          value={stats.checklists}
          sub="em andamento"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
            <h3 className="font-display text-lg font-medium text-ink mb-6 pb-3 border-b border-divider">Próximos eventos</h3>
            {upcomingEvents.length > 0 ? (
              <div className="divide-y divide-divider">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="py-4 flex justify-between items-center">
                    <div>
                      <div className="font-display text-base text-ink">{event.name1} & {event.name2}</div>
                      <div className="text-xs text-stone font-light mt-1">
                        {event.event_date ? format(new Date(event.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data não definida'}
                        {event.location ? ` · ${event.location}` : ''}
                      </div>
                    </div>
                    <span className={getDaysBadgeClass(event.event_date)}>
                      {getDaysRemaining(event.event_date)}d
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-stone">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h4 className="font-display text-lg font-normal">Nenhum evento agendado</h4>
                <p className="text-sm font-light">Cadastre um casal para ver aqui</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
            <h3 className="font-display text-lg font-medium text-ink mb-6 pb-3 border-b border-divider">Acesso rápido</h3>
            <div className="flex flex-col gap-2">
              <QuickAction
                label="Cadastrar novo casal"
                onClick={() => onNavigate('casais')}
              />
              <QuickAction
                label="Gerar contrato"
                onClick={() => onNavigate('contrato')}
              />
              <QuickAction
                label="Abrir checklist"
                onClick={() => onNavigate('checklist')}
              />
              <QuickAction
                label="Planner do evento"
                onClick={() => onNavigate('planner')}
              />
              <QuickAction
                label="Roteiros de fala"
                onClick={() => onNavigate('roteiros')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string, value: number, sub: string, accent?: boolean }) {
  return (
    <div className={`p-6 rounded-xl border border-divider shadow-sm transition-shadow hover:shadow-md ${accent ? 'bg-blush border-blush-mid' : 'bg-white'}`}>
      <div className="text-[10px] font-bold text-stone uppercase tracking-widest mb-2">{label}</div>
      <div className={`font-display text-4xl ${accent ? 'text-rose-dark' : 'text-ink'}`}>{value}</div>
      <div className="text-xs text-stone font-light mt-1">{sub}</div>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-ivory border border-divider rounded-lg text-sm text-ink hover:bg-blush hover:border-blush-mid transition-all text-left"
    >
      {label}
      <ChevronRight className="w-4 h-4 text-stone" />
    </button>
  );
}

function getDaysRemaining(date: string | null) {
  if (!date) return 0;
  return differenceInDays(new Date(date), startOfDay(new Date()));
}

function getDaysBadgeClass(date: string | null) {
  const days = getDaysRemaining(date);
  const base = "text-[10px] font-bold tracking-wider px-3 py-1 rounded-full ";
  if (days <= 7) return base + "bg-blush text-rose-dark";
  if (days <= 30) return base + "bg-[#fcefd8] text-[#8a6c1a]";
  return base + "bg-sage-light text-[#3d6b39]";
}
