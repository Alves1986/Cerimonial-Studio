import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/database';
import { Loader2, CheckSquare, Square, ChevronRight, Sparkles, Heart, ListTodo } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

const DEFAULT_TASKS = [
  { key: 'contrato', label: 'Assinatura do Contrato', category: 'Administrativo' },
  { key: 'primeira_reuniao', label: 'Primeira Reunião de Alinhamento', category: 'Planejamento' },
  { key: 'briefing_fornecedores', label: 'Briefing com Fornecedores', category: 'Planejamento' },
  { key: 'visita_tecnica', label: 'Visita Técnica ao Local', category: 'Logística' },
  { key: 'roteiro_final', label: 'Aprovação do Roteiro Final', category: 'Cerimônia' },
  { key: 'ensaio', label: 'Ensaio do Cortejo', category: 'Cerimônia' },
  { key: 'pagamento_final', label: 'Confirmação de Pagamentos Finais', category: 'Administrativo' },
];

export default function Checklist() {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState<string>('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCouples();
  }, []);

  useEffect(() => {
    if (selectedCoupleId) {
      fetchChecklistData(selectedCoupleId);
    } else {
      setCompletedTasks([]);
    }
  }, [selectedCoupleId]);

  const fetchCouples = async () => {
    try {
      const { data, error } = await supabase.from('couples').select('*').order('name1');
      if (error) throw error;
      setCouples(data || []);
    } catch (error) {
      console.error('Error fetching couples:', error);
      showToast('Erro ao carregar casais.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklistData = async (coupleId: string) => {
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select('task_key')
        .eq('couple_id', coupleId)
        .eq('completed', true);

      if (error) throw error;
      setCompletedTasks(data?.map(t => t.task_key) || []);
    } catch (error) {
      console.error('Error fetching checklist:', error);
    }
  };

  const toggleTask = async (taskKey: string) => {
    if (!selectedCoupleId) return;
    setUpdating(taskKey);

    const isCompleted = completedTasks.includes(taskKey);
    const newCompleted = isCompleted 
      ? completedTasks.filter(k => k !== taskKey)
      : [...completedTasks, taskKey];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('checklists')
        .upsert({
          couple_id: selectedCoupleId,
          user_id: user.id,
          task_key: taskKey,
          completed: !isCompleted,
          updated_at: new Date().toISOString()
        }, { onConflict: 'couple_id,task_key' });

      if (error) throw error;
      setCompletedTasks(newCompleted);
      showToast(isCompleted ? 'Tarefa reaberta.' : 'Tarefa concluída!', 'success');
    } catch (error) {
      console.error('Error updating checklist:', error);
      showToast('Erro ao atualizar tarefa.', 'error');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-rose" /></div>;
  }

  const progress = Math.round((completedTasks.length / DEFAULT_TASKS.length) * 100);
  const selectedCouple = couples.find(c => c.id === selectedCoupleId);

  return (
    <div className="animate-page-in">
      <div className="mb-12 pb-8 border-b border-divider flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-dark text-[10px] font-bold uppercase tracking-widest mb-2">
            <ListTodo className="w-3 h-3" /> Gestão de Tarefas
          </div>
          <h2 className="text-4xl font-display font-medium text-ink">Checklist de Controle</h2>
          <p className="text-stone text-sm font-light mt-2">Acompanhe cada etapa para garantir que nada seja esquecido.</p>
        </div>
        <div className="relative">
          <select
            value={selectedCoupleId}
            onChange={(e) => setSelectedCoupleId(e.target.value)}
            className="bg-white border border-divider rounded-2xl px-6 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm min-w-[280px] appearance-none pr-12 shadow-sm"
          >
            <option value="">Selecionar casal</option>
            {couples.map(c => (
              <option key={c.id} value={c.id}>{c.name1} & {c.name2}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone">
            <ChevronRight className="w-4 h-4 rotate-90" />
          </div>
        </div>
      </div>

      {!selectedCoupleId ? (
        <div className="text-center py-20 bg-white border border-divider rounded-3xl shadow-sm">
          <div className="w-20 h-20 bg-blush rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckSquare className="text-rose w-10 h-10" />
          </div>
          <h3 className="font-display text-2xl text-ink mb-2">Selecione um Casal</h3>
          <p className="text-stone font-light max-w-xs mx-auto">Escolha um casal acima para gerenciar o checklist de tarefas do evento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {DEFAULT_TASKS.map((task, idx) => (
              <button
                key={task.key}
                onClick={() => toggleTask(task.key)}
                disabled={updating === task.key}
                className={cn(
                  "w-full flex items-center gap-4 p-6 rounded-3xl border transition-all text-left group",
                  completedTasks.includes(task.key)
                    ? "bg-ivory/30 border-divider opacity-60"
                    : "bg-white border-divider hover:border-rose hover:shadow-md"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  completedTasks.includes(task.key) ? "bg-green-100 text-green-600" : "bg-blush text-rose group-hover:scale-110"
                )}>
                  {updating === task.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : completedTasks.includes(task.key) ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    "text-sm font-medium transition-all",
                    completedTasks.includes(task.key) ? "text-stone line-through" : "text-ink"
                  )}>
                    {task.label}
                  </div>
                  <div className="text-[9px] font-bold text-stone/40 uppercase tracking-widest mt-1">{task.category}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-8">
            <div className="bg-white border border-divider rounded-3xl p-8 shadow-sm">
              <h3 className="font-display text-xl text-ink mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose" /> Progresso do Evento
              </h3>
              <div className="relative h-4 bg-ivory rounded-full overflow-hidden mb-4">
                <div 
                  className="absolute top-0 left-0 h-full bg-rose transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-end">
                <div className="text-4xl font-display text-ink">{progress}%</div>
                <div className="text-[10px] font-bold text-stone uppercase tracking-widest mb-1">Concluído</div>
              </div>
            </div>

            <div className="bg-ink text-white rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-display text-xl">{selectedCouple?.name1} & {selectedCouple?.name2}</div>
                  <div className="text-[10px] font-bold text-rose uppercase tracking-widest">Resumo do Evento</div>
                </div>
              </div>
              <div className="space-y-4 text-sm font-light text-white/60">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span>Total de Tarefas</span>
                  <span className="text-white font-medium">{DEFAULT_TASKS.length}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span>Concluídas</span>
                  <span className="text-white font-medium">{completedTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendentes</span>
                  <span className="text-white font-medium">{DEFAULT_TASKS.length - completedTasks.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
