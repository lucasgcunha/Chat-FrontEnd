const BASE_URL = 'http://localhost:8080';

let authToken = null;

export function setToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers, ...options });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Retorna { valido, duplicado, mensagem }
  cadastrarUsuario: (nickname, senha) =>
    request('/usuarios', { method: 'POST', body: JSON.stringify({ nickname, senha }) }),

  // Retorna { token, idUsuario, nickname, role }
  loginUsuario: (nickname, senha) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ nickname, senha }) }),

  listarUsuarios: () => request('/usuarios'),

  buscarUsuario: (id) => request(`/usuarios/${id}`),

  atualizarUsuario: (user) =>
    request('/usuarios', { method: 'PUT', body: JSON.stringify(user) }),

  deletarUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  // Retorna List<RoomDto> onde cada item é { id, ownerId, historico, room_users }
  listarSalas: () => request('/salas'),

  buscarSala: (id) => request(`/salas/${id}`),

  buscarSalasPorDono: (ownerId) => request(`/salas/owner/${ownerId}`),

  criarSalaPublica: (ownerId) =>
    request(`/salas/publica/${ownerId}`, { method: 'POST' }),

  criarSalaPrivada: (ownerId, password) =>
    request(`/salas/privada/${ownerId}?password=${encodeURIComponent(password)}`, { method: 'POST' }),

  adicionarUsuarioNaSala: (roomId, userId, password = '') =>
    request(`/salas/${roomId}/usuario/${userId}?password=${encodeURIComponent(password)}`, { method: 'PUT' }),

  removerUsuarioDaSala: (roomId, userId) =>
    request(`/salas/${roomId}/usuario/${userId}`, { method: 'DELETE' }),

  adicionarMensagem: (roomId, mensagem) =>
    request(`/salas/${roomId}/mensagem`, {
      method: 'PUT',
      body: JSON.stringify(mensagem),
    }),

  deletarSala: (id) => request(`/salas/${id}`, { method: 'DELETE' }),
};
