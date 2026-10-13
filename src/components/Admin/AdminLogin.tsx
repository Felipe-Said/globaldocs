import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
  const { adminLogin } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await adminLogin(email, password);
    setIsLoading(false);
    if (!result.success) setError(result.message);
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
              E-mail
            </label>
            <input
              type="email"
              required
              autoFocus
              autoComplete="username"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="seu@email.com"
              className="w-full px-3.5 py-2 text-sm bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Senha de Administrador
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Digite a senha..."
              className="w-full px-3.5 py-2 text-sm bg-surface-warm border border-borderSoft rounded-sm text-ink focus:bg-white focus:border-primary transition-all"
            />
            {error && (
              <p className="text-xs text-accent-red mt-1.5">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-sm bg-primary hover:bg-primary-pressed text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? 'Autenticando...' : 'Entrar no Painel'}</span>
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
