import { useState, useEffect, useRef } from 'react';
import { api, setToken } from './services/api';
import './App.css';

const SCREEN = { LOGIN: 'LOGIN', LOBBY: 'LOBBY', CHAT: 'CHAT' };

function roomLabel(room) {
  return `Sala ${room.id.toString().slice(0, 8).toUpperCase()}`;
}

function parseMessage(item) {
  try {
    return JSON.parse(item);
  } catch {
    return { sender: 'Sistema', text: item, system: true, timestamp: new Date().toISOString() };
  }
}

export default function App() {
  const [screen, setScreen] = useState(SCREEN.LOGIN);
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (screen === SCREEN.LOBBY) {
      api.listarSalas().then(setRooms).catch(console.error);
    }
  }, [screen]);

  useEffect(() => {
    if (screen !== SCREEN.CHAT || !currentRoom) return;
    const interval = setInterval(async () => {
      try {
        const updated = await api.buscarSala(currentRoom.id);
        setMessages((updated?.historico ?? []).map(parseMessage));
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [screen, currentRoom?.id]);

  async function handleLogin(nickname, senha) {
    try {
      const loginData = await api.loginUsuario(nickname, senha);
      setToken(loginData.token);
      setUser({ id: loginData.idUsuario, nickname: loginData.nickname, role: loginData.role });
      setScreen(SCREEN.LOBBY);
    } catch (loginErr) {
      if (loginErr.message.includes('Failed to fetch')) {
        alert('Erro: não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        return;
      }
      try {
        await api.cadastrarUsuario(nickname, senha);
        const loginData = await api.loginUsuario(nickname, senha);
        setToken(loginData.token);
        setUser({ id: loginData.idUsuario, nickname: loginData.nickname, role: loginData.role });
        setScreen(SCREEN.LOBBY);
      } catch (err) {
        alert(`Erro ao entrar: ${err.message}`);
      }
    }
  }

  async function handleCreatePublicRoom() {
    try {
      const room = await api.criarSalaPublica(user.id);
      setRooms((prev) => [...prev, room]);
    } catch (err) {
      alert(`Erro ao criar sala: ${err.message}`);
    }
  }

  async function handleCreatePrivateRoom() {
    const password = prompt('Digite a senha para a sala privada:');
    if (!password) return;
    try {
      const room = await api.criarSalaPrivada(user.id, password);
      setRooms((prev) => [...prev, room]);
    } catch (err) {
      alert(`Erro ao criar sala: ${err.message}`);
    }
  }

  async function handleJoinRoom(room) {
    let pwd = '';
    if (room.isPrivate) {
      pwd = prompt('Senha da sala:');
      if (pwd === null) return;
    }
    try {
      await api.adicionarUsuarioNaSala(room.id, user.id, pwd);
      const updatedRoom = await api.buscarSala(room.id);
      setCurrentRoom(updatedRoom ?? room);
      setMessages((updatedRoom?.historico ?? []).map(parseMessage));
      setConnected(true);
      setScreen(SCREEN.CHAT);
    } catch (err) {
      if (room.isPrivate && (err.message.includes('401') || err.message.includes('403'))) {
        alert('Senha incorreta. Tente novamente.');
      } else {
        alert(`Erro ao entrar na sala: ${err.message}`);
      }
    }
  }

  async function handleRefreshRooms() {
    try {
      const updated = await api.listarSalas();
      setRooms(updated);
    } catch (err) {
      alert(`Erro ao atualizar salas: ${err.message}`);
    }
  }

  async function handleLeaveRoom() {
    setConnected(false);
    try {
      await api.removerUsuarioDaSala(currentRoom.id, user.id);
    } catch (err) {
      console.error('Erro ao sair da sala:', err);
    }
    setCurrentRoom(null);
    setMessages([]);
    setScreen(SCREEN.LOBBY);
  }

  async function handleSendMessage(text) {
    if (!text.trim()) return;
    const msg = {
      sender: user.nickname,
      role: user.role,
      text,
      timestamp: new Date().toISOString(),
    };
    try {
      await api.adicionarMensagem(currentRoom.id, JSON.stringify(msg));
      const updated = await api.buscarSala(currentRoom.id);
      setMessages((updated?.historico ?? []).map(parseMessage));
    } catch (err) {
      alert(`Erro ao enviar mensagem: ${err.message}`);
    }
  }

  if (screen === SCREEN.LOGIN) return <LoginScreen onLogin={handleLogin} />;
  if (screen === SCREEN.LOBBY)
    return (
      <LobbyScreen
        user={user}
        rooms={rooms}
        onJoinRoom={handleJoinRoom}
        onCreatePublic={handleCreatePublicRoom}
        onCreatePrivate={handleCreatePrivateRoom}
        onRefresh={handleRefreshRooms}
      />
    );
  return (
    <ChatScreen
      user={user}
      room={currentRoom}
      messages={messages}
      connected={connected}
      onSend={handleSendMessage}
      onLeave={handleLeaveRoom}
      messagesEndRef={messagesEndRef}
    />
  );
}

function LoginScreen({ onLogin }) {
  const [nickname, setNickname] = useState('');
  const [senha, setSenha] = useState('');

  function handleSubmit(e) {
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

function LobbyScreen({ user, rooms, onJoinRoom, onCreatePublic, onCreatePrivate, onRefresh }) {
  return (
    <div className="screen lobby-screen">
      <header className="lobby-header">
        <div className="lobby-header-text">
          <h1>Lobby</h1>
          <p className="subtitle">
            Bem-vindo, <strong>{user.nickname}</strong>{' '}
            <span className="badge">{user.role}</span>
          </p>
        </div>
        <div className="lobby-actions">
          <button className="btn btn-primary" onClick={onCreatePublic}>+ Sala Pública</button>
          <button className="btn btn-secondary" onClick={onCreatePrivate}>+ Sala Privada</button>
          <button className="btn btn-secondary" onClick={onRefresh}>↻ Atualizar</button>
        </div>
      </header>
      <div className="room-list">
        {rooms.map((room) => (
          <div key={room.id} className="room-card">
            <div className="room-info">
              <span className="room-name">{roomLabel(room)}</span>
              <span className={`room-type ${room.isPrivate ? 'private' : 'public'}`}>
                {room.isPrivate ? 'Privada' : 'Pública'}
              </span>
              <span className="room-members">
                {room.room_users?.length ?? 0}{' '}
                {room.room_users?.length === 1 ? 'membro' : 'membros'}
              </span>
            </div>
            <button className="btn btn-sm" onClick={() => onJoinRoom(room)}>Entrar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatScreen({ user, room, messages, connected, onSend, onLeave, messagesEndRef }) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSend(text);
    setText('');
  }

  return (
    <div className="screen chat-screen">
      <header className="chat-header">
        <button className="btn btn-sm" onClick={onLeave}>← Voltar</button>
        <div className="chat-header-info">
          <h2>{roomLabel(room)}</h2>
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? 'Conectado' : 'Conectando...'}
          </span>
        </div>
        <span className="badge">{user.role}</span>
      </header>
      <div className="messages">
        {messages.length === 0 && (
          <p className="empty-msg">Nenhuma mensagem ainda. Seja o primeiro!</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.system ? 'system' : msg.sender === user.nickname ? 'own' : 'other'}`}
          >
            {!msg.system && <span className="sender">{msg.sender}</span>}
            <span className="bubble">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="message-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={connected ? 'Digite uma mensagem...' : 'Aguardando conexão...'}
          disabled={!connected}
        />
        <button type="submit" className="btn btn-primary" disabled={!connected || !text.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
