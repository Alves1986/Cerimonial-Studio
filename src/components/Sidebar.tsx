import React from 'react';
import { Heart, LayoutDashboard, Users, ClipboardList, CheckSquare, FileText, MessageSquare, AlertTriangle, LogOut, User, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  userPlan?: string;
}

export default function Sidebar({ activePage, setActivePage, isOpen, setIsOpen, userPlan }: SidebarProps) {
  const { showToast } = useToast();
  
  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, group: 'Principal' },
    { id: 'casais', label: 'Meus Casais', icon: Users, group: 'Principal' },
    { id: 'planner', label: 'Planner do Evento', icon: ClipboardList, group: 'Ferramentas' },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, group: 'Ferramentas' },
    { id: 'contrato', label: 'Gerar Contrato', icon: FileText, group: 'Ferramentas' },
    { id: 'roteiros', label: 'Roteiros de Fala', icon: MessageSquare, group: 'Referência' },
    { id: 'emergencias', label: 'Guia de Imprevistos', icon: AlertTriangle, group: 'Referência' },
    { id: 'perfil', label: 'Perfil', icon: User, group: 'Configurações' },
    { id: 'pricing', label: 'Assinatura', icon: Heart, group: 'Configurações' },
  ];

  const groups = Array.from(new Set(navItems.map(item => item.group)));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-divider flex flex-col z-50 transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="p-8 border-b border-divider hidden md:block">
        <div className="w-10 h-10 bg-blush rounded-full flex items-center justify-center mb-4">
          <span className="font-display italic text-rose-dark text-lg">C</span>
        </div>
        <h1 className="font-display text-lg font-medium text-ink tracking-tight">Cerimonial Studio</h1>
        <p className="text-[10px] font-bold text-stone tracking-[0.2em] uppercase mt-2">Gestão Profissional</p>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto scrollbar-hide">
        {groups.map(group => (
          <div key={group} className="mb-4">
            <div className="px-8 py-2 text-[10px] font-bold text-stone/40 tracking-[0.2em] uppercase">
              {group}
            </div>
            {navItems.filter(item => item.group === group).map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  if (setIsOpen) setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-8 py-3 text-sm transition-all border-l-4",
                  activePage === item.id
                    ? "text-rose-dark font-bold border-rose bg-blush/30"
                    : "text-stone font-normal border-transparent hover:text-ink hover:bg-ivory"
                )}
              >
                <item.icon className={cn("w-4 h-4", activePage === item.id ? "text-rose" : "text-divider")} />
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-divider bg-ivory/50">
        {userPlan && (
          <div className={cn(
            "mb-4 p-4 rounded-xl border transition-all",
            userPlan === 'free' 
              ? "bg-white border-divider" 
              : "bg-rose/5 border-rose/20 shadow-sm"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={cn("w-3 h-3", userPlan === 'free' ? "text-stone" : "text-rose")} />
              <div className="text-[10px] font-bold text-stone uppercase tracking-widest">Plano Atual</div>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider",
                userPlan === 'free' ? "text-ink" : "text-rose-dark"
              )}>
                {userPlan === 'free' ? 'Gratuito' : userPlan}
              </span>
              {userPlan === 'free' && (
                <button 
                  onClick={() => setActivePage('pricing')}
                  className="text-[10px] text-rose hover:text-rose-dark font-bold uppercase tracking-widest underline underline-offset-4"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-2 py-2 text-xs font-bold uppercase tracking-widest text-stone hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
