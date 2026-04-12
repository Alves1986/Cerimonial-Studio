import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/database';
import { Loader2, Save, CheckCircle, Copy, RefreshCw, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

const DEFAULT_ROTEIROS = [
  { title: 'Abertura da cerimônia', text: '"Boa tarde a todos. Em nome de [Nome1] e [Nome2], sejam muito bem-vindos a este momento tão especial. Pedimos, gentilmente, que mantenham os celulares no modo silencioso durante a cerimônia, para que possamos viver juntos cada instante com toda a emoção que ele merece. Em breve, nossa cerimônia terá início."' },
  { title: 'Chamada para a entrada da noiva', text: '"Pedimos a todos que se levantem, por favor."' },
  { title: 'Entrada triunfal na recepção', text: '"Senhoras e senhores, apresento a vocês, pela primeira vez como marido e mulher: [Nome1] e [Nome2]!"' },
  { title: 'Primeira dança', text: '"Convidamos o casal para o seu primeiro momento como marido e mulher: a valsa. [Nome1] e [Nome2], o salão é de vocês."' },
  { title: 'Corte do bolo', text: '"Um dos momentos mais especiais desta noite chegou. Convidamos [Nome1] e [Nome2] para o corte do bolo."' },
  { title: 'Brinde oficial', text: '"Com os copos em mãos, brindemos juntos à nova família que se inicia aqui esta noite. Saúde, amor e vida longa para [Nome1] e [Nome2]."' },
  { title: 'Jogar o bouquet', text: '"Solteiras, este momento é de vocês. Posicionem-se atrás da noiva — quem pegar o buquê será a próxima a celebrar o amor. [Nome da noiva], quando estiver pronta."' },
  { title: 'Encerramento', text: '"É chegada a hora de encerrarmos nossa celebração. Em nome de [Nome1] e [Nome2], muito obrigado a cada um de vocês por fazerem parte deste dia único. Boa noite a todos."' },
];

export default function Roteiros({ userPlan, onUpgrade }: { userPlan: string, onUpgrade: () => void }) {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState<string>('');
  const [roteiros, setRoteiros] = useState<Array<{ title: string; text: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchCouples();
  }, []);

  const fetchCouples = async () => {
    try {
      const { data, error } = await supabase.from('couples').select('*').order('name1');
      if (error) throw error;
      setCouples(data || []);
    } catch (error) {
      console.error('Error fetching couples:', error);
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
        // Auto-fill from template
        const couple = couples.find(c => c.id === coupleId);
        if (couple) {
          const filled = DEFAULT_ROTEIROS.map(r => ({
            ...r,
            text: r.text
              .replace(/\[Nome1\]/g, couple.name1)
              .replace(/\[Nome2\]/g, couple.name2)
              .replace(/\[Nome da noiva\]/g, couple.name1) // Fallback
          }));
          setRoteiros(filled);
        }
      }
    } catch (error) {
      console.error('Error fetching roteiros:', error);
    }
  };

  useEffect(() => {
    if (selectedCoupleId) {
      fetchRoteiros(selectedCoupleId);
    } else {
      setRoteiros([]);
    }
  }, [selectedCoupleId]);

  const handleSave = async () => {
    if (!selectedCoupleId) return;
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
      alert('Roteiro salvo com sucesso!');
    } catch (error) {
      console.error('Error saving roteiros:', error);
      alert('Erro ao salvar roteiro.');
    } finally {
      setSaving(false);
    }
  };

  const handleTextChange = (idx: number, newText: string) => {
    setRoteiros(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], text: newText };
      return next;
    });
  };

  const handleReset = () => {
    if (!selectedCoupleId) return;
    if (window.confirm('Deseja resetar para o texto padrão? Suas edições serão perdidas.')) {
      const couple = couples.find(c => c.id === selectedCoupleId);
      if (couple) {
        const filled = DEFAULT_ROTEIROS.map(r => ({
          ...r,
          text: r.text
            .replace(/\[Nome1\]/g, couple.name1)
            .replace(/\[Nome2\]/g, couple.name2)
            .replace(/\[Nome da noiva\]/g, couple.name1)
        }));
        setRoteiros(filled);
      }
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-rose" />
      </div>
    );
  }

  if (!userPlan?.includes('Pro')) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-divider rounded-2xl shadow-sm animate-page-in">
        <div className="w-20 h-20 bg-blush rounded-full flex items-center justify-center mb-6">
          <Lock className="text-rose w-10 h-10" />
        </div>
        <h3 className="font-display text-2xl text-ink mb-3">Funcionalidade Exclusiva</h3>
        <p className="text-stone font-light text-center max-w-md mb-8">
          O acesso a roteiros de fala personalizados e editáveis é um recurso exclusivo do <strong>Plano Pro</strong>. 
          Faça o upgrade agora para ter acesso a todos os roteiros!
        </p>
        <button
          onClick={onUpgrade}
          className="bg-rose hover:bg-rose-dark text-white font-bold py-3 px-10 rounded-xl transition-all shadow-lg shadow-rose/20 uppercase text-sm tracking-widest"
        >
          Fazer Upgrade para Pro
        </button>
      </div>
    );
  }

  return (
    <div className="animate-page-in">
      <div className="mb-8 pb-6 border-b border-divider flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-medium text-ink">Roteiros de Fala</h2>
          <p className="text-stone text-sm font-light mt-1">Textos de referência personalizados para cada casal</p>
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
          
          {selectedCoupleId && (
            <>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider text-stone hover:text-ink transition-all"
                title="Resetar para o padrão"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white bg-rose hover:bg-rose-dark rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
              </button>
            </>
          )}
        </div>
      </div>

      {!selectedCoupleId ? (
        <div className="bg-ivory border border-dashed border-divider rounded-2xl p-12 text-center">
          <p className="text-stone font-light">Selecione um casal para visualizar e editar os roteiros personalizados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {roteiros.map((roteiro, idx) => (
            <div key={idx} className="bg-white border border-divider rounded-xl p-6 shadow-sm group">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-display text-lg font-medium text-ink">{roteiro.title}</h4>
                <button
                  onClick={() => copyToClipboard(roteiro.text, idx)}
                  className="p-2 text-stone hover:text-rose transition-all rounded-lg hover:bg-blush"
                  title="Copiar texto"
                >
                  {copiedIdx === idx ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <textarea
                value={roteiro.text}
                onChange={(e) => handleTextChange(idx, e.target.value)}
                rows={4}
                className="w-full bg-champagne p-4 rounded-lg border-l-4 border-blush-mid text-ink-light font-light italic text-sm leading-relaxed outline-none focus:border-rose transition-all resize-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
