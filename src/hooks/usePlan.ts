import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type PlanType = 'free' | 'Básico' | 'Pro';

interface PlanDetails {
  type: PlanType;
  label: string;
  maxCouples: number;
  hasContracts: boolean;
  hasRoteiros: boolean;
  hasCortege: boolean;
  isPro: boolean;
  isBasico: boolean;
  isFree: boolean;
}

export function usePlan() {
  const [plan, setPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPlan('free');
        return;
      }

      const { data: planName } = await supabase.rpc('get_user_plan', { user_uuid: user.id });
      
      // Normalização do nome do plano vindo do banco/Stripe
      if (planName?.includes('Pro')) setPlan('Pro');
      else if (planName?.includes('Básico') || planName?.includes('Basico')) setPlan('Básico');
      else setPlan('free');
      
    } catch (error) {
      console.error('Error fetching plan:', error);
      setPlan('free');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();

    // Escutar mudanças na tabela de assinaturas se necessário
    const subscription = supabase
      .channel('subscription_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
        fetchPlan();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const details: PlanDetails = {
    type: plan,
    label: plan === 'free' ? 'Gratuito' : plan,
    maxCouples: plan === 'Pro' ? Infinity : plan === 'Básico' ? 10 : 3,
    hasContracts: plan === 'Pro',
    hasRoteiros: plan === 'Pro',
    hasCortege: plan === 'Pro',
    isPro: plan === 'Pro',
    isBasico: plan === 'Básico',
    isFree: plan === 'free'
  };

  return { plan: details, loading, refreshPlan: fetchPlan };
}
