import { Client, type StompSubscription } from '@stomp/stompjs';
import type { MensagemResponse } from '../types';

let client: Client | null = null;
let wsToken: string | null = null;

export function setToken(token: string): void {
  wsToken = token;
}

export function connect(onConnected: () => void, onDisconnected: () => void): void {
  client = new Client({
    brokerURL: `ws://localhost:8080/ws?token=${wsToken}`,
    reconnectDelay: 5000,
    onConnect: onConnected,
    onDisconnect: onDisconnected,
  });
  client.activate();
}

export function subscribeToRoom(
  roomId: string,
  onMessage: (msg: MensagemResponse) => void
): StompSubscription | null {
  if (!client || !client.connected) return null;
  return client.subscribe(`/topic/salas/${roomId}`, (frame) => {
    onMessage(JSON.parse(frame.body) as MensagemResponse);
  });
}

export function sendMessage(roomId: string, conteudo: string): void {
  if (!client || !client.connected) return;
  client.publish({
    destination: '/app/mensagem',
    body: JSON.stringify({ salaId: roomId, conteudo }),
  });
}

export function disconnect(): void {
  if (client) {
    client.deactivate();
    client = null;
  }
}
