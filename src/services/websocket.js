import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let client = null;

export function connect(onConnected, onDisconnected) {
  client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws-chat'),
    reconnectDelay: 5000,
    onConnect: onConnected,
    onDisconnect: onDisconnected,
  });
  client.activate();
  return client;
}

export function subscribeToRoom(roomId, onMessage) {
  if (!client || !client.connected) return null;
  return client.subscribe(`/topic/room.${roomId}`, (frame) => {
    onMessage(JSON.parse(frame.body));
  });
}

export function sendMessage(roomId, payload) {
  if (!client || !client.connected) return;
  client.publish({
    destination: `/app/room.${roomId}`,
    body: JSON.stringify(payload),
  });
}

export function disconnect() {
  if (client) {
    client.deactivate();
    client = null;
  }
}
