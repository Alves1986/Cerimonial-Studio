import React, { useState } from 'react';
import { AlertTriangle, Search, ChevronRight, ShieldAlert, Zap, Heart, Users, Clock, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

const EMERGENCIES = [
  {
    category: 'Noiva & Noivo',
    icon: <Heart className="w-5 h-5" />,
    items: [
      { title: 'Atraso da Noiva', solution: 'Mantenha a calma. Informe o celebrante e a equipe de música. Se o atraso for superior a 30 min, verifique se há outro evento no local. Ajuste o cronograma da recepção proporcionalmente.' },
      { title: 'Mal-estar no Altar', solution: 'Tenha sempre água e um leque à mão. Se necessário, peça para o casal sentar por alguns instantes. Tenha um kit de primeiros socorros básico (sal amargo, álcool).' },
      { title: 'Dano no Vestido/Terno', solution: 'Use o kit de costura de emergência. Alfinetes de segurança e fita dupla face são essenciais. Para manchas, use lenços umedecidos ou talco (para gordura).' }
    ]
  },
  {
    category: 'Cerimônia',
    icon: <Clock className="w-5 h-5" />,
    items: [
      { title: 'Falta de Padrinho/Madrinha', solution: 'Aguarde até o último limite. Se não chegarem, reorganize a entrada para que os pares fiquem equilibrados ou um padrinho entre sozinho com elegância.' },
      { title: 'Criança não quer entrar', solution: 'Nunca force. Tente atrair com um brinquedo ou doce à frente, ou peça para um dos pais acompanhar lateralmente. Se não entrar, siga o cortejo normalmente.' },
      { title: 'Queda de Energia', solution: 'Verifique imediatamente o gerador. Se não houver, peça silêncio absoluto para que a voz do celebrante alcance a todos. Use iluminação de celulares se necessário.' }
    ]
  },
  {
    category: 'Recepção',
    icon: <Users className="w-5 h-5" />,
    items: [
      { title: 'Convidado não listado', solution: 'Verifique com os noivos discretamente se devem ser acomodados. Tenha sempre uma "mesa de reserva" ou lugares extras planejados com o buffet.' },
      { title: 'Bebida acabando', solution: 'Monitore o consumo desde o início. Se notar que vai acabar, informe os noivos ou o responsável financeiro para autorizar compra extra imediata.' },
      { title: 'Convidado Inconveniente', solution: 'Aborde de forma discreta e gentil. Ofereça água ou café. Se necessário, peça ajuda a um familiar próximo para conduzi-lo a um local mais reservado.' }
    ]
  }
];

export default function Emergencias() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredEmergencies = EMERGENCIES.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.solution.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="animate-page-in">
      <div className="mb-12 pb-8 border-b border-divider flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-dark text-[10px] font-bold uppercase tracking-widest mb-2">
            <ShieldAlert className="w-3 h-3" /> Guia de Sobrevivência
          </div>
          <h2 className="text-4xl font-display font-medium text-ink">Manual de Imprevistos</h2>
          <p className="text-stone text-sm font-light mt-2">Protocolos profissionais para manter o controle em qualquer situação.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar imprevisto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-divider rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "w-full flex items-center justify-between px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all",
              selectedCategory === null ? "bg-rose text-white shadow-lg shadow-rose/20" : "bg-white text-stone hover:bg-ivory border border-divider"
            )}
          >
            Todos <Zap className="w-4 h-4" />
          </button>
          {EMERGENCIES.map(cat => (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={cn(
                "w-full flex items-center justify-between px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all",
                selectedCategory === cat.category ? "bg-rose text-white shadow-lg shadow-rose/20" : "bg-white text-stone hover:bg-ivory border border-divider"
              )}
            >
              {cat.category} {cat.icon}
            </button>
          ))}
          
          <div className="mt-10 p-6 bg-blush/30 rounded-3xl border border-rose/10">
            <div className="flex items-center gap-2 text-rose-dark text-[10px] font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3" /> Dica de Ouro
            </div>
            <p className="text-xs text-ink-light font-light leading-relaxed italic">
              "O cerimonialista é o para-choque do evento. Sua calma dita o ritmo de todos ao redor."
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-10">
          {filteredEmergencies
            .filter(cat => selectedCategory === null || cat.category === selectedCategory)
            .map((cat, idx) => (
            <div key={idx} className="animate-page-in" style={{ animationDelay: `${idx * 100}ms` }}>
              <h3 className="font-display text-2xl text-ink mb-6 flex items-center gap-3">
                <span className="text-rose">{cat.icon}</span>
                {cat.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cat.items.map((item, i) => (
                  <div key={i} className="bg-white border border-divider rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-display text-xl text-ink group-hover:text-rose transition-colors">{item.title}</h4>
                      <AlertTriangle className="w-5 h-5 text-rose/30 group-hover:text-rose transition-colors" />
                    </div>
                    <p className="text-stone text-sm font-light leading-relaxed">
                      {item.solution}
                    </p>
                    <div className="mt-6 pt-6 border-t border-divider flex justify-end">
                      <div className="text-[10px] font-bold text-stone/30 uppercase tracking-widest flex items-center gap-1">
                        Protocolo Ativo <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {filteredEmergencies.length === 0 && (
            <div className="text-center py-20 bg-white border border-divider rounded-3xl shadow-sm">
              <div className="w-20 h-20 bg-ivory rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-stone w-10 h-10" />
              </div>
              <h3 className="font-display text-2xl text-ink mb-2">Nenhum resultado</h3>
              <p className="text-stone font-light">Tente buscar por outros termos ou categorias.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
