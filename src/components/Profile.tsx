import React, { useState, useEffect } from 'react';
import { Save, Loader2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome_cont: '',
    cpf_cont: '',
    end_cont: '',
    cidade_cont: 'Telêmaco Borba / PR',
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
          cidade_cont: data.cidade_cont || 'Telêmaco Borba / PR',
          tel_cont: data.tel_cont || '',
          email_cont: data.email_cont || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('cerimonialista_profiles')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Also update localStorage for backward compatibility if needed, 
      // but primary source is now Supabase
      localStorage.setItem('cerimonialista_profile', JSON.stringify(formData));
      alert('Perfil salvo com sucesso!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-rose" />
      </div>
    );
  }


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="font-display text-3xl font-medium text-ink tracking-tight mb-2">Perfil do Cerimonialista</h2>
        <p className="text-stone font-light tracking-wide">Configure seus dados para preenchimento automático nos contratos.</p>
      </header>

      <div className="bg-white border border-divider rounded-xl p-8 shadow-sm max-w-2xl">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-divider">
          <div className="w-12 h-12 bg-blush rounded-full flex items-center justify-center text-rose">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-medium text-ink">Dados Profissionais</h3>
            <p className="text-xs text-stone uppercase tracking-widest mt-1">Informações para Contrato</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Nome Completo / Empresa</label>
              <input
                type="text"
                name="nome_cont"
                value={formData.nome_cont}
                onChange={handleChange}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-3 outline-none focus:border-rose transition-all text-sm"
                placeholder="Seu nome ou nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">CPF / CNPJ</label>
              <input
                type="text"
                name="cpf_cont"
                value={formData.cpf_cont}
                onChange={handleChange}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-3 outline-none focus:border-rose transition-all text-sm"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Endereço Completo</label>
            <input
              type="text"
              name="end_cont"
              value={formData.end_cont}
              onChange={handleChange}
              className="w-full bg-ivory border border-divider rounded-lg px-4 py-3 outline-none focus:border-rose transition-all text-sm"
              placeholder="Rua, Número, Bairro"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Cidade / UF</label>
              <input
                type="text"
                name="cidade_cont"
                value={formData.cidade_cont}
                onChange={handleChange}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-3 outline-none focus:border-rose transition-all text-sm"
                placeholder="Cidade / UF"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Telefone / WhatsApp</label>
              <input
                type="text"
                name="tel_cont"
                value={formData.tel_cont}
                onChange={handleChange}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-3 outline-none focus:border-rose transition-all text-sm"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">E-mail</label>
              <input
                type="email"
                name="email_cont"
                value={formData.email_cont}
                onChange={handleChange}
                className="w-full bg-ivory border border-divider rounded-lg px-4 py-3 outline-none focus:border-rose transition-all text-sm"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-divider flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white bg-rose hover:bg-rose-dark rounded-lg transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
