import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

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

      // Fetch products and prices
      const { data: pricesData, error } = await supabase
        .from('prices')
        .select('*, product:products(*)')
        .eq('active', true)
        .order('unit_amount');

      if (error) throw error;
      setPrices(pricesData || []);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    setProcessingId(priceId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Por favor, faça login para assinar.');
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
      alert('Erro ao iniciar checkout: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-rose" />
      </div>
    );
  }

  // Agrupar preços por produto (normalizando nomes caso o usuário tenha criado produtos separados no Stripe)
  const productsMap = new Map<string, { product: any, prices: Price[] }>();
  
  prices.forEach(p => {
    // Se o nome contém "Pro", agrupamos tudo sob "Plano Pro"
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

  // Ordenar: Básico primeiro, Pro depois
  const groupedProducts = Array.from(productsMap.values()).sort((a, b) => {
    if (a.product.name.includes('Pro')) return 1;
    return -1;
  });

  return (
    <div className="animate-page-in max-w-5xl mx-auto py-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-display font-medium text-ink mb-4">Escolha seu Plano</h2>
        <p className="text-stone font-light max-w-2xl mx-auto">
          Potencialize sua gestão de eventos com ferramentas profissionais desenhadas para cerimonialistas de elite.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center">
        {/* Free Plan (Implicit) */}
        <PlanCard
          name="Gratuito"
          prices={[{ id: 'free', unit_amount: 0, interval: 'month', interval_count: 1 } as any]}
          description="Para quem está começando"
          features={[
            'Até 3 casais',
            'Checklist básico',
            'Planner de evento',
            'Suporte via e-mail'
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
            prices={prices}
            description={product.description || 'Acesso completo às ferramentas'}
            features={getFeaturesForProduct(product.name)}
            isCurrent={currentPlan?.includes(product.name.replace('Plano ', ''))}
            onAction={handleCheckout}
            loadingId={processingId}
            highlight={product.name.includes('Pro')}
          />
        ))}
      </div>

      <div className="mt-16 bg-white border border-divider rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="w-16 h-16 bg-blush rounded-full flex items-center justify-center text-rose flex-shrink-0">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h4 className="font-display text-xl font-medium text-ink mb-2">Pagamento Seguro & Garantia</h4>
          <p className="text-stone text-sm font-light leading-relaxed">
            Processamos todos os pagamentos via Stripe com criptografia de ponta a ponta. 
            Cancele sua assinatura a qualquer momento diretamente pelo painel de controle. 
            Sem taxas ocultas ou contratos de fidelidade.
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ 
  name, 
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

  useEffect(() => {
    if (prices && prices.length > 0) {
      // Try to find the previously selected price ID in the new prices array
      const existingPrice = prices.find((p: any) => p.id === selectedPrice?.id);
      if (!existingPrice) {
        setSelectedPrice(prices[0]);
      }
    }
  }, [prices]);

  if (!selectedPrice) return null;

  const getIntervalText = (interval: string, count: number) => {
    if (interval === 'month' && count === 6) return 'semestre';
    if (interval === 'month') return count > 1 ? `${count} meses` : 'mês';
    if (interval === 'year') return count > 1 ? `${count} anos` : 'ano';
    return interval;
  };

  const getIntervalLabel = (interval: string, count: number) => {
    if (interval === 'month' && count === 6) return 'Semestral';
    if (interval === 'month') return count > 1 ? `A cada ${count} meses` : 'Mensal';
    if (interval === 'year') return count > 1 ? `A cada ${count} anos` : 'Anual';
    return 'Mensal';
  };

  return (
    <div className={cn(
      "relative flex flex-col p-8 rounded-2xl border transition-all duration-300",
      highlight 
        ? "bg-white border-rose shadow-xl scale-105 z-10" 
        : "bg-white border-divider shadow-sm hover:shadow-md",
      isCurrent && "border-rose bg-blush/20"
    )}>
      {highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
          Mais Popular
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-display text-2xl font-medium text-ink mb-2">{name}</h3>
        <p className="text-stone text-xs font-light h-8">{description}</p>
      </div>

      {prices.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {prices.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setSelectedPrice(p)}
              className={cn(
                "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border transition-all",
                selectedPrice.id === p.id 
                  ? "bg-rose text-white border-rose" 
                  : "bg-ivory text-stone border-divider hover:border-rose/50"
              )}
            >
              {getIntervalLabel(p.interval, p.interval_count)}
            </button>
          ))}
        </div>
      )}

      <div className="mb-8">
        <span className="text-4xl font-display text-ink">
          R$ {(selectedPrice.unit_amount / 100).toFixed(2)}
        </span>
        <span className="text-stone text-sm font-light">
          /{getIntervalText(selectedPrice.interval, selectedPrice.interval_count)}
        </span>
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature: string, i: number) => (
          <li key={i} className="flex items-start gap-3 text-sm text-ink-light font-light">
            <Check className="w-4 h-4 text-rose mt-0.5 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onAction(selectedPrice.id)}
        disabled={disabled || isCurrent || isLoading}
        className={cn(
          "w-full py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
          highlight
            ? "bg-rose text-white hover:bg-rose-dark shadow-lg shadow-rose/20"
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
      'Gerador de Contratos',
      'Roteiros de Fala editáveis',
      'Gestão de Cortejo',
      'Guia de Imprevistos',
      'Personalização de marca'
    ];
  }
  return [
    'Até 10 casais ativos',
    'Planner completo',
    'Checklist ilimitado',
    'Gestão de fornecedores',
    'Suporte prioritário'
  ];
}
