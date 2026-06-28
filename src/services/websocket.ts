import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Message } from '../types';

let client: Client | null = null;

export function connect(onConnected: () => void, onDisconnected: () => void): Client {
  client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws-chat'),
    reconnectDelay: 5000,
    onConnect: onConnected,
    onDisconnect: onDisconnected,
  });
  client.activate();
  return client;
}

export function subscribeToRoom(
  roomId: string,
  onMessage: (msg: Message) => void
): StompSubscription | null {
  if (!client || !client.connected) return null;
  return client.subscribe(`/topic/room.${roomId}`, (frame) => {
    onMessage(JSON.parse(frame.body) as Message);
  });
}

export function sendMessage(roomId: string, payload: Message): void {
  if (!client || !client.connected) return;
  client.publish({
    destination: `/app/room.${roomId}`,
    body: JSON.stringify(payload),
  });
}

export function disconnect(): void {
  if (client) {
    client.deactivate();
    client = null;
  }
}