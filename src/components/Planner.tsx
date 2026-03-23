import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/database';
import { Loader2, Printer, Save } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Planner() {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');

  // Form state
  const [formData, setFormData] = useState({
    ceremony_location: '',
    reception_location: '',
    celebrant: '',
    style: '',
    observations: '',
  });
  const [rituals, setRituals] = useState<Record<string, boolean>>({});
  const [timeline, setTimeline] = useState<Array<{ time: string, activity: string, responsible: string }>>([]);
  const [procession, setProcession] = useState<Array<{ order: number, label: string, names: string, music: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ category: string, name: string, phone: string }>>([]);

  const RITUAL_OPTIONS = ['Cerimônia das velas', 'Cerimônia da areia', 'Laço dos noivos', 'Flores para as mães', 'Pombas ou borboletas'];
  const PROCESSION_LABELS = ['Noivo com sua mãe', 'Mãe da noiva com pai do noivo', 'Padrinho 1 + Madrinha 1', 'Padrinho 2 + Madrinha 2', 'Padrinho 3 + Madrinha 3', 'Padrinho 4 + Madrinha 4', 'Padrinho 5 + Madrinha 5', 'Padrinho 6 + Madrinha 6', 'Pajem / Daminha 1', 'Pajem / Daminha 2', 'Noiva com: _______________'];
  const SUPPLIER_CATS = ['Espaço / Buffet', 'DJ', 'Banda ao Vivo', 'Decoradora', 'Fotógrafo', 'Videomaker', 'Cabeleireiro', 'Maquiadora', 'Florista', 'Confeitaria', 'Padre / Pastor / Celebrante', 'Juiz de Paz', 'Transporte'];

  useEffect(() => {
    fetchCouples();
  }, []);

  useEffect(() => {
    if (selectedCoupleId) {
      fetchPlannerData(selectedCoupleId);
    } else {
      resetForm();
    }
  }, [selectedCoupleId]);

  const resetForm = () => {
    setFormData({
      ceremony_location: '',
      reception_location: '',
      celebrant: '',
      style: '',
      observations: '',
    });
    setRituals({});
    setTimeline([]);
    setProcession(PROCESSION_LABELS.map((label, i) => ({ order: i + 1, label, names: '', music: '' })));
    setSuppliers(SUPPLIER_CATS.map(cat => ({ category: cat, name: '', phone: '' })));
  };

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

  const fetchPlannerData = async (coupleId: string) => {
    try {
      const { data, error } = await supabase
        .from('planners')
        .select('details')
        .eq('couple_id', coupleId)
        .maybeSingle();

      if (error) throw error;

      if (data && data.details) {
        const d = data.details;
        setFormData({
          ceremony_location: d.ceremony_location || '',
          reception_location: d.reception_location || '',
          celebrant: d.celebrant || '',
          style: d.style || '',
          observations: d.observations || '',
        });
        
        const rits: Record<string, boolean> = {};
        (d.rituals || []).forEach((r: string) => { rits[r] = true; });
        setRituals(rits);

        if (d.timeline && d.timeline.length > 0) setTimeline(d.timeline);
        if (d.procession && d.procession.length > 0) {
          setProcession(d.procession);
        } else {
          setProcession(PROCESSION_LABELS.map((label, i) => ({ order: i + 1, label, names: '', music: '' })));
        }
        if (d.suppliers && d.suppliers.length > 0) {
          setSuppliers(d.suppliers);
        } else {
          setSuppliers(SUPPLIER_CATS.map(cat => ({ category: cat, name: '', phone: '' })));
        }
      } else {
        resetForm();
      }
    } catch (error) {
      console.error('Error fetching planner:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedCoupleId) return alert('Selecione um casal primeiro.');
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const details = {
        ...formData,
        rituals: Object.keys(rituals).filter(k => rituals[k]),
        timeline,
        procession,
        suppliers
      };

      const { error } = await supabase
        .from('planners')
        .upsert({
          couple_id: selectedCoupleId,
          user_id: user.id,
          details,
          updated_at: new Date().toISOString()
        }, { onConflict: 'couple_id' });

      if (error) throw error;
      alert('Planner salvo com sucesso!');
    } catch (error) {
      console.error('Error saving planner:', error);
      alert('Erro ao salvar planner.');
    } finally {
      setSaving(false);
    }
  };

  const generateTimeline = () => {
    const couple = couples.find(c => c.id === selectedCoupleId);
    if (!couple || !couple.event_time) return alert('O casal precisa ter um horário de cerimônia definido no cadastro.');

    const hora = couple.event_time;
    const [hh, mm] = hora.split(':').map(Number);
    const add = (h: number, m: number, mins: number) => { 
      const t = h * 60 + m + mins; 
      // Handle negative times (previous day) or overflow
      let totalMins = t;
      if (totalMins < 0) totalMins += 24 * 60;
      return `${String(Math.floor(totalMins / 60) % 24).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`; 
    };

    const newTimeline = [
      { time: add(hh, mm, -120), activity: 'Chegada do cerimonialista ao local', responsible: 'Cerimonialista' },
      { time: add(hh, mm, -110), activity: 'Vistoria completa do espaço', responsible: 'Cerimonialista' },
      { time: add(hh, mm, -90), activity: 'Reunião final com DJ', responsible: 'Cerimonialista + DJ' },
      { time: add(hh, mm, -85), activity: 'Reunião com fotógrafo e videomaker', responsible: 'Equipe visual' },
      { time: add(hh, mm, -70), activity: 'Chegada e orientação dos padrinhos', responsible: 'Cerimonialista' },
      { time: add(hh, mm, -60), activity: 'Abertura dos portões — recepção', responsible: 'Recepcionistas' },
      { time: add(hh, mm, -45), activity: 'Ensaio final do cortejo', responsible: 'Cerimonialista' },
      { time: add(hh, mm, -30), activity: 'Acompanhamento da noiva no translado', responsible: 'Cerimonialista' },
      { time: add(hh, mm, -10), activity: 'Alerta final — 10 min para início', responsible: 'Todos posicionados' },
      { time: hora, activity: 'Início da cerimônia', responsible: 'MC / Celebrante' },
      { time: add(hh, mm, 60), activity: 'Sessão de fotos com familiares', responsible: 'Fotógrafo' },
      { time: add(hh, mm, 90), activity: 'Abertura da recepção', responsible: 'DJ + MC' },
      { time: add(hh, mm, 120), activity: 'Entrada triunfal dos noivos na festa', responsible: 'MC + DJ' },
    ];

    setTimeline(newTimeline);
  };

  if (loading) {
    return <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose" /></div>;
  }

  const selectedCouple = couples.find(c => c.id === selectedCoupleId);

  return (
    <div className="animate-page-in">
      <div className="mb-8 pb-6 border-b border-divider flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-medium text-ink">Planner do Evento</h2>
          <p className="text-stone text-sm font-light mt-1">Monte o cronograma completo do grande dia</p>
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
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider text-rose-dark bg-transparent border border-blush-mid rounded-lg hover:bg-blush hover:border-rose transition-all print:hidden"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedCoupleId || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white bg-rose hover:bg-rose-dark rounded-lg transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
          </button>
        </div>
      </div>

      <div className="flex border-b border-divider mb-8 overflow-x-auto print:hidden">
        {[
          { id: 'dados', label: 'Dados do Evento' },
          { id: 'cronograma', label: 'Cronograma' },
          { id: 'cortejo', label: 'Cortejo' },
          { id: 'fornecedores', label: 'Fornecedores' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "border-rose text-rose-dark" 
                : "border-transparent text-stone hover:text-ink"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={cn("space-y-6", activeTab !== 'dados' && "hidden print:block")}>
        <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
          <h3 className="font-display text-lg font-medium text-ink mb-6 pb-3 border-b border-divider">Dados do evento</h3>
          
          {selectedCouple && (
            <div className="bg-champagne border border-champagne2 rounded-lg p-4 mb-6 text-sm text-ink-light flex flex-wrap gap-x-8 gap-y-2">
              <div><strong>Data:</strong> {selectedCouple.event_date || '—'}</div>
              <div><strong>Horário:</strong> {selectedCouple.event_time || '—'}</div>
              <div><strong>Convidados:</strong> {selectedCouple.guests || '—'}</div>
              <div><strong>Tipo:</strong> {selectedCouple.ceremony_type || '—'}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Local da cerimônia</label>
              <input
                type="text"
                value={formData.ceremony_location}
                onChange={e => setFormData({...formData, ceremony_location: e.target.value})}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm"
                placeholder="Nome e endereço"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Local da recepção</label>
              <input
                type="text"
                value={formData.reception_location}
                onChange={e => setFormData({...formData, reception_location: e.target.value})}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm"
                placeholder="Se diferente da cerimônia"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Celebrante / Padre / Pastor</label>
              <input
                type="text"
                value={formData.celebrant}
                onChange={e => setFormData({...formData, celebrant: e.target.value})}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Tema / Estilo</label>
              <input
                type="text"
                value={formData.style}
                onChange={e => setFormData({...formData, style: e.target.value})}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm"
                placeholder="Ex: Rústico chique, clássico..."
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-divider">
            <label className="text-[10px] font-bold text-stone uppercase tracking-widest block mb-3">Rituais especiais</label>
            <div className="flex flex-wrap gap-4">
              {RITUAL_OPTIONS.map(ritual => (
                <label key={ritual} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rituals[ritual] || false}
                    onChange={(e) => setRituals({...rituals, [ritual]: e.target.checked})}
                    className="w-4 h-4 accent-rose"
                  />
                  {ritual}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-divider space-y-1">
            <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Observações gerais</label>
            <textarea
              value={formData.observations}
              onChange={e => setFormData({...formData, observations: e.target.value})}
              rows={3}
              className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm"
              placeholder="Informações especiais, restrições..."
            />
          </div>
        </div>
      </div>

      <div className={cn("space-y-6", activeTab !== 'cronograma' && "hidden print:block")}>
        <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-divider">
            <h3 className="font-display text-lg font-medium text-ink">Cronograma do dia</h3>
            <button onClick={generateTimeline} className="text-xs font-bold uppercase tracking-wider text-rose-dark hover:text-rose transition-colors print:hidden">
              Gerar Automático
            </button>
          </div>
          
          {timeline.length > 0 ? (
            <div className="relative pl-8 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-divider space-y-6">
              {timeline.map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-rose"></div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <input 
                      type="time" 
                      value={item.time}
                      onChange={(e) => {
                        const newT = [...timeline];
                        newT[idx].time = e.target.value;
                        setTimeline(newT);
                      }}
                      className="text-xs font-bold text-rose-dark bg-transparent border-none p-0 focus:ring-0 w-20"
                    />
                    <input 
                      type="text" 
                      value={item.activity}
                      onChange={(e) => {
                        const newT = [...timeline];
                        newT[idx].activity = e.target.value;
                        setTimeline(newT);
                      }}
                      className="text-sm text-ink bg-transparent border-b border-transparent hover:border-divider focus:border-rose p-1 flex-1 outline-none transition-colors"
                    />
                    <input 
                      type="text" 
                      value={item.responsible}
                      onChange={(e) => {
                        const newT = [...timeline];
                        newT[idx].responsible = e.target.value;
                        setTimeline(newT);
                      }}
                      className="text-xs text-stone font-light bg-transparent border-b border-transparent hover:border-divider focus:border-rose p-1 w-32 outline-none transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-stone text-sm font-light">
              Clique em "Gerar Automático" para criar a base do cronograma.
            </div>
          )}
        </div>
      </div>

      <div className={cn("space-y-6", activeTab !== 'cortejo' && "hidden print:block")}>
        <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
          <h3 className="font-display text-lg font-medium text-ink mb-4 pb-3 border-b border-divider">Sequência de entrada</h3>
          <div className="bg-champagne border border-champagne2 border-l-4 border-l-rose rounded-lg p-4 mb-6 text-sm text-ink-light font-light">
            O altar deve estar à frente. Lado esquerdo reservado para convidados da noiva; lado direito, noivo.
          </div>
          
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 px-2 pb-2 border-b border-divider text-[10px] font-bold text-stone uppercase tracking-widest">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Posição</div>
              <div className="col-span-4">Nomes</div>
              <div className="col-span-3">Música</div>
            </div>
            {procession.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 items-center py-2 border-b border-divider/50 last:border-0">
                <div className="col-span-1 text-center text-xs font-bold text-stone">{item.order}</div>
                <div className="col-span-4 text-sm text-ink-light">{item.label}</div>
                <div className="col-span-4">
                  <input 
                    type="text" 
                    value={item.names}
                    onChange={(e) => {
                      const newP = [...procession];
                      newP[idx].names = e.target.value;
                      setProcession(newP);
                    }}
                    placeholder="Nomes"
                    className="w-full bg-ivory border border-divider rounded px-3 py-1.5 text-sm outline-none focus:border-rose transition-colors"
                  />
                </div>
                <div className="col-span-3">
                  <input 
                    type="text" 
                    value={item.music}
                    onChange={(e) => {
                      const newP = [...procession];
                      newP[idx].music = e.target.value;
                      setProcession(newP);
                    }}
                    placeholder="Música"
                    className="w-full bg-ivory border border-divider rounded px-3 py-1.5 text-sm outline-none focus:border-rose transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cn("space-y-6", activeTab !== 'fornecedores' && "hidden print:block")}>
        <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
          <h3 className="font-display text-lg font-medium text-ink mb-6 pb-3 border-b border-divider">Contatos dos fornecedores</h3>
          
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 px-2 pb-2 border-b border-divider text-[10px] font-bold text-stone uppercase tracking-widest">
              <div className="col-span-4">Categoria</div>
              <div className="col-span-5">Nome / Empresa</div>
              <div className="col-span-3">Telefone</div>
            </div>
            {suppliers.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 items-center py-2 border-b border-divider/50 last:border-0">
                <div className="col-span-4 text-sm font-bold text-stone">{item.category}</div>
                <div className="col-span-5">
                  <input 
                    type="text" 
                    value={item.name}
                    onChange={(e) => {
                      const newS = [...suppliers];
                      newS[idx].name = e.target.value;
                      setSuppliers(newS);
                    }}
                    placeholder="Nome"
                    className="w-full bg-ivory border border-divider rounded px-3 py-1.5 text-sm outline-none focus:border-rose transition-colors"
                  />
                </div>
                <div className="col-span-3">
                  <input 
                    type="text" 
                    value={item.phone}
                    onChange={(e) => {
                      const newS = [...suppliers];
                      newS[idx].phone = e.target.value;
                      setSuppliers(newS);
                    }}
                    placeholder="Telefone"
                    className="w-full bg-ivory border border-divider rounded px-3 py-1.5 text-sm outline-none focus:border-rose transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
