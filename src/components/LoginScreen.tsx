import { useState } from 'react';

interface LoginScreenProps {
  onLogin: (nickname: string, senha: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [nickname, setNickname] = useState('');
  const [senha, setSenha] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !senha.trim()) return;
    onLogin(nickname.trim(), senha.trim());
  }

  return (
    <div className="screen login-screen">
      <div className="card">
        <h1>Chat App</h1>
        <p className="subtitle">Identifique-se para entrar</p>
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
          <button type="submit" className="btn btn-primary">Entrar</button>
        </form>
      </div>
    </div>
  );
}
