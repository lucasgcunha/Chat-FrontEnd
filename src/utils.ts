import type { Room, Message } from './types';

export function roomLabel(room: Room): string {
  return `Sala ${room.id.toString().slice(0, 8).toUpperCase()}`;
}

export function parseMessage(item: string): Message {
  try {
    return JSON.parse(item) as Message;
  } catch {
    return { sender: 'Sistema', role: '', text: item, system: true, timestamp: new Date().toISOString() };
  }
}
