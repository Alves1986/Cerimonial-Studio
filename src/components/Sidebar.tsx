import React from 'react';
import { Heart, LayoutDashboard, Users, ClipboardList, CheckSquare, FileText, MessageSquare, AlertTriangle, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({ activePage, setActivePage, isOpen, setIsOpen }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, group: 'Principal' },
    { id: 'casais', label: 'Meus Casais', icon: Users, group: 'Principal' },
    { id: 'planner', label: 'Planner do Evento', icon: ClipboardList, group: 'Ferramentas' },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, group: 'Ferramentas' },
    { id: 'contrato', label: 'Gerar Contrato', icon: FileText, group: 'Ferramentas' },
    { id: 'roteiros', label: 'Roteiros de Fala', icon: MessageSquare, group: 'Referência' },
    { id: 'emergencias', label: 'Guia de Imprevistos', icon: AlertTriangle, group: 'Referência' },
    { id: 'perfil', label: 'Perfil', icon: User, group: 'Configurações' },
  ];

  const groups = Array.from(new Set(navItems.map(item => item.group)));

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
        <p className="text-[10px] font-light text-stone tracking-[0.15em] uppercase mt-1">Gestão Profissional</p>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto">
        {groups.map(group => (
          <div key={group}>
            <div className="px-8 py-4 text-[10px] font-bold text-blush-mid tracking-[0.14em] uppercase">
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
                  "w-full flex items-center gap-3 px-8 py-3 text-sm transition-all border-l-2",
                  activePage === item.id
                    ? "text-rose-dark font-bold border-rose bg-blush"
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

      <div className="p-6 border-t border-divider">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm text-stone hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair do Sistema
        </button>
        <div className="mt-4 text-[10px] font-light text-stone tracking-wider">
          <strong>Telêmaco Borba</strong> — Paraná
        </div>
      </div>
    </aside>
  );
}
