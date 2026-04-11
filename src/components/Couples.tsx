import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Heart, Trash2, Edit2, Loader2, Phone, MapPin, Users as UsersIcon, Calendar, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

export default function Couples({ userPlan }: { userPlan: string }) {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCouple, setEditingCouple] = useState<Couple | null>(null);
  const { showToast } = useToast();

  const getLimit = () => {
    if (userPlan?.includes('Pro')) return Infinity;
    if (userPlan?.includes('Básico') || userPlan?.includes('Basico')) return 10;
    return 3;
  };

  const isLimitReached = couples.length >= getLimit();

  useEffect(() => {
    fetchCouples();
  }, []);

  const fetchCouples = async () => {
    try {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCouples(data || []);
    } catch (error) {
      console.error('Error fetching couples:', error);
      showToast('Erro ao carregar casais.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este casal?')) return;

    try {
      const { error } = await supabase.from('couples').delete().eq('id', id);
      if (error) throw error;
      setCouples(couples.filter(c => c.id !== id));
      showToast('Casal removido com sucesso.', 'success');
    } catch (error) {
      console.error('Error deleting couple:', error);
      showToast('Erro ao remover casal.', 'error');
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
      <div className="mb-8 pb-6 border-b border-divider flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-medium text-ink">Meus Casais</h2>
          <p className="text-stone text-sm font-light mt-1">Gerencie contratos, checklists e planners vinculados</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <div className="text-[10px] font-bold text-stone uppercase tracking-widest">Limite do Plano</div>
            <div className="text-xs font-medium text-ink">
              {couples.length} / {getLimit() === Infinity ? '∞' : getLimit()} casais
            </div>
          </div>
          <button
            onClick={() => { 
              if (!editingCouple && isLimitReached) {
                showToast(`Seu plano atual permite até ${getLimit()} casais. Faça o upgrade para cadastrar mais!`, 'info');
                return;
              }
              setEditingCouple(null); 
              setShowModal(true); 
            }}
            className="bg-rose hover:bg-rose-dark text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 uppercase text-xs tracking-widest shadow-lg shadow-rose/20"
          >
            <Plus className="w-4 h-4" /> Novo Casal
          </button>
        </div>
      </div>

      {couples.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {couples.map(couple => (
            <CoupleCard
              key={couple.id}
              couple={couple}
              onDelete={() => handleDelete(couple.id)}
              onEdit={() => { setEditingCouple(couple); setShowModal(true); }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-divider rounded-2xl shadow-sm">
          <div className="w-20 h-20 bg-blush rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="text-rose w-10 h-10" />
          </div>
          <h3 className="font-display text-2xl text-ink mb-2">Nenhum casal cadastrado</h3>
          <p className="text-stone font-light max-w-xs mx-auto">Comece cadastrando seu primeiro casal para gerenciar o evento.</p>
        </div>
      )}

      {showModal && (
        <CoupleModal
          couple={editingCouple}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchCouples(); }}
        />
      )}
    </div>
  );
}

function CoupleCard({ couple, onDelete, onEdit }: { couple: Couple, onDelete: () => void, onEdit: () => void }) {
  const date = couple.event_date ? format(new Date(couple.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data não definida';

  return (
    <div className="bg-white border border-divider rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Sparkles className="w-4 h-4 text-rose/20" />
      </div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="font-display text-2xl text-ink leading-tight">
            {couple.name1} <span className="text-rose font-serif italic">&</span> {couple.name2}
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-xs text-stone font-medium">
              <Calendar className="w-3.5 h-3.5 text-rose" /> {date} {couple.event_time ? ` · ${couple.event_time}` : ''}
            </div>
            {couple.location && (
              <div className="flex items-center gap-2 text-xs text-stone font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose" /> {couple.location}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-stone font-medium">
              <UsersIcon className="w-3.5 h-3.5 text-rose" /> {couple.guests || '?'} convidados · {couple.ceremony_type || '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8 pt-6 border-t border-divider">
        <button 
          onClick={onEdit} 
          className="flex-1 bg-ivory hover:bg-blush border border-divider rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest text-stone hover:text-rose-dark transition-all flex items-center justify-center gap-2"
        >
          <Edit2 className="w-3 h-3" /> Editar
        </button>
        <button 
          onClick={onDelete} 
          className="bg-ivory hover:bg-red-50 border border-divider rounded-xl px-4 py-3 text-stone hover:text-red-500 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CoupleModal({ couple, onClose, onSave }: { couple: Couple | null, onClose: () => void, onSave: () => void }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name1: couple?.name1 || '',
    name2: couple?.name2 || '',
    event_date: couple?.event_date || '',
    event_time: couple?.event_time || '',
    location: couple?.location || '',
    whatsapp: couple?.whatsapp || '',
    ceremony_type: couple?.ceremony_type || 'Católica',
    guests: couple?.guests || '',
    package_type: couple?.package_type || 'mc',
    notes: couple?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const payload = {
        ...formData,
        user_id: user.id,
        guests: formData.guests ? parseInt(formData.guests.toString()) : null
      };

      if (couple) {
        const { error } = await supabase.from('couples').update(payload).eq('id', couple.id);
        if (error) throw error;
        showToast('Dados do casal atualizados!', 'success');
      } else {
        const { error } = await supabase.from('couples').insert([payload]);
        if (error) throw error;
        showToast('Novo casal cadastrado com sucesso!', 'success');
      }

      onSave();
    } catch (error) {
      console.error('Error saving couple:', error);
      showToast('Erro ao salvar casal. Verifique os dados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-page-in border border-divider">
        <div className="p-8 border-b border-divider flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <h3 className="font-display text-2xl font-medium text-ink">{couple ? 'Editar Casal' : 'Novo Casal'}</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-ivory flex items-center justify-center text-stone hover:text-ink transition-all">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1">Nome — Noivo(a) 1</label>
              <input
                type="text"
                value={formData.name1}
                onChange={e => setFormData({ ...formData, name1: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1">Nome — Noivo(a) 2</label>
              <input
                type="text"
                value={formData.name2}
                onChange={e => setFormData({ ...formData, name2: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1">Data do Casamento</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1">Horário</label>
              <input
                type="time"
                value={formData.event_time}
                onChange={e => setFormData({ ...formData, event_time: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1">Local do Evento</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
                placeholder="Ex: Espaço das Águas, Curitiba - PR"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1">WhatsApp de Contato</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1">Tipo de Cerimônia</label>
              <select
                value={formData.ceremony_type}
                onChange={e => setFormData({ ...formData, ceremony_type: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
              >
                <option value="Católica">Católica</option>
                <option value="Evangélica">Evangélica</option>
                <option value="Ecumênica">Ecumênica</option>
                <option value="Civil">Civil</option>
                <option value="Outra">Outra</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-divider">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-ivory hover:bg-linen text-stone font-bold py-4 rounded-xl transition-all uppercase text-xs tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-rose hover:bg-rose-dark text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-rose/20 uppercase text-xs tracking-widest"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-4 h-4" />}
              {couple ? 'Salvar Alterações' : 'Cadastrar Casal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
