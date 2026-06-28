import type { Room, Message, MensagemResponse } from './types';

export function roomLabel(room: Room): string {
  return `Sala ${room.id.toString().slice(0, 8).toUpperCase()}`;
}

export function mensagemResponseToMessage(m: MensagemResponse): Message {
  return {
    sender: m.remetenteNome,
    role: m.remetenteRole,
    text: m.conteudo,
    timestamp: m.dataEnvio,
  };
}
