import { useState, useEffect, useRef } from 'react';
import { connect, subscribeToRoom, sendMessage, disconnect } from './services/websocket';
import { api } from './services/api';
import './App.css';

const Role = { ADMIN: 'ADMIN', USER: 'USER', GUEST: 'GUEST' };

function createPublicPolicy() {
  return { type: 'PUBLIC', validate: () => true };
}

function createPrivatePolicy(password) {
  return { type: 'PRIVATE', validate: (pwd) => pwd === password };
}

const RoomFactory = {
  createPublicRoom(ownerId) {
    return {
      id: crypto.randomUUID(),
      historico: [],
      ownerId,
      password: null,
      politica: createPublicPolicy(),
    };
  },
  createPrivateRoom(ownerId, password) {
    return {
      id: crypto.randomUUID(),
      historico: [],
      ownerId,
      password,
      politica: createPrivatePolicy(password),
    };
  },
};

function makeInitialRooms() {
  const geral = RoomFactory.createPublicRoom(0);
  geral.name = 'Geral';
  const tech = RoomFactory.createPublicRoom(0);
  tech.name = 'Tecnologia';
  const vip = RoomFactory.createPrivateRoom(0, 'secret123');
  vip.name = 'VIP';
  return [geral, tech, vip];
}

const SCREEN = { LOGIN: 'LOGIN', LOBBY: 'LOBBY', CHAT: 'CHAT' };

export default function App() {
  const [screen, setScreen] = useState(SCREEN.LOGIN);
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState(makeInitialRooms);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const subscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => disconnect(), []);

  async function handleLogin(nickname, role) {
    try {
      const savedUser = await api.cadastrarUsuario({ nickname, role });
      setUser(savedUser);
      setScreen(SCREEN.LOBBY);
    } catch (err) {
      alert(`Erro ao entrar: ${err.message}`);
    }
  }

  function handleCreatePublicRoom() {
    const room = RoomFactory.createPublicRoom(user.id);
    room.name = `Sala Pública #${rooms.length + 1}`;
    setRooms((prev) => [...prev, room]);
  }

  function handleCreatePrivateRoom() {
    const password = prompt('Digite a senha para a sala privada:');
    if (!password) return;
    const room = RoomFactory.createPrivateRoom(user.id, password);
    room.name = `Sala Privada #${rooms.length + 1}`;
    setRooms((prev) => [...prev, room]);
  }

  function handleJoinRoom(room) {
    if (room.politica.type === 'PRIVATE') {
      const pwd = prompt('Esta sala é privada. Digite a senha:');
      if (!room.politica.validate(pwd)) {
        alert('Senha incorreta!');
        return;
      }
    }
    setCurrentRoom(room);
    setMessages(room.historico.map((text) => ({ text, sender: 'Sistema', system: true })));
    setScreen(SCREEN.CHAT);

    connect(
      () => {
        setConnected(true);
        subscriptionRef.current = subscribeToRoom(room.id, (msg) => {
          setMessages((prev) => [...prev, msg]);
        });
      },
      () => setConnected(false)
    );
  }

  function handleLeaveRoom() {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    disconnect();
    setConnected(false);
    setCurrentRoom(null);
    setMessages([]);
    setScreen(SCREEN.LOBBY);
  }

  function handleSendMessage(text) {
    if (!text.trim() || !connected) return;
    sendMessage(currentRoom.id, {
      sender: user.nickname,
      role: user.role,
      text,
      timestamp: new Date().toISOString(),
    });
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
  const [role, setRole] = useState(Role.USER);

  function handleSubmit(e) {
    e.preventDefault();
    if (!nickname.trim()) return;
    onLogin(nickname.trim(), role);
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
            <label htmlFor="role">Perfil</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              {Object.values(Role).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Entrar</button>
        </form>
      </div>
    </div>
  );
}

function LobbyScreen({ user, rooms, onJoinRoom, onCreatePublic, onCreatePrivate }) {
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
        </div>
      </header>
      <div className="room-list">
        {rooms.map((room) => (
          <div key={room.id} className="room-card">
            <div className="room-info">
              <span className="room-name">{room.name}</span>
              <span className={`room-type ${room.politica.type === 'PRIVATE' ? 'private' : 'public'}`}>
                {room.politica.type === 'PRIVATE' ? 'Privada' : 'Pública'}
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
          <h2>{room.name}</h2>
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
