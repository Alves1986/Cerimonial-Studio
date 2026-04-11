import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, Loader2, ShieldCheck, Sparkles, Zap, Crown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  product: {
    id: string;
    name: string;
    description: string;
  };
}

export default function Pricing() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: plan } = await supabase.rpc('get_user_plan', { user_uuid: user.id });
        setCurrentPlan(plan || 'free');
      }

      const { data: pricesData, error } = await supabase
        .from('prices')
        .select('*, product:products(*)')
        .eq('active', true)
        .order('unit_amount');

      if (error) throw error;
      setPrices(pricesData || []);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      showToast('Erro ao carregar planos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    setProcessingId(priceId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Por favor, faça login para assinar.', 'info');
        return;
      }

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          email: user.email
        })
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);
      
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      showToast(error.message || 'Erro ao iniciar checkout.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-rose" />
      </div>
    );
  }

  const productsMap = new Map<string, { product: any, prices: Price[] }>();
  
  prices.forEach(p => {
    const normalizedName = p.product.name.includes('Pro') 
      ? 'Plano Pro' 
      : p.product.name.includes('Básico') || p.product.name.includes('Basico') 
        ? 'Plano Básico' 
        : p.product.name;
    
    if (!productsMap.has(normalizedName)) {
      productsMap.set(normalizedName, { 
        product: { ...p.product, name: normalizedName }, 
        prices: [] 
      });
    }
    productsMap.get(normalizedName)!.prices.push(p);
  });

  const groupedProducts = Array.from(productsMap.values()).sort((a, b) => {
    if (a.product.name.includes('Pro')) return 1;
    return -1;
  });

  return (
    <div className="animate-page-in max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-blush px-4 py-2 rounded-full text-rose-dark text-[10px] font-bold uppercase tracking-widest mb-6">
          <Sparkles className="w-3 h-3" /> Escolha sua Jornada
        </div>
        <h2 className="text-5xl font-display font-medium text-ink mb-6">Planos & Assinaturas</h2>
        <p className="text-stone font-light max-w-2xl mx-auto text-lg leading-relaxed">
          Potencialize sua gestão de eventos com ferramentas profissionais desenhadas para cerimonialistas que buscam a excelência.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        <PlanCard
          name="Gratuito"
          icon={<Zap className="w-6 h-6" />}
          prices={[{ id: 'free', unit_amount: 0, interval: 'month', interval_count: 1 } as any]}
          description="Ideal para quem está iniciando no mercado."
          features={[
            'Até 3 casais ativos',
            'Checklist básico de tarefas',
            'Planner de evento essencial',
            'Suporte via comunidade'
          ]}
          isCurrent={currentPlan === 'free'}
          onAction={() => {}}
          disabled={true}
          buttonLabel="Plano Atual"
        />

        {groupedProducts.map(({ product, prices }) => (
          <PlanCard
            key={product.name}
            name={product.name}
            icon={product.name.includes('Pro') ? <Crown className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            prices={prices}
            description={product.description || 'Acesso completo às ferramentas profissionais.'}
            features={getFeaturesForProduct(product.name)}
            isCurrent={currentPlan?.includes(product.name.replace('Plano ', ''))}
            onAction={handleCheckout}
            loadingId={processingId}
            highlight={product.name.includes('Pro')}
          />
        ))}
      </div>

      <div className="mt-20 bg-white border border-divider rounded-3xl p-10 shadow-sm flex flex-col md:flex-row items-center gap-10 max-w-4xl mx-auto">
        <div className="w-20 h-20 bg-blush rounded-2xl flex items-center justify-center text-rose flex-shrink-0 rotate-3">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <div>
          <h4 className="font-display text-2xl font-medium text-ink mb-3">Pagamento Seguro & Flexibilidade</h4>
          <p className="text-stone text-sm font-light leading-relaxed">
            Processamos todos os pagamentos via <strong>Stripe</strong> com criptografia de nível bancário. 
            Cancele ou altere seu plano a qualquer momento diretamente pelo seu painel. 
            Sem contratos de fidelidade ou taxas ocultas.
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ 
  name, 
  icon,
  prices, 
  description, 
  features, 
  isCurrent, 
  onAction, 
  loadingId, 
  highlight,
  disabled,
  buttonLabel
}: any) {
  const [selectedPrice, setSelectedPrice] = useState(prices[0]);
  const isLoading = loadingId === selectedPrice?.id;

  const getIntervalText = (interval: string, count: number) => {
    if (interval === 'month' && count === 6) return 'semestre';
    if (interval === 'month') return count > 1 ? `${count} meses` : 'mês';
    if (interval === 'year') return count > 1 ? `${count} anos` : 'ano';
    return interval;
  };

  return (
    <div className={cn(
      "relative flex flex-col p-10 rounded-3xl border transition-all duration-500",
      highlight 
        ? "bg-white border-rose shadow-2xl scale-105 z-10" 
        : "bg-white border-divider shadow-sm hover:shadow-xl",
      isCurrent && "border-rose bg-blush/10"
    )}>
      {highlight && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-rose text-white text-[10px] font-bold uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg shadow-rose/30">
          Recomendado
        </div>
      )}
      
      <div className="mb-8">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-6",
          highlight ? "bg-rose text-white" : "bg-ivory text-rose"
        )}>
          {icon}
        </div>
        <h3 className="font-display text-3xl font-medium text-ink mb-3">{name}</h3>
        <p className="text-stone text-sm font-light leading-relaxed min-h-[40px]">{description}</p>
      </div>

      <div className="mb-10">
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-bold text-stone uppercase tracking-widest">R$</span>
          <span className="text-5xl font-display text-ink">
            {(selectedPrice.unit_amount / 100).toFixed(2).replace('.', ',')}
          </span>
          <span className="text-stone text-sm font-light">
            /{getIntervalText(selectedPrice.interval, selectedPrice.interval_count)}
          </span>
        </div>
      </div>

      <ul className="space-y-5 mb-10 flex-1">
        {features.map((feature: string, i: number) => (
          <li key={i} className="flex items-start gap-3 text-sm text-ink-light font-light">
            <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onAction(selectedPrice.id)}
        disabled={disabled || isCurrent || isLoading}
        className={cn(
          "w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
          highlight
            ? "bg-rose text-white hover:bg-rose-dark shadow-xl shadow-rose/20"
            : "bg-ivory text-ink border border-divider hover:bg-blush hover:border-blush-mid",
          (disabled || isCurrent || isLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isCurrent ? 'Plano Ativo' : (buttonLabel || 'Assinar Agora')}
      </button>
    </div>
  );
}

function getFeaturesForProduct(productName: string) {
  if (productName.includes('Pro')) {
    return [
      'Casais ilimitados',
      'Gerador de Contratos Profissionais',
      'Roteiros de Fala 100% Editáveis',
      'Gestão de Cortejo & Fornecedores',
      'Guia de Imprevistos Completo',
      'Personalização de Marca Branca',
      'Suporte Prioritário 24/7'
    ];
  }
  return [
    'Até 10 casais ativos',
    'Planner de Evento Completo',
    'Checklist de Tarefas Ilimitado',
    'Gestão de Fornecedores Básica',
    'Exportação de Relatórios',
    'Suporte via E-mail'
  ];
}
