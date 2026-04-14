import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });

api.interceptors.request.use((config) => {
    try {
        const s = localStorage.getItem('ai_tradex_user');
        if (s) {
            const user = JSON.parse(s);
            if (user && user.userId) {
                config.headers['user-id'] = user.userId;
            }
        }
    } catch(e) {}
    return config;
});

export default api;
