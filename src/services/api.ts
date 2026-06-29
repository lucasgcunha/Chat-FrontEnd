import type { LoginResponse, MensagemResponse, RegisterResponse, Room } from '../types';

const BASE_URL = 'http://localhost:8080';

let authToken: string | null = null;

export function setToken(token: string): void {
  authToken = token;
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers, ...options });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const api = {
  cadastrarUsuario: (nickname: string, senha: string): Promise<RegisterResponse> =>
    request<RegisterResponse>('/usuarios', {
      method: 'POST',
      body: JSON.stringify({ nickname, senha }),
    }),

  loginUsuario: (nickname: string, senha: string): Promise<LoginResponse> =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nickname, senha }),
    }),

  listarUsuarios: () => request('/usuarios'),

  buscarUsuario: (id: number) => request(`/usuarios/${id}`),

  atualizarUsuario: (user: unknown) =>
    request('/usuarios', { method: 'PUT', body: JSON.stringify(user) }),

  deletarUsuario: (id: number) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  listarSalas: (): Promise<Room[]> => request<Room[]>('/salas'),

  buscarSala: (id: string): Promise<Room> => request<Room>(`/salas/${id}`),

  buscarSalasPorDono: (ownerId: number): Promise<Room[]> =>
    request<Room[]>(`/salas/owner/${ownerId}`),

  criarSalaPublica: (ownerId: number): Promise<Room> =>
    request<Room>(`/salas/publica/${ownerId}`, { method: 'POST' }),

  criarSalaPrivada: (ownerId: number, password: string): Promise<Room> =>
    request<Room>(`/salas/privada/${ownerId}?password=${encodeURIComponent(password)}`, {
      method: 'POST',
    }),

  adicionarUsuarioNaSala: (roomId: string, userId: number, password = ''): Promise<Room> =>
    request<Room>(
      `/salas/${roomId}/usuario/${userId}?password=${encodeURIComponent(password)}`,
      { method: 'PUT' }
    ),

  removerUsuarioDaSala: (roomId: string, userId: number): Promise<Room> =>
    request<Room>(`/salas/${roomId}/usuario/${userId}`, { method: 'DELETE' }),

  listarMensagensDaSala: (roomId: string): Promise<MensagemResponse[]> =>
    request<MensagemResponse[]>(`/mensagens/sala/${roomId}`),

  deletarSala: (id: string) => request(`/salas/${id}`, { method: 'DELETE' }),
};