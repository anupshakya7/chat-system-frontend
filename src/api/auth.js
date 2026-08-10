import api from './axios';

export default {
    async register(data) {
        const response = await api.post('/register', data);
        return response.data;
    },

    async login(data) {
        const response = await api.post('/login', data);
        return response.data;
    },

    async me() {
        const response = await api.get('/me');
        return response.data;
    },

    async logout() {
        const response = await api.post('/logout');
        return response.data;
    }

}