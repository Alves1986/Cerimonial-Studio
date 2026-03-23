import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Heart, Trash2, Edit2, Loader2, Phone, MapPin, Users as UsersIcon, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Couples() {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCouple, setEditingCouple] = useState<Couple | null>(null);

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
    } catch (error) {
      console.error('Error deleting couple:', error);
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
          <h2 className="text-3xl font-display font-medium text-ink">Meus Casais</h2>
          <p className="text-stone text-sm font-light mt-1">Gerencie contratos, checklists e planners vinculados</p>
        </div>
        <button
          onClick={() => { setEditingCouple(null); setShowModal(true); }}
          className="bg-rose hover:bg-rose-dark text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2 uppercase text-xs tracking-wider"
        >
          <Plus className="w-4 h-4" /> Novo Casal
        </button>
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
          <div className="w-16 h-16 bg-blush rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="text-rose w-8 h-8" />
          </div>
          <h3 className="font-display text-xl text-ink mb-2">Nenhum casal cadastrado</h3>
          <p className="text-stone font-light">Clique em "Novo Casal" para começar</p>
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

function CoupleCard({ couple, onDelete, onEdit }: { couple: Couple, onDelete: () => void, onEdit: () => void, key?: string | number }) {
  const date = couple.event_date ? format(new Date(couple.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data não definida';

  return (
    <div className="bg-white border border-divider rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-display text-xl text-ink leading-tight">
            {couple.name1} <em className="text-rose-dark text-sm block not-italic font-display italic mt-1">& {couple.name2}</em>
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <div className="flex items-center gap-2 text-xs text-stone font-light">
              <Calendar className="w-3 h-3" /> {date} {couple.event_time ? ` · ${couple.event_time}` : ''}
            </div>
            {couple.location && (
              <div className="flex items-center gap-2 text-xs text-stone font-light">
                <MapPin className="w-3 h-3" /> {couple.location}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-stone font-light">
              <UsersIcon className="w-3 h-3" /> {couple.guests || '?'} convidados · {couple.ceremony_type || '—'}
            </div>
          </div>
        </div>
        <span className="bg-blush text-rose-dark text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {couple.package_type || 'Básico'}
        </span>
      </div>

      <div className="flex gap-2 mt-6 pt-6 border-t border-divider">
        <button onClick={onEdit} className="flex-1 bg-ivory hover:bg-blush border border-divider rounded-lg py-2 text-[10px] font-bold uppercase tracking-widest text-stone hover:text-rose-dark transition-all">
          Editar
        </button>
        <button onClick={onDelete} className="bg-ivory hover:bg-red-50 border border-divider rounded-lg px-3 py-2 text-stone hover:text-red-500 transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CoupleModal({ couple, onClose, onSave }: { couple: Couple | null, onClose: () => void, onSave: () => void }) {
  const [loading, setLoading] = useState(false);
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
      } else {
        const { error } = await supabase.from('couples').insert([payload]);
        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving couple:', error);
      alert('Erro ao salvar casal. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-page-in">
        <div className="p-8 border-b border-divider flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="font-display text-2xl font-medium text-ink">{couple ? 'Editar Casal' : 'Novo Casal'}</h3>
          <button onClick={onClose} className="text-stone hover:text-ink transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Nome — Noivo(a) 1</label>
              <input
                type="text"
                value={formData.name1}
                onChange={e => setFormData({ ...formData, name1: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Nome — Noivo(a) 2</label>
              <input
                type="text"
                value={formData.name2}
                onChange={e => setFormData({ ...formData, name2: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Data do Casamento</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Horário</label>
              <input
                type="time"
                value={formData.event_time}
                onChange={e => setFormData({ ...formData, event_time: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Local</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all"
                placeholder="Nome e endereço do local"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Telefone / WhatsApp</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Tipo de Cerimônia</label>
              <select
                value={formData.ceremony_type}
                onChange={e => setFormData({ ...formData, ceremony_type: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all"
              >
                <option>Católica</option>
                <option>Evangélica</option>
                <option>Civil</option>
                <option>Simbólica</option>
                <option>Ecumênica</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Estimativa de Convidados</label>
              <input
                type="number"
                value={formData.guests}
                onChange={e => setFormData({ ...formData, guests: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Pacote</label>
              <select
                value={formData.package_type}
                onChange={e => setFormData({ ...formData, package_type: e.target.value })}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all"
              >
                <option value="mc">Mestre de Cerimônias</option>
                <option value="dia">Cerimonial do Dia</option>
                <option value="assessoria">Assessoria + Cerimonial</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Observações</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-divider">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-stone hover:text-ink transition-colors text-sm font-bold uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-rose hover:bg-rose-dark text-white font-bold py-2 px-8 rounded-lg transition-all flex items-center gap-2 uppercase text-xs tracking-wider disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : couple ? 'Salvar Alterações' : 'Cadastrar Casal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
