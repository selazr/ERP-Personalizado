import axios from 'axios';

const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const token = localStorage.getItem('token');
  const empresaId = localStorage.getItem('empresaId');
  const autonomoId = localStorage.getItem('autonomoId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (empresaId) {
    config.headers['X-Empresa-Id'] = empresaId;
  }

  if (autonomoId) {
    config.headers['X-Autonomo-Id'] = autonomoId;
  }

  return config;
});

export default apiClient;
