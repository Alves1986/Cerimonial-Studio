import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/database';
import { Loader2, Save, ChevronRight, ClipboardList, Sparkles, Heart, Clock, MapPin, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

export default function Planner() {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [details, setDetails] = useState({
    ceremony_start: '',
    reception_start: '',
    dinner_time: '',
    cake_cutting: '',
    party_start: '',
    vendor_arrival: '',
    notes: '',
    cortege_order: ''
  });

  useEffect(() => {
    fetchCouples();
  }, []);

  useEffect(() => {
    if (selectedCoupleId) {
      fetchPlannerData(selectedCoupleId);
    } else {
      setDetails({
        ceremony_start: '',
        reception_start: '',
        dinner_time: '',
        cake_cutting: '',
        party_start: '',
        vendor_arrival: '',
        notes: '',
        cortege_order: ''
      });
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

  const fetchPlannerData = async (coupleId: string) => {
    try {
      const { data, error } = await supabase
        .from('planners')
        .select('details')
        .eq('couple_id', coupleId)
        .maybeSingle();

      if (error) throw error;
      if (data && data.details) {
        setDetails(prev => ({ ...prev, ...data.details }));
      }
    } catch (error) {
      console.error('Error fetching planner:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedCoupleId) return showToast('Selecione um casal primeiro.', 'info');
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('planners')
        .upsert({
          couple_id: selectedCoupleId,
          user_id: user.id,
          details: details,
          updated_at: new Date().toISOString()
        }, { onConflict: 'couple_id' });

      if (error) throw error;
      showToast('Cronograma salvo com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving planner:', error);
      showToast('Erro ao salvar cronograma.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-rose" /></div>;
  }

  const selectedCouple = couples.find(c => c.id === selectedCoupleId);

  return (
    <div className="animate-page-in">
      <div className="mb-12 pb-8 border-b border-divider flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-dark text-[10px] font-bold uppercase tracking-widest mb-2">
            <ClipboardList className="w-3 h-3" /> Gestão de Tempo
          </div>
          <h2 className="text-4xl font-display font-medium text-ink">Planner do Evento</h2>
          <p className="text-stone text-sm font-light mt-2">Organize o cronograma minuto a minuto para um evento impecável.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          <button
            onClick={handleSave}
            disabled={saving || !selectedCoupleId}
            className="bg-rose hover:bg-rose-dark text-white font-bold py-3 px-8 rounded-2xl transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest shadow-lg shadow-rose/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Planner
          </button>
        </div>
      </div>

      {!selectedCoupleId ? (
        <div className="text-center py-20 bg-white border border-divider rounded-3xl shadow-sm">
          <div className="w-20 h-20 bg-blush rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-rose w-10 h-10" />
          </div>
          <h3 className="font-display text-2xl text-ink mb-2">Selecione um Casal</h3>
          <p className="text-stone font-light max-w-xs mx-auto">Escolha um casal acima para começar a planejar o cronograma do grande dia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-divider rounded-3xl p-8 shadow-sm">
              <h3 className="font-display text-2xl text-ink mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6 text-rose" /> Cronograma Principal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TimeInput label="Chegada de Fornecedores" value={details.vendor_arrival} onChange={v => setDetails({...details, vendor_arrival: v})} />
                <TimeInput label="Início da Cerimônia" value={details.ceremony_start} onChange={v => setDetails({...details, ceremony_start: v})} />
                <TimeInput label="Início da Recepção" value={details.reception_start} onChange={v => setDetails({...details, reception_start: v})} />
                <TimeInput label="Serviço de Jantar" value={details.dinner_time} onChange={v => setDetails({...details, dinner_time: v})} />
                <TimeInput label="Corte do Bolo" value={details.cake_cutting} onChange={v => setDetails({...details, cake_cutting: v})} />
                <TimeInput label="Abertura da Pista" value={details.party_start} onChange={v => setDetails({...details, party_start: v})} />
              </div>
            </div>

            <div className="bg-white border border-divider rounded-3xl p-8 shadow-sm">
              <h3 className="font-display text-2xl text-ink mb-8 flex items-center gap-3">
                <Users className="w-6 h-6 text-rose" /> Ordem do Cortejo
              </h3>
              <textarea
                value={details.cortege_order}
                onChange={e => setDetails({...details, cortege_order: e.target.value})}
                className="w-full bg-ivory border border-divider rounded-2xl p-6 outline-none focus:border-rose transition-all text-sm min-h-[200px] resize-none font-light leading-relaxed"
                placeholder="Ex: 1. Noivo e Mãe, 2. Padrinhos Noivo, 3. Padrinhos Noiva..."
              />
            </div>
          </div>

          <div className="space-y-8">
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
              <div className="space-y-4">
                <InfoRow icon={<Clock className="w-4 h-4" />} label="Data" value={selectedCouple?.event_date || '—'} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Local" value={selectedCouple?.location || '—'} />
                <InfoRow icon={<Users className="w-4 h-4" />} label="Convidados" value={selectedCouple?.guests?.toString() || '—'} />
              </div>
            </div>

            <div className="bg-white border border-divider rounded-3xl p-8 shadow-sm">
              <h3 className="font-display text-xl text-ink mb-6">Observações Gerais</h3>
              <textarea
                value={details.notes}
                onChange={e => setDetails({...details, notes: e.target.value})}
                className="w-full bg-ivory border border-divider rounded-2xl p-6 outline-none focus:border-rose transition-all text-sm min-h-[300px] resize-none font-light leading-relaxed"
                placeholder="Notas importantes sobre o buffet, música, restrições..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1">{label}</label>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-ivory border border-divider rounded-2xl px-6 py-4 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
      />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
      <div className="text-rose">{icon}</div>
      <div className="flex-1">
        <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{label}</div>
        <div className="text-sm font-light">{value}</div>
      </div>
    </div>
  );
}
