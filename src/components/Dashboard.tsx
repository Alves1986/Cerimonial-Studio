import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/database';
import { format, differenceInDays, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, Calendar, FileText, CheckSquare, ChevronRight, Loader2, Sparkles, Zap, Users } from 'lucide-react';
import { useToast } from './Toast';

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
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

      // Fetch contracts count
      const { count: contractsCount } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true });

      // Fetch checklists count (completed tasks)
      const { count: checklistsCount } = await supabase
        .from('checklists')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true);

      const now = startOfDay(new Date());
      const upcoming = couples?.filter(c => c.event_date && isAfter(new Date(c.event_date), now)) || [];
      const next30Days = upcoming.filter(c => differenceInDays(new Date(c.event_date!), now) <= 30);

      setStats({
        total: couples?.length || 0,
        upcoming: next30Days.length,
        contracts: contractsCount || 0,
        checklists: checklistsCount || 0
      });

      setUpcomingEvents(upcoming.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Erro ao carregar dados do dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-10 h-10 animate-spin text-rose" />
      </div>
    );
  }

  return (
    <div className="animate-page-in">
      <div className="mb-12 pb-8 border-b border-divider flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-dark text-[10px] font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3" /> Bem-vindo ao seu Studio
          </div>
          <h2 className="text-4xl font-display font-medium text-ink">Visão Geral</h2>
          <p className="text-stone text-sm font-light mt-2">Gerencie seus eventos com a elegância que eles merecem.</p>
        </div>
        <button 
          onClick={() => onNavigate('casais')}
          className="bg-ink hover:bg-ink-light text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-ink/10 flex items-center gap-2"
        >
          <PlusIcon className="w-3 h-3" /> Novo Evento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          label="Casais"
          value={stats.total}
          sub="cadastrados"
          icon={<Users className="w-4 h-4" />}
          accent
        />
        <StatCard
          label="Próximos"
          value={stats.upcoming}
          sub="em 30 dias"
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatCard
          label="Contratos"
          value={stats.contracts}
          sub="gerados"
          icon={<FileText className="w-4 h-4" />}
        />
        <StatCard
          label="Checklists"
          value={stats.checklists}
          sub="tarefas concluídas"
          icon={<CheckSquare className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white border border-divider rounded-3xl p-8 shadow-sm h-full">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-divider">
              <h3 className="font-display text-xl font-medium text-ink flex items-center gap-3">
                <Calendar className="w-5 h-5 text-rose" /> Próximos Eventos
              </h3>
              <button onClick={() => onNavigate('casais')} className="text-[10px] font-bold text-rose hover:text-rose-dark uppercase tracking-widest transition-colors">Ver todos</button>
            </div>
            
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="p-5 bg-ivory/50 hover:bg-blush/20 border border-divider rounded-2xl flex justify-between items-center transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose shadow-sm group-hover:scale-110 transition-transform">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-display text-lg text-ink leading-tight">{event.name1} <span className="text-rose italic">&</span> {event.name2}</div>
                        <div className="text-[10px] text-stone font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                          {event.event_date ? format(new Date(event.event_date), "dd 'de' MMMM", { locale: ptBR }) : 'Data não definida'}
                          {event.location ? <span className="text-divider">|</span> : ''}
                          {event.location ? <span className="truncate max-w-[150px]">{event.location}</span> : ''}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm",
                      getDaysRemaining(event.event_date) <= 7 ? "bg-rose text-white" : "bg-white text-ink border border-divider"
                    )}>
                      {getDaysRemaining(event.event_date)} dias
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-stone">
                <div className="w-20 h-20 bg-ivory rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                  <Heart className="w-10 h-10" />
                </div>
                <h4 className="font-display text-xl font-normal text-ink/60">Nenhum evento agendado</h4>
                <p className="text-sm font-light mt-2">Cadastre um casal para começar a gerenciar.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white border border-divider rounded-3xl p-8 shadow-sm h-full">
            <h3 className="font-display text-xl font-medium text-ink mb-8 pb-4 border-b border-divider flex items-center gap-3">
              <Zap className="w-5 h-5 text-rose" /> Acesso Rápido
            </h3>
            <div className="flex flex-col gap-3">
              <QuickAction label="Cadastrar novo casal" icon={<Users className="w-4 h-4" />} onClick={() => onNavigate('casais')} />
              <QuickAction label="Gerar contrato Pro" icon={<FileText className="w-4 h-4" />} onClick={() => onNavigate('contrato')} />
              <QuickAction label="Abrir checklist" icon={<CheckSquare className="w-4 h-4" />} onClick={() => onNavigate('checklist')} />
              <QuickAction label="Planner do evento" icon={<Calendar className="w-4 h-4" />} onClick={() => onNavigate('planner')} />
              <QuickAction label="Roteiros de fala Pro" icon={<Sparkles className="w-4 h-4" />} onClick={() => onNavigate('roteiros')} />
            </div>
            
            <div className="mt-10 p-6 bg-blush/30 rounded-2xl border border-rose/10">
              <div className="text-[10px] font-bold text-rose-dark uppercase tracking-widest mb-2">Dica do Studio</div>
              <p className="text-xs text-ink-light font-light leading-relaxed italic">
                "Um cerimonial impecável começa com uma organização invisível aos olhos dos convidados."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, icon }: { label: string, value: number, sub: string, accent?: boolean, icon: React.ReactNode }) {
  return (
    <div className={cn(
      "p-8 rounded-3xl border transition-all hover:shadow-xl group",
      accent ? "bg-rose border-rose shadow-lg shadow-rose/20" : "bg-white border-divider shadow-sm"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12",
          accent ? "bg-white/20 text-white" : "bg-blush text-rose"
        )}>
          {icon}
        </div>
      </div>
      <div className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", accent ? "text-white/70" : "text-stone")}>{label}</div>
      <div className={cn("font-display text-5xl", accent ? "text-white" : "text-ink")}>{value}</div>
      <div className={cn("text-xs font-light mt-2", accent ? "text-white/60" : "text-stone")}>{sub}</div>
    </div>
  );
}

function QuickAction({ label, onClick, icon }: { label: string, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-5 bg-ivory/50 border border-divider rounded-2xl text-sm text-ink hover:bg-white hover:border-rose hover:shadow-md transition-all text-left group"
    >
      <div className="flex items-center gap-3">
        <div className="text-stone group-hover:text-rose transition-colors">{icon}</div>
        <span className="font-medium">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-stone group-hover:text-rose transition-all group-hover:translate-x-1" />
    </button>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function getDaysRemaining(date: string | null) {
  if (!date) return 0;
  return differenceInDays(new Date(date), startOfDay(new Date()));
}
