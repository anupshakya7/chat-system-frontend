<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

import chatApi from '../../api/jwt-chat.js'
import authApi from '../../api/auth'
import echo from '../../services/echo';

const router = useRouter()

const emit = defineEmits(['select'])

const conversations = ref([])
const loading = ref(false)
const loggingOut = ref(false)
const showUsers = ref(false)
const users = ref([])
const userSearch = ref('')
const usersLoading = ref(false)

const subscriptions = new Map();

const getCurrentUser = () => {
  const storedUser = localStorage.getItem('user');
  
  if(!storedUser){
    return null;
  }

  try{
    return JSON.parse(storedUser);
  }catch(error){
    console.error('Invalid user data: ', error);
    return null;
  }
}
const currentUser = getCurrentUser();

const loadUsers = async () => {
  usersLoading.value = true

  try {
    const response = await chatApi.getUsers()
    users.value = response.data || [];
  } catch (error) {
    console.error('Failed to load users', error)
  } finally {
    usersLoading.value = false
  }
}

const loadConversations = async () => {
  loading.value = true

  try {
    const response = await chatApi.getConversations()
    conversations.value = response.data

    subscribeToAllConversations();
  } catch (error) {
    console.error('Failed to load conversations', error)
  } finally {
    loading.value = false
  }
}

const subscribeToAllConversations = () => {
  if(!conversations.value.length) return;

  conversations.value.forEach(conversation => {
    subscribeToConversation(conversation.id)
  });
}

const subscribeToConversation = (conversationId) => {
  if(subscriptions.has(conversationId)) return;

  console.log(`Subscribing to conversation ${conversationId} for chat list`);
  const channel = echo.private(`conversation.${conversationId}`);
  channel.listen('.MessageSent', (event) => {
      console.log(`New message in conversation ${conversationId}:`, event);
      updateConversationLastMessage(conversationId, event.message || event);
  });
  subscriptions.set(conversationId, channel);
}

const updateConversationLastMessage = (conversationId, message) => {
  const index = conversations.value.findIndex(c => c.id === conversationId);

  if(index === -1) return;

  const updatedConversation = {
    ...conversations.value[index],
    last_message: message,
    updated_at: message.created_at || new Date().toISOString()
  }

  conversations.value.splice(index, 1);
  conversations.value.unshift(updatedConversation);
}

const unsubscribeFromAllConversations = () => {
  for(const [conversationId, channel] of subscriptions){
    echo.leave(`conversation.${conversationId}`);
    subscriptions.delete(conversationId);
  }
}

const startChat = async user => {
  try {
    const response = await chatApi.createConversation(user.id)

    const conversation = response.conversation
    console.log('conversation: ',conversation);
    showUsers.value = false

    const exists = conversations.value.some(item => item.id === conversation.id);
    if (!exists) {
      conversations.value.unshift(conversation)
      subscribeToConversation(conversation.id)
    }
    console.log('New Conversation: ',conversations.value);
    emit('select', conversation)
  } catch (error) {
    console.error('Failed to create conversation', error)
  }
}

const selectConversation = conversation => {
  emit('select', conversation)
}

const logout = async () => {
  loggingOut.value = true

  try {
    await authApi.logout()
  } catch (error) {
    console.error('Logout failed', error)
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    unsubscribeFromAllConversations()

    router.push('/login')
  }
}

onMounted(() => {
  loadConversations()
})

onBeforeUnmount(() => {
  unsubscribeFromAllConversations()
})
</script>
<template>
  <div class="chat-list">
    <div class="chat-list-header">
      <div class="chat-title">
        <h3>Messages</h3>
        <span>{{ conversations.length }}</span>
      </div>
      <div class="chat-actions">
        <button class="new-chat-button" type="button" @click="showUsers = true">
          +
        </button>
        <button
          class="logout-button"
          type="button"
          :disabled="loggingOut"
          @click="logout"
        >
          <span v-if="!loggingOut"> Logout </span>
          <span v-else> Logging out... </span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading Conversations...</div>

    <div v-else-if="conversations.length === 0" class="empty-conversations">
      <div class="empty-icon">💬</div>
      <p>No conversations yet</p>
    </div>

    <div
      v-for="conversation in conversations"
      :key="conversation.id"
      class="conversation"
      @click="selectConversation(conversation)"
    >
      <div class="avatar">
        {{ conversation.display_name?.charAt(0)?.toUpperCase() || '?' }}
      </div>

      <div class="conversation-info">
        <strong>
          {{ conversation.display_name || 'Unknown' }}
        </strong>
        <p>
          {{ conversation.last_message?.text || 'No Messages' }}
        </p>
        <small v-if="conversation.last_message" class="message-time">
          {{ new Date(conversation.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
        </small>
      </div>
    </div>
  </div>
  <div
    v-if="showUsers"
    class="user-modal-overlay"
    @click.self="showUsers = false"
  >
    <div class="user-modal">
      <div class="user-modal-header">
        <h3>New Chat</h3>

        <button type="button" @click="showUsers = false">×</button>
      </div>

      <div class="user-search">
        <input
          v-model="userSearch"
          type="text"
          placeholder="Search users..."
          @input="loadUsers"
        />
      </div>

      <div class="users-list">
        <div v-if="usersLoading" class="loading">Loading users...</div>
        
        <div v-else-if="users.length === 0" class="no-users">
          No users found.
        </div>

        <div
          v-for="user in users"
          :key="user.id"
          class="user-item"
          @click="startChat(user)"
        >
          <div class="avatar">
            {{ user.fullname?.charAt(0)?.toUpperCase() }}
          </div>

          <div class="user-info">
            <strong>
              {{ user.fullname }}
            </strong>

            <span>
              {{ user.email }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
