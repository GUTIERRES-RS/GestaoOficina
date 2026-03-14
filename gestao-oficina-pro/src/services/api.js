import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    timeout: 10000,
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('@GestaoOficinaPro:token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para tratar erros globais
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao processar requisição';

        // Trata erros comuns
        if (error.response?.status === 401) {
            // Se não for a rota de login, redireciona
            if (!error.config.url.includes('/auth/login')) {
                localStorage.removeItem('@GestaoOficinaPro:token');
                localStorage.removeItem('@GestaoOficinaPro:user');
                
                // Exibe mensagem de erro e redireciona
                toast.error(message);
                
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
                
                return Promise.reject(error);
            }
        }

        if (error.code === 'ECONNABORTED') {
            toast.error('O servidor demorou muito para responder.');
        } else if (!error.response) {
            // Se não houver resposta, provavelmente é problema de conexão (servidor offline)
            // Dispara um evento customizado que o ConnectionProvider irá escutar
            window.dispatchEvent(new CustomEvent('api-connection-failed'));
        } else {
            // Mostra o erro vindo da API
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default api;
