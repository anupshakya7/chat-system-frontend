import api from "./axios";

export default {
    async getUsers(){
        const response = await api.get('/student/chat/get-admin-users', {
            params: {
                department: 'superadmin'
            }
        });

        return response.data;
    },

    async getConversations() {
        const response = await api.get('/student/chat/get-conversations');
        return response.data;
    },

    async createConversation(userId) {
        const response = await api.post('/student/chat/store-conversations', {
            participant_id: userId,
            participant_type: 'admin'
        });

        return response.data;
    },

    async getMessages(conversationId, page = 1) {
        const response = await api.get(`/student/chat/conversations/${conversationId}/get-replies`, {
            params: { page }
        });

        return response.data;
    },

    async sendMessage(conversationId, message) {
        const response = await api.post(`/student/chat/conversations/${conversationId}/store-replies`, {
            message
        });

        return response.data;
    },

    async markAsDelivered(conversationId, replyId){
        const response = await api.post(`student/chat/conversations/${conversationId}/replies/${replyId}/mark-delivered`);
        return response.data;
    },

    async markAsRead(conversationId) {
        const response = await api.post(`/student/chat/conversations/${conversationId}/mark-read`);
        return response.data;
    },
    
}