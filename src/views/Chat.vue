<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ChatList from '../components/ChatList.vue';
import ChatWindow from '../components/ChatWindow.vue';
import authApi from '../api/auth';

const router = useRouter();

const logout = async() => {
    try{
        await authApi.logout();
    }catch(error){
        console.error(error);
    }finally{
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');

        route.push('/login');
    }
}

const selectedConversation = ref(null);
const selectConversation = (conversation) => {
    selectedConversation.value = conversation;
};
</script>
<template>
    <div class="chat-layout">
        
        <aside class="chat-sidebar">
            <ChatList
                @select="selectConversation"
            />
        </aside>

        <main class="chat-main">
            <ChatWindow v-if="selectedConversation" :conversation="selectedConversation" />

            <div v-else class="empty-chat">
                Select a conversation
            </div>
        </main>

    </div>
</template>