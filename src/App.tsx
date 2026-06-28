import { useState, useEffect, useRef } from 'react';
import type { StompSubscription } from '@stomp/stompjs';
import { api, setToken as setApiToken } from './services/api';
import {
  setToken as setWsToken,
  connect as wsConnect,
  subscribeToRoom,
  sendMessage as wsSendMessage,
  disconnect as wsDisconnect,
} from './services/websocket';
import type { User, Room, Message } from './types';
import { mensagemResponseToMessage } from './utils';
import LoginScreen from './components/LoginScreen';
import LobbyScreen from './components/LobbyScreen';
import ChatScreen from './components/ChatScreen';
import './App.css';

const SCREEN = { LOGIN: 'LOGIN', LOBBY: 'LOBBY', CHAT: 'CHAT' } as const;
type Screen = (typeof SCREEN)[keyof typeof SCREEN];

export default function App() {
  const [screen, setScreen] = useState<Screen>(SCREEN.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsSubscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (screen === SCREEN.LOBBY) {
      api.listarSalas().then(setRooms).catch(console.error);
    }
  }, [screen]);

  // Limpa a conexão WebSocket ao desmontar o componente
  useEffect(() => {
    return () => {
      wsSubscriptionRef.current?.unsubscribe();
      wsDisconnect();
    };
  }, []);

  async function handleLogin(nickname: string, senha: string) {
    try {
      const loginData = await api.loginUsuario(nickname, senha);
      setApiToken(loginData.token);
      setWsToken(loginData.token);
      setUser({ id: loginData.idUsuario, nickname: loginData.nickname, role: loginData.role });
      setScreen(SCREEN.LOBBY);
    } catch (loginErr) {
      if (loginErr instanceof Error && loginErr.message.includes('Failed to fetch')) {
        alert('Erro: não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        return;
      }
      try {
        await api.cadastrarUsuario(nickname, senha);
        const loginData = await api.loginUsuario(nickname, senha);
        setApiToken(loginData.token);
        setWsToken(loginData.token);
        setUser({ id: loginData.idUsuario, nickname: loginData.nickname, role: loginData.role });
        setScreen(SCREEN.LOBBY);
      } catch (err) {
        alert(`Erro ao entrar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }
  }

  async function handleCreatePublicRoom() {
    if (!user) return;
    try {
      const room = await api.criarSalaPublica(user.id);
      setRooms((prev) => [...prev, room]);
    } catch (err) {
      alert(`Erro ao criar sala: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }

  async function handleCreatePrivateRoom() {
    if (!user) return;
    const password = prompt('Digite a senha para a sala privada:');
    if (!password) return;
    try {
      const room = await api.criarSalaPrivada(user.id, password);
      setRooms((prev) => [...prev, room]);
    } catch (err) {
      alert(`Erro ao criar sala: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }

  async function handleJoinRoom(room: Room) {
    if (!user) return;
    let pwd = '';
    if (room.isPrivate) {
      pwd = prompt('Senha da sala:') ?? '';
      if (pwd === '') return;
    }
    try {
      await api.adicionarUsuarioNaSala(room.id, user.id, pwd);

      const [updatedRoom, history] = await Promise.all([
        api.buscarSala(room.id),
        api.listarMensagensDaSala(room.id),
      ]);

      setCurrentRoom(updatedRoom ?? room);
      setMessages(history.map(mensagemResponseToMessage));
      setScreen(SCREEN.CHAT);

      // Desconecta eventual WebSocket anterior e abre novo
      wsSubscriptionRef.current?.unsubscribe();
      wsDisconnect();

      wsConnect(
        () => {
          setConnected(true);
          wsSubscriptionRef.current = subscribeToRoom(room.id, (msg) => {
            setMessages((prev) => [...prev, mensagemResponseToMessage(msg)]);
          });
        },
        () => setConnected(false),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (room.isPrivate && (msg.includes('401') || msg.includes('403'))) {
        alert('Senha incorreta. Tente novamente.');
      } else {
        alert(`Erro ao entrar na sala: ${msg}`);
      }
    }
  }

  async function handleRefreshRooms() {
    try {
      const updated = await api.listarSalas();
      setRooms(updated);
    } catch (err) {
      alert(`Erro ao atualizar salas: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }

  async function handleLeaveRoom() {
    if (!currentRoom || !user) return;
    wsSubscriptionRef.current?.unsubscribe();
    wsSubscriptionRef.current = null;
    wsDisconnect();
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

  function handleSendMessage(text: string) {
    if (!text.trim() || !currentRoom) return;
    wsSendMessage(currentRoom.id, text);
  }

  if (screen === SCREEN.LOGIN) return <LoginScreen onLogin={handleLogin} />;
  if (screen === SCREEN.LOBBY)
    return (
      <LobbyScreen
        user={user!}
        rooms={rooms}
        onJoinRoom={handleJoinRoom}
        onCreatePublic={handleCreatePublicRoom}
        onCreatePrivate={handleCreatePrivateRoom}
        onRefresh={handleRefreshRooms}
      />
    );
  return (
    <ChatScreen
      user={user!}
      room={currentRoom!}
      messages={messages}
      connected={connected}
      onSend={handleSendMessage}
      onLeave={handleLeaveRoom}
      messagesEndRef={messagesEndRef}
    />
  );
}
