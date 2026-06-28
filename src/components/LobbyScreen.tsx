import type { User, Room } from '../types';
import { roomLabel } from '../utils';

interface LobbyScreenProps {
  user: User;
  rooms: Room[];
  onJoinRoom: (room: Room) => void;
  onCreatePublic: () => void;
  onCreatePrivate: () => void;
  onRefresh: () => void;
}

export default function LobbyScreen({
  user,
  rooms,
  onJoinRoom,
  onCreatePublic,
  onCreatePrivate,
  onRefresh,
}: LobbyScreenProps) {
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
