import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/database';
import { Loader2, Save, Copy, RotateCcw, ChevronRight, MessageSquare, Sparkles, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';
import { PlanGuard } from './PlanGuard';

const DEFAULT_ROTEIROS = [
  { title: 'Abertura e Boas-vindas', text: 'Boa noite a todos! É com imensa alegria que nos reunimos hoje para celebrar o amor de [Nome1] e [Nome2]. Sejam todos muito bem-vindos a este momento único e especial.' },
  { title: 'Entrada do Cortejo', text: 'Neste momento, daremos início ao cortejo. Convidamos a todos para que acompanhem com carinho a entrada daqueles que fazem parte da história deste casal.' },
  { title: 'Entrada da Noiva', text: 'E agora, o momento mais aguardado. Por favor, todos de pé para recebermos a noiva, [Nome da noiva], que caminha ao encontro do seu destino.' },
  { title: 'Palavras do Celebrante', text: 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha. Hoje, [Nome1] e [Nome2] decidem unir suas vidas sob este sentimento.' },
  { title: 'Troca de Alianças', text: 'As alianças são o símbolo de um círculo sem fim, assim como deve ser o amor de vocês. Que ao olharem para elas, lembrem-se sempre da promessa feita hoje.' },
  { title: 'Cumprimentos e Saída', text: 'Com a bênção de todos, eu os declaro casados! Podem se beijar. Vamos celebrar a saída dos recém-casados com muita alegria!' },
];

export default function Roteiros({ userPlan, onUpgrade }: { userPlan: string, onUpgrade: () => void }) {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState<string>('');
  const [roteiros, setRoteiros] = useState<Array<{ title: string; text: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCouples();
  }, []);

  useEffect(() => {
    if (selectedCoupleId) {
      fetchRoteiros(selectedCoupleId);
    } else {
      setRoteiros([]);
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

  const fetchRoteiros = async (coupleId: string) => {
    try {
      const { data, error } = await supabase
        .from('roteiros')
        .select('data')
        .eq('couple_id', coupleId)
        .maybeSingle();

      if (error) throw error;

      if (data && data.data) {
        setRoteiros(data.data);
      } else {
        // Hydrate default template with couple names
        const couple = couples.find(c => c.id === coupleId);
        const hydrated = DEFAULT_ROTEIROS.map(r => ({
          ...r,
          text: r.text
            .replace(/\[Nome1\]/g, couple?.name1 || 'Noivo(a) 1')
            .replace(/\[Nome2\]/g, couple?.name2 || 'Noivo(a) 2')
            .replace(/\[Nome da noiva\]/g, couple?.name2 || 'Noiva')
        }));
        setRoteiros(hydrated);
      }
    } catch (error) {
      console.error('Error fetching roteiros:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedCoupleId) return showToast('Selecione um casal primeiro.', 'info');
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('roteiros')
        .upsert({
          couple_id: selectedCoupleId,
          user_id: user.id,
          data: roteiros,
          updated_at: new Date().toISOString()
        }, { onConflict: 'couple_id' });

      if (error) throw error;
      showToast('Roteiros salvos com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving roteiros:', error);
      showToast('Erro ao salvar roteiros.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    showToast('Texto copiado para a área de transferência.', 'success');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleReset = () => {
    if (!confirm('Deseja resetar para o modelo padrão? Todas as alterações serão perdidas.')) return;
    const couple = couples.find(c => c.id === selectedCoupleId);
    const hydrated = DEFAULT_ROTEIROS.map(r => ({
      ...r,
      text: r.text
        .replace(/\[Nome1\]/g, couple?.name1 || 'Noivo(a) 1')
        .replace(/\[Nome2\]/g, couple?.name2 || 'Noivo(a) 2')
        .replace(/\[Nome da noiva\]/g, couple?.name2 || 'Noiva')
    }));
    setRoteiros(hydrated);
    showToast('Roteiro resetado para o padrão.', 'info');
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-rose" /></div>;
  }

  return (
    <PlanGuard requirePro onUpgrade={onUpgrade}>
      <div className="animate-page-in">
        <div className="mb-8 pb-6 border-b border-divider flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-display font-medium text-ink">Roteiros de Fala</h2>
            <p className="text-stone text-sm font-light mt-1">Modelos de fala profissionais para o mestre de cerimônias</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedCoupleId}
                onChange={(e) => setSelectedCoupleId(e.target.value)}
                className="bg-white border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm min-w-[240px] appearance-none pr-10 shadow-sm"
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
            <button
              onClick={handleReset}
              disabled={!selectedCoupleId}
              className="bg-ivory hover:bg-linen text-stone font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest border border-divider disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Resetar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedCoupleId}
              className="bg-rose hover:bg-rose-dark text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest shadow-lg shadow-rose/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Roteiro
            </button>
          </div>
        </div>

        {!selectedCoupleId ? (
          <div className="text-center py-20 bg-white border border-divider rounded-3xl shadow-sm">
            <div className="w-20 h-20 bg-blush rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="text-rose w-10 h-10" />
            </div>
            <h3 className="font-display text-2xl text-ink mb-2">Selecione um Casal</h3>
            <p className="text-stone font-light max-w-xs mx-auto">Escolha um casal acima para gerar e editar os roteiros de fala personalizados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roteiros.map((roteiro, idx) => (
              <div key={idx} className="bg-white border border-divider rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
                <div className="bg-ivory/50 p-4 border-b border-divider flex justify-between items-center">
                  <h4 className="font-display text-base font-medium text-ink flex items-center gap-2">
                    <span className="w-6 h-6 bg-rose/10 text-rose text-[10px] font-bold rounded-full flex items-center justify-center">{idx + 1}</span>
                    {roteiro.title}
                  </h4>
                  <button
                    onClick={() => handleCopy(roteiro.text, idx)}
                    className={cn(
                      "p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                      copiedIdx === idx ? "bg-green-50 text-green-600" : "hover:bg-white text-stone hover:text-rose"
                    )}
                  >
                    {copiedIdx === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIdx === idx ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <textarea
                  value={roteiro.text}
                  onChange={(e) => {
                    const newR = [...roteiros];
                    newR[idx].text = e.target.value;
                    setRoteiros(newR);
                  }}
                  className="p-6 text-sm text-ink-light font-light leading-relaxed min-h-[160px] outline-none focus:bg-ivory/20 transition-all resize-none scrollbar-hide"
                  placeholder="Escreva o roteiro aqui..."
                />
                <div className="px-6 py-3 bg-linen/10 border-t border-divider/50 flex justify-end">
                  <div className="text-[10px] font-bold text-stone/30 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Editável Pro
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PlanGuard>
  );
}
