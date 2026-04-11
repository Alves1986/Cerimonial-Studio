import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, Heart } from 'lucide-react';
import { useToast } from './Toast';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { showToast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showToast('Conta criada! Verifique seu e-mail para confirmar o cadastro.', 'success');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('Bem-vindo de volta!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Ocorreu um erro na autenticação.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-divider p-8 animate-page-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blush rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="text-rose w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-medium text-ink">Cerimonial Studio</h1>
          <p className="text-stone text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">Gestão Profissional de Eventos</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone uppercase tracking-widest ml-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-stone uppercase tracking-widest ml-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-ivory border border-divider rounded-xl px-4 py-3 outline-none focus:border-rose focus:ring-4 focus:ring-rose/5 transition-all text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose hover:bg-rose-dark text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-rose/20 uppercase text-xs tracking-widest mt-4"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" /> Criar Minha Conta
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Acessar Sistema
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-stone hover:text-rose-dark text-xs transition-colors font-medium"
          >
            {isSignUp ? 'Já possui uma conta? Entre aqui' : 'Ainda não tem conta? Comece agora gratuitamente'}
          </button>
        </div>
      </div>
    </div>
  );
}
