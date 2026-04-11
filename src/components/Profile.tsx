import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Loader2, User, Mail, Phone, MapPin, CreditCard, Sparkles } from 'lucide-react';
import { useToast } from './Toast';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    nome_cont: '',
    cpf_cont: '',
    end_cont: '',
    cidade_cont: '',
    tel_cont: '',
    email_cont: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cerimonialista_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData({
          nome_cont: data.nome_cont || '',
          cpf_cont: data.cpf_cont || '',
          end_cont: data.end_cont || '',
          cidade_cont: data.cidade_cont || '',
          tel_cont: data.tel_cont || '',
          email_cont: data.email_cont || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast('Erro ao carregar perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cerimonialista_profiles')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      // Sync with localStorage for backward compatibility if needed
      localStorage.setItem('cerimonialista_profile', JSON.stringify(formData));
      
      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Erro ao salvar perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-rose" /></div>;
  }

  return (
    <div className="animate-page-in max-w-4xl mx-auto">
      <div className="mb-8 pb-6 border-b border-divider flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-medium text-ink">Meu Perfil</h2>
          <p className="text-stone text-sm font-light mt-1">Configure seus dados profissionais para os contratos</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-rose uppercase tracking-widest bg-blush px-4 py-2 rounded-full">
          <Sparkles className="w-3 h-3" /> Identidade Profissional
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white border border-divider rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1 flex items-center gap-2">
                  <User className="w-3 h-3 text-rose" /> Nome Completo / Razão Social
                </label>
                <input
                  type="text"
                  value={formData.nome_cont}
                  onChange={e => setFormData({ ...formData, nome_cont: e.target.value })}
                  className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1 flex items-center gap-2">
                  <CreditCard className="w-3 h-3 text-rose" /> CPF ou CNPJ
                </label>
                <input
                  type="text"
                  value={formData.cpf_cont}
                  onChange={e => setFormData({ ...formData, cpf_cont: e.target.value })}
                  className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Mail className="w-3 h-3 text-rose" /> E-mail de Contato
                </label>
                <input
                  type="email"
                  value={formData.email_cont}
                  onChange={e => setFormData({ ...formData, email_cont: e.target.value })}
                  className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Phone className="w-3 h-3 text-rose" /> Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.tel_cont}
                  onChange={e => setFormData({ ...formData, tel_cont: e.target.value })}
                  className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-rose" /> Endereço Profissional
                </label>
                <input
                  type="text"
                  value={formData.end_cont}
                  onChange={e => setFormData({ ...formData, end_cont: e.target.value })}
                  className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-rose" /> Cidade / Estado
                </label>
                <input
                  type="text"
                  value={formData.cidade_cont}
                  onChange={e => setFormData({ ...formData, cidade_cont: e.target.value })}
                  className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
                  placeholder="Ex: Curitiba / PR"
                />
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-ivory/50 border-t border-divider flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-rose hover:bg-rose-dark text-white font-bold py-4 px-10 rounded-2xl transition-all flex items-center gap-2 uppercase text-xs tracking-widest shadow-lg shadow-rose/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Alterações
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
