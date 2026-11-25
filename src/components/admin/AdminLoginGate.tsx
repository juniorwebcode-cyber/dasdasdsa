import React, { useState } from 'react';
import { ArrowLeft, Copy, Eye, EyeOff, Lock, LogOut, ShieldCheck } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User
} from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { loginWithCredentials } from '../../services/adminStoreService';

interface AdminLoginGateProps {
  user: User | null;
  authLoading: boolean;
  isAdmin: boolean;
  onCredentialSuccess: (email: string) => void;
  onBackToSite: () => void;
}

export function AdminLoginGate({
  user,
  authLoading,
  isAdmin,
  onCredentialSuccess,
  onBackToSite
}: AdminLoginGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    if (!cleanEmail || !password) {
      setError('Informe seu login e senha para entrar.');
      return;
    }

    setError('');
    setSigningIn(true);
    try {
      const serverResult = await loginWithCredentials(cleanEmail, password);

      let firebaseEmail: string | null = null;
      let firebaseErrorCode = '';
      try {
        const fbCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        firebaseEmail = fbCred.user.email || cleanEmail;
      } catch (fbErr: unknown) {
        firebaseErrorCode =
          typeof fbErr === 'object' && fbErr !== null && 'code' in fbErr
            ? String((fbErr as { code?: unknown }).code)
            : '';

        if (
          !firebaseEmail &&
          cleanPassword &&
          cleanPassword !== password &&
          (firebaseErrorCode === 'auth/wrong-password' ||
            firebaseErrorCode === 'auth/invalid-credential')
        ) {
          try {
            const retryCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
            firebaseEmail = retryCred.user.email || cleanEmail;
          } catch {
            // Keep initial firebaseErrorCode
          }
        }

        if (
          !firebaseEmail &&
          serverResult.ok &&
          (firebaseErrorCode === 'auth/user-not-found' ||
            firebaseErrorCode === 'auth/invalid-credential' ||
            firebaseErrorCode === 'auth/wrong-password')
        ) {
          try {
            const created = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            firebaseEmail = created.user.email || cleanEmail;
          } catch {
            // Segue autenticado via sessão segura do servidor
          }
        }
      }

      if (serverResult.ok || firebaseEmail) {
        onCredentialSuccess(serverResult.email || firebaseEmail || cleanEmail);
        return;
      }

      if (firebaseErrorCode === 'auth/too-many-requests') {
        setError('Muitas tentativas seguidas. Aguarde alguns segundos e tente novamente.');
      } else {
        setError(serverResult.error || 'Login ou senha inválidos.');
      }
    } catch {
      setError('Não foi possível validar o acesso. Tente novamente.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível concluir o login com o Google.'
      );
    } finally {
      setGoogleSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E6E2DA] rounded-2xl px-8 py-6 text-sm text-[#52525B]">
          Verificando sessão administrativa...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-[#E6E2DA] rounded-2xl p-8 space-y-6">
        <button
          type="button"
          onClick={onBackToSite}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao site público</span>
        </button>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1E4D5C]">
            <ShieldCheck className="w-4 h-4" />
            <span>Área Privada · Patrícia Vicente</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-[#18181B]">
            Painel Administrativo & CRM
          </h1>
          <p className="text-sm text-[#52525B] leading-relaxed">
            Acesso exclusivo para gestão de imóveis, empreendimentos, landing page, leads,
            visitas e propostas.
          </p>
        </div>

        {error ? (
          <div className="text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleCredentialLogin} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#52525B]">Login (E-mail)</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@x.com"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] focus:outline-none focus:border-[#1E4D5C]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#52525B]">Senha</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#18181B] focus:outline-none focus:border-[#1E4D5C]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={signingIn || googleSigningIn}
            className="w-full px-5 py-3 text-sm font-semibold text-white bg-[#1E4D5C] rounded-xl hover:bg-[#173c48] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {signingIn ? 'Entrando no painel...' : 'Entrar no Painel'}
          </button>
        </form>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-[#E6E2DA]" />
          <span className="shrink mx-3 text-[11px] text-[#71717A]">ou</span>
          <div className="flex-grow border-t border-[#E6E2DA]" />
        </div>

        <button
          type="button"
          disabled={signingIn || googleSigningIn}
          onClick={handleGoogleLogin}
          className="w-full px-5 py-3 text-xs font-semibold text-[#18181B] bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl hover:bg-[#F3F1EC] disabled:opacity-60 transition-colors cursor-pointer"
        >
          {googleSigningIn ? 'Autenticando com Google...' : 'Entrar com conta Google autorizada'}
        </button>

        {user && !isAdmin ? (
          <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex items-start gap-2 text-[#92400E]">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[#52525B] leading-relaxed">
                Sessão Google conectada: <strong className="text-[#18181B]">{user.email}</strong>{' '}
                (sem permissão Firebase Admin ainda). Use o login acima ou troque a conta Google.
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 bg-white border border-[#E6E2DA] rounded-lg px-2.5 py-1.5">
              <code className="font-mono-tabular text-[11px] text-[#18181B] truncate">
                UID: {user.uid}
              </code>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(user.uid);
                  setCopiedUid(true);
                  setTimeout(() => setCopiedUid(false), 2000);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FAF9F6] border border-[#E6E2DA] rounded text-[11px] text-[#18181B] shrink-0 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedUid ? 'Copiado' : 'Copiar UID'}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1E4D5C] hover:underline cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Desconectar esta conta Firebase</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

