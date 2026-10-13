import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
  const { adminLogin } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = adminLogin(password);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface-warm flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md p-8 rounded-md border border-borderSoft shadow-notion-modal space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-sm bg-ink text-white flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-ink tracking-tight">
            Acesso Restrito
          </h2>
          <p className="text-xs text-ink-muted">
            Painel Administrativo da GlobalDOCS. Digite sua credencial de segurança para acessar o sistema.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Senha de Administrador
            </label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Digite a senha..."
              className="w-full px-3.5 py-2 text-sm bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary transition-all"
            />
            {error && (
              <p className="text-xs text-accent-red mt-1.5">
                Senha incorreta. Tente novamente.
              </p>
            )}
            <p className="text-[11px] text-ink-faint mt-1.5">
              * Senha padrão inicial do sistema: <code className="bg-surface-warm px-1 py-0.5 rounded font-mono font-bold text-ink">admin</code>
            </p>
          </div>

          <button
            type="submit"
            className="w-full h-10 rounded-sm bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Entrar no Painel</span>
          </button>
        </form>

        {/* Footer Back Link */}
        <div className="pt-4 border-t border-borderSoft text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para a Loja Pública</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
