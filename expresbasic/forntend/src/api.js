import axios from 'axios';
import { decryptData, encryptData } from './utils/crypto';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Add interceptor to attach token and encrypt data
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Don't encrypt if it's a login/register request or a file upload (FormData)
    const excludePaths = ['/users/login', '/users/register', '/login', '/register', '/auth'];
    const isExcluded = excludePaths.some(path => config.url && config.url.includes(path));
    const isFormData = config.data instanceof FormData;

    // Encrypt only if it's a regular JSON request and not excluded
    if (config.data && ['post', 'put', 'patch'].includes(config.method) && !isExcluded && !isFormData) {
      config.data = {
        data: encryptData(config.data)
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor untuk dekripsi otomatis
api.interceptors.response.use(
  (response) => {
    // Jika ada field 'data' dalam response body
    if (response.data && response.data.data) {
      let data = response.data.data;
      
      // Jika data terenkripsi (string), dekripsi secara otomatis
      if (typeof data === 'string') {
        const decrypted = decryptData(data);
        if (decrypted) {
          response.data.data = decrypted;
        }
      }
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default api;
