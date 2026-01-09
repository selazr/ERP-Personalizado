import axios from 'axios';

const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const token = localStorage.getItem('token');
  const empresaId = localStorage.getItem('empresaId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (empresaId) {
    config.headers['X-Empresa-Id'] = empresaId;
  }

  return config;
});

export default apiClient;
