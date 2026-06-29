import { useState } from 'react';

type Mode = 'login' | 'register';

interface LoginScreenProps {
  onLogin: (nickname: string, senha: string) => void;
  onRegister: (nickname: string, senha: string) => void;
}

export default function LoginScreen({ onLogin, onRegister }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [nickname, setNickname] = useState('');
  const [senha, setSenha] = useState('');

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!nickname.trim() || !senha.trim()) return;
    if (mode === 'login') {
      onLogin(nickname.trim(), senha.trim());
    } else {
      onRegister(nickname.trim(), senha.trim());
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setNickname('');
    setSenha('');
  }

  return (
    <div className="screen login-screen">
      <div className="card">
        <h1>Chat App</h1>
        <p className="subtitle">
          {mode === 'login' ? 'Identifique-se para entrar' : 'Crie sua conta'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="nickname">Nickname</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Seu nickname..."
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha..."
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
        <p className="switch-mode">
          {mode === 'login' ? (
            <>Não tem conta?{' '}
              <button type="button" className="btn-link" onClick={() => switchMode('register')}>
                Cadastre-se
              </button>
            </>
          ) : (
            <>Já tem conta?{' '}
              <button type="button" className="btn-link" onClick={() => switchMode('login')}>
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}