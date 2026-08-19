<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import ChatList from '../../components/JWT/ChatList.vue';
import ChatWindow from '../../components/JWT/ChatWindow.vue';
import authApi from '../../api/auth';
import { usePresence } from '../../composables/usePresence.js';

const router = useRouter();
const selectedConversation = ref(null);

const { initializePresence, leavePresence } = usePresence();

const selectConversation = (conversation) => {
    selectedConversation.value = conversation;
};

onMounted(() => {
    console.log('Chat page mounted');
    console.log('Calling initializePresence...');
    initializePresence();
    console.log('initializePresence called')
});

onBeforeUnmount(() => {
    console.log('Chat page unmounted');
    leavePresence();
});

const logout = async() => {
    try{
        await authApi.logout();
    }catch(error){
        console.error(error);
    }finally{
        leavePresence();

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');

        router.push('/login');
    }
}

</script>
<template>
    <div class="chat-layout">
        
        <aside class="chat-sidebar">
            <ChatList
                :active-conversation-id="selectedConversation?.id"
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