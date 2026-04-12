import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Couple, ChecklistItem } from '../types/database';
import { Loader2, Printer, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

const CL_DATA = [
  { title: '7–30 dias antes — Briefing final', items: ['Confirmar data, horário e local definitivos', 'Confirmar tipo de cerimônia e celebrante', 'Revisar lista de padrinhos com nomes corretos', 'Confirmar sequência de entrada do cortejo', 'Confirmar músicas da cerimônia e recepção', 'Definir rituais especiais (velas, areia, laço, flores)', 'Confirmar roteiro de votos (próprios ou repetidos)', 'Alinhar Plano B para chuva em eventos ao ar livre'] },
  { title: 'Fornecedores — alinhamento antecipado', items: ['Confirmar presença de todos os fornecedores', 'Enviar cronograma para DJ, fotógrafo, videomaker e buffet', 'Confirmar horário de chegada de cada fornecedor', 'Alinhar sinais discretos de comunicação com o DJ', 'Confirmar sistema de som e microfone reserva', 'Verificar se o espaço possui gerador de energia'] },
  { title: 'Ensaio', items: ['Realizar ensaio com padrinhos (1–2 dias antes)', 'Orientar pajens e daminhas e seus responsáveis', 'Simular a entrega da noiva ao noivo', 'Treinar a saída do casal após o beijo', 'Confirmar posicionamento de cada pessoa no altar'] },
  { title: 'Dia anterior — preparação', items: ['Imprimir 3 vias do roteiro (sua, DJ, noivos)', 'Carregar celular 100% e bateria portátil', 'Preparar kit de emergência completo', 'Confirmar via mensagem com todos os fornecedores', 'Revisar o roteiro completo mentalmente', 'Preparar vestuário profissional'] },
  { title: 'Kit de emergência — conferir', items: ['Alfinetes de segurança (sortidos)', 'Fita dupla-face', 'Agulha e linha branca e preta', 'Fio dental', 'Spray anti-estático', 'Lenços de papel e lenços umedecidos', 'Analgésico, digestivo e antidiarreico', 'Curativos e band-aid', 'Desodorante reserva', 'Caneta e bloco de notas', 'Lanterna pequena', 'Água e alimento para você'] },
  { title: 'Chegada ao local (90–120 min antes)', items: ['Percorrer todo o espaço — cerimônia e recepção', 'Verificar decoração — itens faltantes ou fora do lugar', 'Testar microfone e sistema de som', 'Verificar iluminação da cerimônia e festa', 'Verificar banheiros — limpeza, papel, sabão', 'Verificar recepção: mesa de confirmação e livro', 'Verificar altar: tapete, flores, alianças', 'Confirmar mesa do bolo e local do brinde'] },
  { title: 'Reunião com fornecedores (60–90 min antes)', items: ['Alinhamento com DJ: músicas, sinais e ordem', 'Alinhamento com fotógrafo: posições e momentos críticos', 'Alinhamento com videomaker: ângulos e momentos', 'Confirmar chegada e posição do celebrante', 'Confirmar equipe do buffet e horários de serviço'] },
  { title: 'Orientação do cortejo (45–60 min antes)', items: ['Reunir padrinhos e madrinhas', 'Explicar a sequência completa de entrada', 'Mostrar posicionamento no altar', 'Orientar sobre silêncio e celulares', 'Orientar os responsáveis por cada criança', 'Confirmar quem acompanha a noiva'] },
  { title: 'Durante a cerimônia', items: ['Noivo posicionado — dar sinal ao DJ', 'Controlar ritmo das entradas com sinais discretos', 'Acompanhar entrada da noiva — ajustar véu se necessário', 'Observar o andamento — pronto para qualquer imprevisto', 'Sinalizar DJ nos momentos: votos, alianças, beijo', 'Não fazer comentários em voz alta — apenas sinais'] },
  { title: 'Recepção e festa', items: ['Coordenar sessão de fotos com familiares', 'Levar noivos para local reservado para hidratação', 'Alinhar entrada triunfal com DJ: horário e música', 'Coordenar primeira dança', 'Acompanhar corte do bolo e brinde', 'Coordenar jogar o bouquet', 'Monitorar cronograma geral'] },
  { title: 'Encerramento', items: ['Confirmar saída dos noivos — despedida organizada', 'Recolher todos os itens pessoais do casal', 'Agradecer pessoalmente cada fornecedor', 'Verificar itens de decoração pertencentes ao casal', 'Colher avaliação do casal enquanto a emoção está presente', 'Registrar anotações de melhoria em até 24 horas'] },
];

export default function Checklist() {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState<string>('');
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCouples();
  }, []);

  useEffect(() => {
    if (selectedCoupleId) {
      fetchChecklist(selectedCoupleId);
    } else {
      setChecklistState({});
    }
  }, [selectedCoupleId]);

  const fetchCouples = async () => {
    try {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .order('name1', { ascending: true });

      if (error) throw error;
      setCouples(data || []);
    } catch (error) {
      console.error('Error fetching couples:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklist = async (coupleId: string) => {
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select('task_key, completed')
        .eq('couple_id', coupleId);

      if (error) throw error;

      const state: Record<string, boolean> = {};
      data?.forEach(item => {
        state[item.task_key] = item.completed;
      });
      setChecklistState(state);
    } catch (error) {
      console.error('Error fetching checklist:', error);
    }
  };

  const toggleCheck = async (sectionIndex: number, itemIndex: number) => {
    if (!selectedCoupleId) return;

    const key = `${sectionIndex}-${itemIndex}`;
    const newValue = !checklistState[key];

    // Optimistic update
    setChecklistState(prev => ({ ...prev, [key]: newValue }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('checklists')
        .upsert({
          couple_id: selectedCoupleId,
          user_id: user.id,
          task_key: key,
          completed: newValue,
          updated_at: new Date().toISOString()
        }, { onConflict: 'couple_id,task_key' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating checklist:', error);
      // Revert on error
      setChecklistState(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleReset = async () => {
    if (!selectedCoupleId || !confirm('Tem certeza que deseja desmarcar todos os itens deste casal?')) return;

    try {
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('couple_id', selectedCoupleId);

      if (error) throw error;
      setChecklistState({});
    } catch (error) {
      console.error('Error resetting checklist:', error);
    }
  };

  const totalItems = CL_DATA.reduce((acc, section) => acc + section.items.length, 0);
  const completedItems = Object.values(checklistState).filter(Boolean).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-rose" />
      </div>
    );
  }

  return (
    <div className="animate-page-in">
      <div className="mb-8 pb-6 border-b border-divider flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-medium text-ink">Checklist</h2>
          <p className="text-stone text-sm font-light mt-1">Acompanhe cada etapa antes e durante o evento</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCoupleId}
            onChange={(e) => setSelectedCoupleId(e.target.value)}
            className="bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm min-w-[200px]"
          >
            <option value="">Selecionar casal</option>
            {couples.map(c => (
              <option key={c.id} value={c.id}>{c.name1} & {c.name2}</option>
            ))}
          </select>
          <button
            onClick={handleReset}
            disabled={!selectedCoupleId}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider text-rose-dark bg-transparent border border-blush-mid rounded-lg hover:bg-blush hover:border-rose transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" /> Reiniciar
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white bg-sage hover:bg-[#96b091] rounded-lg transition-all print:hidden"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      <div className="bg-white border border-divider rounded-xl p-6 shadow-sm mb-6">
        <div className="flex justify-between text-[11px] font-bold tracking-wider uppercase text-stone mb-2">
          <span>Progresso do checklist</span>
          <span>{completedItems} / {totalItems}</span>
        </div>
        <div className="h-1.5 bg-divider rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blush-mid to-rose transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {CL_DATA.map((section, sIdx) => (
          <div key={sIdx} className="bg-white border border-divider rounded-xl p-6 shadow-sm">
            <h3 className="font-display text-base font-medium text-ink mb-2 pb-2 border-b border-divider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item, iIdx) => {
                const key = `${sIdx}-${iIdx}`;
                const isChecked = checklistState[key] || false;
                return (
                  <label
                    key={iIdx}
                    className={cn(
                      "flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-ivory",
                      isChecked && "text-stone"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(sIdx, iIdx)}
                      disabled={!selectedCoupleId}
                      className="mt-1 w-4 h-4 accent-rose cursor-pointer"
                    />
                    <span className={cn("text-sm leading-relaxed", isChecked && "line-through")}>
                      {item}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
