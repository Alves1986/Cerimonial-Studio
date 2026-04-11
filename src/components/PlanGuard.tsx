import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { usePlan } from '../hooks/usePlan';

interface PlanGuardProps {
  children: React.ReactNode;
  requirePro?: boolean;
  requireBasico?: boolean;
  onUpgrade: () => void;
}

export function PlanGuard({ children, requirePro, requireBasico, onUpgrade }: PlanGuardProps) {
  const { plan, loading } = usePlan();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-rose/20 border-t-rose rounded-full animate-spin" />
      </div>
    );
  }

  const isProAuthorized = requirePro ? plan.isPro : true;
  const isBasicoAuthorized = requireBasico ? (plan.isBasico || plan.isPro) : true;

  if (!isProAuthorized || !isBasicoAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-divider rounded-3xl shadow-sm animate-page-in px-8 text-center">
        <div className="w-24 h-24 bg-blush rounded-full flex items-center justify-center mb-8 relative">
          <Lock className="text-rose w-10 h-10" />
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-divider">
            <Sparkles className="w-4 h-4 text-rose" />
          </div>
        </div>
        
        <h3 className="font-display text-3xl text-ink mb-4">Funcionalidade Exclusiva</h3>
        
        <p className="text-stone font-light max-w-md mb-10 leading-relaxed">
          O recurso que você está tentando acessar está disponível apenas para assinantes do 
          <strong className="text-rose-dark"> {requirePro ? 'Plano Pro' : 'Plano Básico'}</strong>. 
          Eleve o nível do seu cerimonial hoje mesmo!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button
            onClick={onUpgrade}
            className="flex-1 bg-rose hover:bg-rose-dark text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-rose/20 uppercase text-xs tracking-widest"
          >
            Ver Planos & Upgrade
          </button>
        </div>
        
        <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-stone/40 uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          Gestão Profissional de Elite
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
