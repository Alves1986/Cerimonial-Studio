import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Couple } from '../types/database';
import { Loader2, Printer, Save, ChevronRight, ChevronLeft, Download, Plus, Trash2, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const getInitialProfile = () => {
  try {
    const saved = localStorage.getItem('cerimonialista_profile');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {};
};

export default function Contrato({ userPlan, onUpgrade }: { userPlan: string, onUpgrade: () => void }) {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');

  const [formData, setFormData] = useState({
    // Contratado
    nome_cont: '',
    cpf_cont: '',
    end_cont: '',
    cidade_cont: 'Telêmaco Borba / PR',
    tel_cont: '',
    email_cont: '',
    
    // Contratantes
    nome1: '',
    cpf1: '',
    nome2: '',
    cpf2: '',
    end_noivo: '',
    tel_noivo: '',
    email_noivo: '',
    
    // Evento
    data: '',
    hora: '',
    convidados: '',
    local_cer: '',
    local_fes: '',
    
    // Serviços
    pacote: 'mc',
    srv_detail: '',
    imagem: 'autoriza',
    hora_extra: '',
    
    // Pagamento
    valor_total: '',
    valor_extenso: '',
    p1_valor: '', p1_data: '', p1_forma: 'PIX', p1_status: 'Pendente',
    p2_valor: '', p2_data: '', p2_forma: 'PIX', p2_status: 'Pendente',
    p3_valor: '', p3_data: '', p3_forma: 'PIX', p3_status: 'Pendente',
    banco: '',
    remarcacao: '',
    foro: 'Telêmaco Borba',
    fornecedores: [] as { empresa: string, email: string, whatsapp: string }[]
  });

  const PKGS: Record<string, string> = {
    mc: 'Mestre de Cerimônias — condução oral da cerimônia e/ou recepção',
    dia: 'Cerimonial do Dia — coordenação completa no dia do evento',
    assessoria: 'Assessoria + Cerimonial — reuniões mensais, planejamento e coordenação',
    premium: 'Pacote Premium — assessoria completa com equipe de apoio'
  };

  useEffect(() => {
    fetchCouples();
    fetchCerimonialistaProfile();
  }, []);

  useEffect(() => {
    if (selectedCoupleId) {
      const couple = couples.find(c => c.id === selectedCoupleId);
      if (couple) {
        setFormData(prev => ({
          ...prev,
          nome1: couple.name1,
          nome2: couple.name2,
          data: couple.event_date || '',
          hora: couple.event_time || '',
          convidados: couple.guests?.toString() || '',
          local_cer: couple.location || '',
          tel_noivo: couple.whatsapp || '',
          pacote: couple.package_type || 'mc'
        }));
      }
      fetchContractData(selectedCoupleId);
    } else {
      // Reset form but keep contratado info
      setFormData(prev => ({
        ...prev,
        nome1: '', cpf1: '', nome2: '', cpf2: '', end_noivo: '', tel_noivo: '', email_noivo: '',
        data: '', hora: '', convidados: '', local_cer: '', local_fes: '',
        pacote: 'mc', srv_detail: '', imagem: 'autoriza', hora_extra: '',
        valor_total: '', valor_extenso: '',
        p1_valor: '', p1_data: '', p1_forma: 'PIX', p1_status: 'Pendente',
        p2_valor: '', p2_data: '', p2_forma: 'PIX', p2_status: 'Pendente',
        p3_valor: '', p3_data: '', p3_forma: 'PIX', p3_status: 'Pendente',
        banco: '', remarcacao: '', foro: 'Telêmaco Borba',
        fornecedores: []
      }));
    }
  }, [selectedCoupleId]);

  const fetchCerimonialistaProfile = async () => {
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
        setFormData(prev => ({
          ...prev,
          nome_cont: data.nome_cont || prev.nome_cont,
          cpf_cont: data.cpf_cont || prev.cpf_cont,
          end_cont: data.end_cont || prev.end_cont,
          cidade_cont: data.cidade_cont || prev.cidade_cont,
          tel_cont: data.tel_cont || prev.tel_cont,
          email_cont: data.email_cont || prev.email_cont,
        }));
      } else {
        // Fallback to localStorage if Supabase has no data yet
        const saved = localStorage.getItem('cerimonialista_profile');
        if (saved) {
          try {
            const localData = JSON.parse(saved);
            setFormData(prev => ({ ...prev, ...localData }));
          } catch (e) {}
        }
      }
    } catch (error) {
      console.error('Error fetching cerimonialista profile:', error);
    }
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

  const fetchContractData = async (coupleId: string) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('data')
        .eq('couple_id', coupleId)
        .maybeSingle();

      if (error) throw error;

      if (data && data.data) {
        setFormData(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedCoupleId) return alert('Selecione um casal primeiro.');
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('contracts')
        .upsert({
          couple_id: selectedCoupleId,
          user_id: user.id,
          data: formData,
          created_at: new Date().toISOString()
        }, { onConflict: 'couple_id' });

      if (error) throw error;
      alert('Contrato salvo com sucesso!');
    } catch (error) {
      console.error('Error saving contract:', error);
      alert('Erro ao salvar contrato.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addFornecedor = () => {
    setFormData(prev => ({
      ...prev,
      fornecedores: [...(prev.fornecedores || []), { empresa: '', email: '', whatsapp: '' }]
    }));
  };

  const removeFornecedor = (index: number) => {
    setFormData(prev => {
      const newF = [...(prev.fornecedores || [])];
      newF.splice(index, 1);
      return { ...prev, fornecedores: newF };
    });
  };

  const handleFornecedorChange = (index: number, field: 'empresa' | 'email' | 'whatsapp', value: string) => {
    setFormData(prev => {
      const newF = [...(prev.fornecedores || [])];
      newF[index] = { ...newF[index], [field]: value };
      return { ...prev, fornecedores: newF };
    });
  };

  const fmtDate = (d: string) => {
    if (!d) return '___/___/______';
    try {
      return format(new Date(d), 'dd/MM/yyyy');
    } catch {
      return '___/___/______';
    }
  };

  const exportToPDF = () => {
    const element = document.getElementById('contract-preview-content');
    if (!element) return;
    
    const opt = {
      margin:       15,
      filename:     `contrato_${formData.nome1 || 'noivo1'}_${formData.nome2 || 'noivo2'}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose" /></div>;
  }

  if (!userPlan?.includes('Pro')) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-divider rounded-2xl shadow-sm animate-page-in">
        <div className="w-20 h-20 bg-blush rounded-full flex items-center justify-center mb-6">
          <Lock className="text-rose w-10 h-10" />
        </div>
        <h3 className="font-display text-2xl text-ink mb-3">Funcionalidade Exclusiva</h3>
        <p className="text-stone font-light text-center max-w-md mb-8">
          A geração de contratos personalizados é um recurso exclusivo do <strong>Plano Pro</strong>. 
          Faça o upgrade agora para profissionalizar seus atendimentos!
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
          <h2 className="text-3xl font-display font-medium text-ink">Gerar Contrato</h2>
          <p className="text-stone text-sm font-light mt-1">Preencha os dados para gerar o contrato personalizado</p>
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
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider text-rose-dark bg-blush hover:bg-blush-mid rounded-lg transition-all"
          >
            <Download className="w-4 h-4" /> PDF
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
          { id: 'dados', label: 'Partes' },
          { id: 'servicos', label: 'Serviços' },
          { id: 'pagamento', label: 'Pagamento' },
          { id: 'fornecedores', label: 'Fornecedores' },
          { id: 'preview', label: 'Visualizar' }
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

      {/* TAB: DADOS */}
      <div className={cn("space-y-6", activeTab !== 'dados' && "hidden print:hidden")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
            <h3 className="font-display text-lg font-medium text-ink mb-4 pb-3 border-b border-divider">Cerimonialista</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Nome completo</label>
                <input type="text" name="nome_cont" value={formData.nome_cont} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">CPF / CNPJ</label>
                <input type="text" name="cpf_cont" value={formData.cpf_cont} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Endereço</label>
                <input type="text" name="end_cont" value={formData.end_cont} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Cidade / Estado</label>
                <input type="text" name="cidade_cont" value={formData.cidade_cont} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Telefone</label>
                <input type="text" name="tel_cont" value={formData.tel_cont} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">E-mail</label>
                <input type="email" name="email_cont" value={formData.email_cont} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
            <h3 className="font-display text-lg font-medium text-ink mb-4 pb-3 border-b border-divider">Noivos</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Nome — Noivo(a) 1</label>
                  <input type="text" name="nome1" value={formData.nome1} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone uppercase tracking-widest">CPF 1</label>
                  <input type="text" name="cpf1" value={formData.cpf1} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Nome — Noivo(a) 2</label>
                  <input type="text" name="nome2" value={formData.nome2} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone uppercase tracking-widest">CPF 2</label>
                  <input type="text" name="cpf2" value={formData.cpf2} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Endereço do casal</label>
                <input type="text" name="end_noivo" value={formData.end_noivo} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Telefone</label>
                <input type="text" name="tel_noivo" value={formData.tel_noivo} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">E-mail</label>
                <input type="email" name="email_noivo" value={formData.email_noivo} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
          <h3 className="font-display text-lg font-medium text-ink mb-4 pb-3 border-b border-divider">Dados do evento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Data</label>
              <input type="date" name="data" value={formData.data} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Horário</label>
              <input type="time" name="hora" value={formData.hora} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Convidados</label>
              <input type="number" name="convidados" value={formData.convidados} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Local da cerimônia</label>
              <input type="text" name="local_cer" value={formData.local_cer} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Local da recepção</label>
              <input type="text" name="local_fes" value={formData.local_fes} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" placeholder="Se diferente da cerimônia" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={() => setActiveTab('servicos')} className="flex items-center gap-2 px-6 py-2 text-sm font-bold uppercase tracking-wider text-white bg-rose hover:bg-rose-dark rounded-lg transition-all">
            Próximo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB: SERVIÇOS */}
      <div className={cn("space-y-6", activeTab !== 'servicos' && "hidden print:hidden")}>
        <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
          <h3 className="font-display text-lg font-medium text-ink mb-4 pb-3 border-b border-divider">Pacote de serviços</h3>
          
          <div className="space-y-3 mb-6">
            {[
              { val: 'mc', title: 'Mestre de Cerimônias', desc: 'Condução oral da cerimônia e/ou recepção — sem gestão de bastidores' },
              { val: 'dia', title: 'Cerimonial do Dia', desc: 'Coordenação completa no dia — chegada antecipada, gestão de todos os momentos' },
              { val: 'assessoria', title: 'Assessoria + Cerimonial', desc: 'Reuniões mensais, indicação de fornecedores, ensaio e coordenação completa' },
              { val: 'premium', title: 'Pacote Premium', desc: 'Assessoria completa com equipe de apoio, relatório pós-evento' }
            ].map(pkg => (
              <label key={pkg.val} className={cn(
                "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all",
                formData.pacote === pkg.val ? "border-rose bg-blush" : "border-divider bg-ivory hover:border-rose/50"
              )}>
                <input 
                  type="radio" 
                  name="pacote" 
                  value={pkg.val} 
                  checked={formData.pacote === pkg.val}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 accent-rose"
                />
                <div>
                  <div className="text-sm font-bold text-ink">{pkg.title}</div>
                  <div className="text-xs text-stone font-light mt-1">{pkg.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="space-y-4 pt-6 border-t border-divider">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Detalhamento adicional</label>
              <textarea name="srv_detail" value={formData.srv_detail} onChange={handleChange} rows={3} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" placeholder="Especificidades acordadas com o casal..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Direito de imagem para portfólio</label>
                <select name="imagem" value={formData.imagem} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm">
                  <option value="autoriza">Casal autoriza uso de imagens</option>
                  <option value="nao">Casal não autoriza uso de imagens</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Valor por hora extra</label>
                <input type="text" name="hora_extra" value={formData.hora_extra} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" placeholder="Ex: R$ 150,00" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button onClick={() => setActiveTab('dados')} className="flex items-center gap-2 px-6 py-2 text-sm font-bold uppercase tracking-wider text-rose-dark bg-transparent border border-blush-mid rounded-lg hover:bg-blush hover:border-rose transition-all">
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <button onClick={() => setActiveTab('pagamento')} className="flex items-center gap-2 px-6 py-2 text-sm font-bold uppercase tracking-wider text-white bg-rose hover:bg-rose-dark rounded-lg transition-all">
            Próximo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB: PAGAMENTO */}
      <div className={cn("space-y-6", activeTab !== 'pagamento' && "hidden print:hidden")}>
        <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
          <h3 className="font-display text-lg font-medium text-ink mb-4 pb-3 border-b border-divider">Condições de pagamento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Valor total</label>
              <input type="text" name="valor_total" value={formData.valor_total} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" placeholder="R$ 0.000,00" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Valor por extenso</label>
              <input type="text" name="valor_extenso" value={formData.valor_extenso} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" placeholder="dois mil reais" />
            </div>
          </div>

          <div className="space-y-3 mb-6 overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-4 gap-4 px-2 text-[10px] font-bold text-stone uppercase tracking-widest mb-2">
                <div>Valor</div>
                <div>Vencimento</div>
                <div>Forma</div>
                <div>Status</div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-3">
                <input type="text" name="p1_valor" value={formData.p1_valor} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-3 py-2 outline-none focus:border-rose transition-all text-sm" placeholder="1ª parcela — sinal" />
                <input type="date" name="p1_data" value={formData.p1_data} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-3 py-2 outline-none focus:border-rose transition-all text-sm" />
                <select name="p1_forma" value={formData.p1_forma} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-3 py-2 outline-none focus:border-rose transition-all text-sm">
                  <option>PIX</option><option>Transferência</option><option>Dinheiro</option>
                </select>
                <select name="p1_status" value={formData.p1_status} onChange={handleChange} className={cn("w-full border rounded-lg px-3 py-2 outline-none transition-all text-sm font-medium", formData.p1_status === 'Pago' ? 'bg-green-50 text-green-700 border-green-200' : formData.p1_status === 'Atrasado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-ivory text-stone border-divider')}>
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-3">
                <input type="text" name="p2_valor" value={formData.p2_valor} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-3 py-2 outline-none focus:border-rose transition-all text-sm" placeholder="2ª parcela (opcional)" />
                <input type="date" name="p2_data" value={formData.p2_data} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-3 py-2 outline-none focus:border-rose transition-all text-sm" />
                <select name="p2_forma" value={formData.p2_forma} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-3 py-2 outline-none focus:border-rose transition-all text-sm">
                  <option>PIX</option><option>Transferência</option><option>Dinheiro</option>
                </select>
                <select name="p2_status" value={formData.p2_status} onChange={handleChange} className={cn("w-full border rounded-lg px-3 py-2 outline-none transition-all text-sm font-medium", formData.p2_status === 'Pago' ? 'bg-green-50 text-green-700 border-green-200' : formData.p2_status === 'Atrasado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-ivory text-stone border-divider')}>
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <input type="text" name="p3_valor" value={formData.p3_valor} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-3 py-2 outline-none focus:border-rose transition-all text-sm" placeholder="Saldo final" />
                <input type="date" name="p3_data" value={formData.p3_data} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-3 py-2 outline-none focus:border-rose transition-all text-sm" />
                <select name="p3_forma" value={formData.p3_forma} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-3 py-2 outline-none focus:border-rose transition-all text-sm">
                  <option>PIX</option><option>Transferência</option><option>Dinheiro</option>
                </select>
                <select name="p3_status" value={formData.p3_status} onChange={handleChange} className={cn("w-full border rounded-lg px-3 py-2 outline-none transition-all text-sm font-medium", formData.p3_status === 'Pago' ? 'bg-green-50 text-green-700 border-green-200' : formData.p3_status === 'Atrasado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-ivory text-stone border-divider')}>
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-divider">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Dados bancários / chave PIX</label>
              <textarea name="banco" value={formData.banco} onChange={handleChange} rows={2} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" placeholder="Chave PIX: xxx  |  Banco: xxx  |  Titular: xxx" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Taxa de remarcação</label>
                <input type="text" name="remarcacao" value={formData.remarcacao} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" placeholder="Ex: R$ 500,00" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone uppercase tracking-widest">Comarca do foro</label>
                <input type="text" name="foro" value={formData.foro} onChange={handleChange} className="w-full bg-ivory border border-divider rounded-lg px-4 py-2 outline-none focus:border-rose transition-all text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button onClick={() => setActiveTab('servicos')} className="flex items-center gap-2 px-6 py-2 text-sm font-bold uppercase tracking-wider text-rose-dark bg-transparent border border-blush-mid rounded-lg hover:bg-blush hover:border-rose transition-all">
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <button onClick={() => setActiveTab('fornecedores')} className="flex items-center gap-2 px-6 py-2 text-sm font-bold uppercase tracking-wider text-white bg-rose hover:bg-rose-dark rounded-lg transition-all">
            Próximo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB: FORNECEDORES */}
      <div className={cn("space-y-6", activeTab !== 'fornecedores' && "hidden print:hidden")}>
        <div className="bg-white border border-divider rounded-xl p-6 shadow-sm">
          <h3 className="font-display text-lg font-medium text-ink mb-4 pb-3 border-b border-divider">Fornecedores</h3>
          
          <div className="space-y-4 overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-12 gap-4 px-2 pb-2 border-b border-divider text-[10px] font-bold text-stone uppercase tracking-widest">
                <div className="col-span-4">Nome da Empresa</div>
                <div className="col-span-4">E-mail de Contato</div>
                <div className="col-span-3">WhatsApp</div>
                <div className="col-span-1 text-center">Ações</div>
              </div>
              {(formData.fornecedores || []).map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center py-2 border-b border-divider/50 last:border-0">
                  <div className="col-span-4">
                    <input 
                      type="text" 
                      value={item.empresa}
                      onChange={(e) => handleFornecedorChange(idx, 'empresa', e.target.value)}
                      placeholder="Nome da empresa"
                      className="w-full bg-ivory border border-divider rounded px-3 py-1.5 text-sm outline-none focus:border-rose transition-colors"
                    />
                  </div>
                  <div className="col-span-4">
                    <input 
                      type="email" 
                      value={item.email}
                      onChange={(e) => handleFornecedorChange(idx, 'email', e.target.value)}
                      placeholder="E-mail de contato"
                      className="w-full bg-ivory border border-divider rounded px-3 py-1.5 text-sm outline-none focus:border-rose transition-colors"
                    />
                  </div>
                  <div className="col-span-3">
                    <input 
                      type="text" 
                      value={item.whatsapp || ''}
                      onChange={(e) => handleFornecedorChange(idx, 'whatsapp', e.target.value)}
                      placeholder="WhatsApp"
                      className="w-full bg-ivory border border-divider rounded px-3 py-1.5 text-sm outline-none focus:border-rose transition-colors"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center gap-1">
                    <button onClick={() => removeFornecedor(idx)} className="p-1 text-stone hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center print:hidden">
            <button onClick={addFornecedor} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-dark bg-blush hover:bg-blush-mid rounded-lg transition-all">
              <Plus className="w-4 h-4" /> Adicionar Fornecedor
            </button>
          </div>
        </div>

        <div className="flex justify-between">
          <button onClick={() => setActiveTab('pagamento')} className="flex items-center gap-2 px-6 py-2 text-sm font-bold uppercase tracking-wider text-rose-dark bg-transparent border border-blush-mid rounded-lg hover:bg-blush hover:border-rose transition-all">
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <button onClick={() => setActiveTab('preview')} className="flex items-center gap-2 px-6 py-2 text-sm font-bold uppercase tracking-wider text-white bg-rose hover:bg-rose-dark rounded-lg transition-all">
            Visualizar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB: PREVIEW */}
      <div className={cn("space-y-6", activeTab !== 'preview' && "hidden print:block")}>
        <div id="contract-preview-content" className="bg-white border border-divider rounded-xl p-12 shadow-sm max-w-4xl mx-auto text-sm leading-relaxed text-ink print:shadow-none print:border-none print:p-0">
          <h1 className="font-display text-2xl font-medium text-center mb-1">Contrato de Prestação de Serviços</h1>
          <div className="text-center text-xs font-bold tracking-widest uppercase text-stone mb-1">Cerimonial e / ou Mestre de Cerimônias de Casamento</div>
          <div className="text-center italic text-xs text-stone mb-8">Instrumento particular com força de obrigação</div>
          
          <hr className="border-t border-divider my-6" />
          
          <div className="text-[10px] font-bold tracking-widest uppercase text-rose-dark mb-3">Identificação do Contratado</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-light">
            <div><b className="font-bold text-ink-light">Nome:</b> {formData.nome_cont || '_______________________'}</div>
            <div><b className="font-bold text-ink-light">CPF / CNPJ:</b> {formData.cpf_cont || '___________________'}</div>
            <div><b className="font-bold text-ink-light">Endereço:</b> {formData.end_cont || '_______________________'}</div>
            <div><b className="font-bold text-ink-light">Cidade / Estado:</b> {formData.cidade_cont || 'Telêmaco Borba / PR'}</div>
            <div><b className="font-bold text-ink-light">Telefone:</b> {formData.tel_cont || '_______________________'}</div>
            <div><b className="font-bold text-ink-light">E-mail:</b> {formData.email_cont || '_______________________'}</div>
          </div>

          <hr className="border-t border-divider my-6" />
          
          <div className="text-[10px] font-bold tracking-widest uppercase text-rose-dark mb-3">Identificação dos Contratantes</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-light">
            <div><b className="font-bold text-ink-light">Noivo(a) 1:</b> {formData.nome1 || '_______________________'}</div>
            <div><b className="font-bold text-ink-light">CPF:</b> {formData.cpf1 || '___________________'}</div>
            <div><b className="font-bold text-ink-light">Noivo(a) 2:</b> {formData.nome2 || '_______________________'}</div>
            <div><b className="font-bold text-ink-light">CPF:</b> {formData.cpf2 || '___________________'}</div>
            <div><b className="font-bold text-ink-light">Endereço:</b> {formData.end_noivo || '_______________________'}</div>
            <div><b className="font-bold text-ink-light">Telefone:</b> {formData.tel_noivo || '_______________________'}</div>
          </div>

          <hr className="border-t border-divider my-6" />
          
          <div className="text-[10px] font-bold tracking-widest uppercase text-rose-dark mb-3">Dados do Evento</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-light">
            <div><b className="font-bold text-ink-light">Data:</b> {fmtDate(formData.data)}</div>
            <div><b className="font-bold text-ink-light">Horário:</b> {formData.hora || '___:___'}</div>
            <div><b className="font-bold text-ink-light">Local cerimônia:</b> {formData.local_cer || '_______________________'}</div>
            <div><b className="font-bold text-ink-light">Local recepção:</b> {formData.local_fes || 'Mesmo local'}</div>
            <div><b className="font-bold text-ink-light">Convidados:</b> {formData.convidados || '___'}</div>
          </div>

          <hr className="border-t border-divider my-6" />

          <div className="space-y-6 text-justify font-light">
            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 1ª — Do objeto</h4>
              <p>O presente instrumento tem por objeto a prestação de serviços de <strong>{PKGS[formData.pacote]}</strong>.</p>
              {formData.srv_detail && <p className="mt-2 italic">Detalhamento: {formData.srv_detail}</p>}
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 2ª — Do valor e pagamento</h4>
              <p>Valor total: <strong>{formData.valor_total || 'R$ _______________'}</strong> ({formData.valor_extenso || '___________________________'}).</p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>· 1ª parcela (sinal): <strong>{formData.p1_valor || 'R$ ___'}</strong> — vencimento {fmtDate(formData.p1_data)} via {formData.p1_forma}</li>
                <li>· 2ª parcela: <strong>{formData.p2_valor || 'R$ ___'}</strong> — vencimento {fmtDate(formData.p2_data)} via {formData.p2_forma}</li>
                <li>· Saldo final: <strong>{formData.p3_valor || 'R$ ___'}</strong> — vencimento {fmtDate(formData.p3_data)} via {formData.p3_forma}</li>
              </ul>
              {formData.banco && <p className="mt-2"><strong>Dados bancários:</strong> {formData.banco}</p>}
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 3ª — Da reserva de data</h4>
              <p>O pagamento do sinal confirma a reserva exclusiva da data. Em caso de não pagamento no prazo, o presente contrato perderá seus efeitos, ficando o CONTRATADO livre para negociar a data com terceiros.</p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 4ª — Do cancelamento</h4>
              <p><strong>Pelos CONTRATANTES:</strong> acima de 180 dias — devolução de 80%; entre 90 e 179 dias — 50%; entre 30 e 89 dias — 20%; menos de 30 dias — sem devolução.<br/><br/>
              <strong>Pelo CONTRATADO</strong> sem justo motivo: devolução integral mais multa de 20% sobre o total do contrato. Justo motivo: caso fortuito, força maior, doença grave comprovada, falecimento de familiar de 1º grau.</p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 5ª — Da remarcação</h4>
              <p>Uma remarcação gratuita com mínimo de 60 dias de antecedência, sujeita à disponibilidade. Solicitações com menos de 60 dias implicam taxa de <strong>{formData.remarcacao || 'R$ ___,00'}</strong>. Valores pagos são integralmente creditados para a nova data.</p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 6ª — Das obrigações do Contratado</h4>
              <p>Comparecer com mínimo de 90 min de antecedência; realizar ao menos 1 reunião de alinhamento; entregar roteiro escrito com 7 dias de antecedência; manter postura profissional; guardar discrição sobre informações do casal; coordenar comunicação com fornecedores; solucionar imprevistos de forma discreta.</p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 7ª — Das obrigações dos Contratantes</h4>
              <p>Fornecer informações com mínimo de 21 dias de antecedência; responder comunicações em até 48 horas úteis; efetuar pagamentos nas datas pactuadas; comunicar alterações relevantes com mínimo de 15 dias de antecedência.</p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 8ª — Da limitação de responsabilidade</h4>
              <p>O CONTRATADO não se responsabiliza por falhas de outros fornecedores, condições climáticas, atrasos dos noivos ou convidados, danos materiais no espaço, conflitos interpessoais ou caso fortuito e força maior (Art. 393 do Código Civil). A responsabilidade máxima está limitada ao valor total pago.</p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 9ª — Do direito de imagem</h4>
              <p>O casal <strong>{formData.imagem === 'autoriza' ? 'AUTORIZA' : 'NÃO AUTORIZA'}</strong> o uso de imagens do evento para portfólio profissional. Em nenhuma hipótese serão divulgados dados pessoais sensíveis, valores financeiros ou situações constrangedoras.</p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 10ª — Da confidencialidade</h4>
              <p>O CONTRATADO mantém sigilo absoluto sobre todas as informações obtidas em razão deste contrato, incluindo dados pessoais, situações familiares, valores pagos a fornecedores e quaisquer informações sensíveis compartilhadas durante o planejamento.</p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 11ª — Das alterações de escopo</h4>
              <p>Qualquer ampliação de escopo deve ser acordada por escrito. Extensões de jornada além de 1 hora serão cobradas à razão de <strong>{formData.hora_extra || 'R$ ___,00 / hora'}</strong>.</p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 12ª — Do foro</h4>
              <p>As partes elegem o Foro da Comarca de <strong>{formData.foro || 'Telêmaco Borba'}</strong> para dirimir quaisquer conflitos, com renúncia a qualquer outro foro. Comprometem-se a buscar resolução amigável em primeiro lugar.</p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-rose-dark mb-2">Cláusula 13ª — Disposições gerais</h4>
              <p>Este contrato representa o acordo integral entre as partes. Modificações somente por escrito com assinatura de ambas as partes. Cláusulas inválidas não afetam as demais, que permanecem em pleno vigor.</p>
            </div>
          </div>

          <hr className="border-t border-divider my-10" />
          
          <p className="text-xs text-stone text-center mb-12">
            {formData.cidade_cont || 'Telêmaco Borba'}, _______ de _____________________ de _________
          </p>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div className="text-center border-t border-ink pt-2">
              <strong className="block text-xs text-ink-light">{formData.nome_cont || 'Cerimonialista'}</strong>
              <span className="text-[11px] text-stone font-light">Contratado</span>
            </div>
            <div className="text-center border-t border-ink pt-2">
              <strong className="block text-xs text-ink-light">{[formData.nome1, formData.nome2].filter(Boolean).join(' & ') || 'Noivos'}</strong>
              <span className="text-[11px] text-stone font-light">Contratantes</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div className="text-center border-t border-ink pt-2">
              <strong className="block text-xs text-ink-light">Testemunha 1</strong>
              <span className="text-[11px] text-stone font-light">Nome completo / CPF</span>
            </div>
            <div className="text-center border-t border-ink pt-2">
              <strong className="block text-xs text-ink-light">Testemunha 2</strong>
              <span className="text-[11px] text-stone font-light">Nome completo / CPF</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
