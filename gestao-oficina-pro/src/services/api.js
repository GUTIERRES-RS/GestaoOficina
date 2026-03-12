import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    timeout: 10000,
});

// Interceptor para tratar erros globais
api.interceptors.response.use(
    (response) => {
        // Se a requisição for POST/PUT/DELETE e for sucessosa, podemos mostrar um toast genérico se preferir
        // Mas geralmente é melhor deixar o componente decidir sobre o sucesso.
        return response;
    },
    (error) => {
        const message = error.response?.data?.message || 'Erro ao processar requisição';

        // Trata erros comuns
        if (error.code === 'ECONNABORTED') {
            toast.error('O servidor demorou muito para responder.');
        } else if (!error.response) {
            toast.error('Não foi possível conectar ao servidor. Verifique sua conexão.');
        } else {
            // Mostra o erro vindo da API
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default api;
