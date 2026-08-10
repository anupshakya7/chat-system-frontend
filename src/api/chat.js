import api from "./axios";

export default {
    async getUsers(search = ''){
        const response = await api.get('/chat/users', {
            params: {
                search
            }
        });

        return response.data;
    },

    async getConversations() {
        const response = await api.get('/chat/conversations');
        return response.data;
    },

    async createConversation(userId) {
        const response = await api.post('/chat/conversations', {
            user_id: userId
        });

        return response.data;
    },

    async getMessages(conversationId, page = 1) {
        const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
            params: { page }
        });

        return response.data;
    },

    async sendMessage(conversationId, message) {
        const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
            message
        });

        return response.data;
    },

    async markAsRead(conversationId) {
        const response = await api.post(`/chat/conversations/${conversationId}/read`);
        return response.data;
    },
    
}