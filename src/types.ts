export type Role = 'ADMIN' | 'USER' | 'GUEST';

export interface User {
  id: number;
  nickname: string;
  role: Role;
}

export interface Message {
  sender: string;
  role: string;
  text: string;
  timestamp: string;
  system?: boolean;
}

export interface Room {
  id: string;
  ownerId: number;
  historico: string[];
  room_users: number[] | null;
  isPrivate: boolean;
}

export interface LoginResponse {
  token: string;
  idUsuario: number;
  nickname: string;
  role: Role;
}

export interface RegisterResponse {
  valido: boolean;
  duplicado: boolean;
  mensagem: string;
}