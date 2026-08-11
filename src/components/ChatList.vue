<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import chatApi from '../api/chat'
import authApi from '../api/auth'

const router = useRouter()

const emit = defineEmits(['select'])

const conversations = ref([])
const loading = ref(false)
const loggingOut = ref(false)
const showUsers = ref(false)
const users = ref([])
const userSearch = ref('')
const usersLoading = ref(false)

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
    const response = await chatApi.getUsers(userSearch.value)
    users.value = response.users || [];
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
    console.log(response.data);
    conversations.value = response.data
  } catch (error) {
    console.error('Failed to load conversations', error)
  } finally {
    loading.value = false
  }
}

const startChat = async user => {
  try {
    const response = await chatApi.createConversation(user.id)
    const conversation = response.conversation
    showUsers.value = false

    const exists = conversations.value.some(item => item.id === conversation.id);
    if (!exists) {
      conversations.value.unshift(conversation)
    }
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

    router.push('/login')
  }
}

onMounted(() => {
  loadConversations()
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
        {{ conversation.users?.[0]?.name?.charAt(0)?.toUpperCase() || '?' }}
      </div>

      <div class="conversation-info">
        <strong>
          {{ conversation.users?.[0]?.name || 'Unknown' }}
        </strong>
        <p>
          {{ conversation.latest_message?.message || 'No Messages' }}
        </p>
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
            {{ user.name?.charAt(0)?.toUpperCase() }}
          </div>

          <div class="user-info">
            <strong>
              {{ user.name }}
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
