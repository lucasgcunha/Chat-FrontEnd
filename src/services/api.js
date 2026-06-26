const BASE_URL = 'http://localhost:8080';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  cadastrarUsuario: (user) =>
    request('/usuarios', { method: 'POST', body: JSON.stringify(user) }),

  listarUsuarios: () => request('/usuarios'),

  buscarUsuario: (id) => request(`/usuarios/${id}`),

  atualizarUsuario: (user) =>
    request('/usuarios', { method: 'PUT', body: JSON.stringify(user) }),

  deletarUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  listarSalas: () => request('/salas'),

  buscarSala: (id) => request(`/salas/${id}`),

  buscarSalasPorDono: (ownerId) => request(`/salas/owner/${ownerId}`),

  criarSalaPublica: (ownerId) =>
    request(`/salas/publica/${ownerId}`, { method: 'POST' }),

  criarSalaPrivada: (ownerId, password) =>
    request(`/salas/privada/${ownerId}?password=${encodeURIComponent(password)}`, {
      method: 'POST',
    }),

  adicionarUsuarioNaSala: (roomId, userId) =>
    request(`/salas/${roomId}/usuario/${userId}`, { method: 'PUT' }),

  removerUsuarioDaSala: (roomId, userId) =>
    request(`/salas/${roomId}/usuario/${userId}`, { method: 'DELETE' }),

  adicionarMensagem: (roomId, mensagem) =>
    request(`/salas/${roomId}/mensagem`, {
      method: 'PUT',
      body: JSON.stringify(mensagem),
    }),

  deletarSala: (id) => request(`/salas/${id}`, { method: 'DELETE' }),
};
