import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, Loader2, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  interval: string;
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

  return (
    <div className="animate-page-in max-w-5xl mx-auto py-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-display font-medium text-ink mb-4">Escolha seu Plano</h2>
        <p className="text-stone font-light max-w-2xl mx-auto">
          Potencialize sua gestão de eventos com ferramentas profissionais desenhadas para cerimonialistas de elite.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Free Plan (Implicit) */}
        <PlanCard
          name="Gratuito"
          price="R$ 0"
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

        {prices.map((price) => (
          <PlanCard
            key={price.id}
            name={price.product.name}
            price={`R$ ${(price.unit_amount / 100).toFixed(2)}`}
            interval={price.interval === 'month' ? '/mês' : ''}
            description={price.product.description}
            features={getFeaturesForProduct(price.product.id)}
            isCurrent={currentPlan === price.product.name}
            onAction={() => handleCheckout(price.id)}
            loading={processingId === price.id}
            highlight={price.product.id === 'prod_pro'}
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
  price, 
  interval = '', 
  description, 
  features, 
  isCurrent, 
  onAction, 
  loading, 
  highlight,
  disabled,
  buttonLabel
}: any) {
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
      
      <div className="mb-8">
        <h3 className="font-display text-2xl font-medium text-ink mb-2">{name}</h3>
        <p className="text-stone text-xs font-light h-8">{description}</p>
      </div>

      <div className="mb-8">
        <span className="text-4xl font-display text-ink">{price}</span>
        <span className="text-stone text-sm font-light">{interval}</span>
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
        onClick={onAction}
        disabled={disabled || isCurrent || loading}
        className={cn(
          "w-full py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
          highlight
            ? "bg-rose text-white hover:bg-rose-dark shadow-lg shadow-rose/20"
            : "bg-ivory text-ink border border-divider hover:bg-blush hover:border-blush-mid",
          (disabled || isCurrent || loading) && "opacity-50 cursor-not-allowed"
        )}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isCurrent ? 'Plano Ativo' : (buttonLabel || 'Assinar Agora')}
      </button>
    </div>
  );
}

function getFeaturesForProduct(productId: string) {
  switch (productId) {
    case 'prod_basico':
      return [
        'Até 10 casais ativos',
        'Planner completo',
        'Checklist ilimitado',
        'Gestão de fornecedores',
        'Suporte prioritário'
      ];
    case 'prod_pro':
      return [
        'Casais ilimitados',
        'Gerador de Contratos',
        'Roteiros de Fala editáveis',
        'Gestão de Cortejo',
        'Guia de Imprevistos',
        'Personalização de marca'
      ];
    default:
      return [];
  }
}
