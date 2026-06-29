import { useState } from 'react';
import type { User, Room, Message } from '../types';
import { roomLabel } from '../utils';

interface ChatScreenProps {
  user: User;
  room: Room;
  messages: Message[];
  connected: boolean;
  onSend: (text: string) => void;
  onLeave: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatScreen({
  user,
  room,
  messages,
  connected,
  onSend,
  onLeave,
  messagesEndRef,
}: ChatScreenProps) {
  const [text, setText] = useState('');

  function handleSubmit(e: React.SyntheticEvent) {
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
