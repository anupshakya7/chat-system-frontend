<script setup>
import { ref, watch, nextTick, onBeforeUnmount, computed } from 'vue'

import echo from '../../services/echo'
import chatApi from '../../api/jwt-chat'

// --------------------------------------------------
// Props
// --------------------------------------------------

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  }
})
const emit = defineEmits([
  'conversationRead',
  'newMessage'
]);

const messages = ref([])
const loading = ref(false)
const newMessage = ref('')
const messagesContainer = ref(null)


const unreadCount = ref(props.conversation.unread_count || 0);
console.log('unread count: ',unreadCount);

const storedUser = localStorage.getItem('user')
const currentUser = storedUser ? JSON.parse(storedUser) : null
const currentUserId = currentUser?.id

let currentChannel = null
let subscribedConversationId = null

const loadMessages = async () => {
  if (!props.conversation?.id) {
    return
  }

  loading.value = true

  try {
    const response = await chatApi.getMessages(props.conversation.id)
    messages.value = (response.data || []).reverse()

    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to load messages:', error)
  } finally {
    loading.value = false
  }
}

const markConversationAsRead = async () => {
  if (!props.conversation?.id) {
    return
  }
  console.log(unreadCount.value);
  if(unreadCount.value === 0){
    console.log('No unread messages to mar as read');
    return;
  }

  try {
    console.log(`Marking conversation ${props.conversation.id} as read...`);
    const response = await chatApi.markAsRead(props.conversation.id);
    
    unreadCount.value = 0;

    emit('conversationRead', {
        conversationId: props.conversation.id,
        unreadCount: 0
    });
    console.log('Conversation marked as read successfully');
  } catch (error) {
    console.error('Failed to mark conversation as read:', error)
  }
}

const subscribeToConversation = () => {
  if (!props.conversation?.id) {
    return
  }

  const conversationId = props.conversation.id

  console.log('Subscribing to conversation:', conversationId)

  if (subscribedConversationId === conversationId) {
    return
  }

  currentChannel = echo.private(`conversation.${conversationId}`)
  subscribedConversationId = conversationId

  // currentChannel.listen('.MessageSent', event => {
  //   console.log('Realtime message received:', event)

  //   const incomingMessage = event

  //   if (!incomingMessage) {
  //     return
  //   }

  //   const alreadyExists = messages.value.some(
  //     message => message.id === incomingMessage.id
  //   )

  //   if (alreadyExists) {
  //     return
  //   }

  //   messages.value.push(incomingMessage)

  //   // if(incomingMessage.sender?.id !== currentUserId){
  //   //     unreadCount.value += 1;
        
  //   //     emit('newMessage', {
  //   //         conversationId: conversationId,
  //   //         message: incomingMessage,
  //   //         unreadCount: unreadCount.value
  //   //     });
  //   // }

  //   nextTick(() => {
  //     scrollToBottom()
  //   })
  // })

  currentChannel.listen('.MessageSent', async event => {
    console.log(`Realtime message received for ${currentChannel} channel: ${event}`);

    const incomingMessage = event;

    if(!incomingMessage){
      return;
    }

    const alreadyExists = messages.value.some(
      message => message.id === incomingMessage.id
    )

    if(!alreadyExists){
      messages.value.push(incomingMessage);

      await nextTick();
      scrollToBottom();
    }

    if(String(incomingMessage.sender?.id) !== String(currentUserId)){
      try{
        console.log('testing');
        await chatApi.markAsRead(props.conversation.id);
        unreadCount.value = 0;
      }catch(error){
        console.error('Failed to mark message read: ', error);
      }
    }
  });
  
  currentChannel.listen('.MessageDelivered', event => {
    console.log('Message delivered:',event);
    const deliveredMessage = event.message;
    const message = messages.value.find(
      message => message.id === deliveredMessage.id
    );

    if(!message){
      return;
    }

    message.delivered_at = deliveredMessage.delivered_at
  });

  currentChannel.listen('.MessageRead', event => {
    console.log('Message read: ', event);
    const readMessage = event.message;

    const message = messages.value.find(
      message => String(message.id) === String(readMessage.id)
    )

    if(!message){
      return
    }

    message.delivered_at = readMessage.delivered_at;
    message.read_at = readMessage.read_at;
  });

  currentChannel.subscribed(() => {
    console.log(`Successfully subscribed to conversation.${conversationId}`)
  });
}

const unsubscribeFromConversation = () => {
  if (subscribedConversationId === null) {
    return
  }

  console.log('Leaving conversation:', subscribedConversationId)

  echo.leave(`conversation.${subscribedConversationId}`)

  currentChannel = null
  subscribedConversationId = null
}

const sendMessage = async () => {
  const message = newMessage.value.trim()

  if (!message) {
    return
  }

  if (!props.conversation?.id) {
    return
  }

  try {
    newMessage.value = ''

    const response = await chatApi.sendMessage(props.conversation.id, message)

    const sentMessage = response.message

    if (sentMessage) {
      const alreadyExists = messages.value.some(
        item => item.id === sentMessage.id
      )

      if (!alreadyExists) {
        messages.value.push(sentMessage)
      }
    }

    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)

    newMessage.value = message
  }
}

const scrollToBottom = () => {
  if (!messagesContainer.value) {
    return
  }

  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

watch(
  () => props.conversation?.id,

  async (newConversationId, oldConversationId) => {
    if (newConversationId === oldConversationId) {
      console.log('Same conversation Id, skipping')
      return
    }

    unsubscribeFromConversation()
    messages.value = []

    if (!newConversationId) {
      console.log('No conversation selected, exiting...')
      return
    }

    subscribeToConversation()
    await loadMessages()
    await markConversationAsRead()
  },

  {
    immediate: true
  }
)

onBeforeUnmount(() => {
  unsubscribeFromConversation()
})
</script>

<template>
  <div class="chat-window">
    <!-- --------------------------------------- -->
    <!-- Header -->
    <!-- --------------------------------------- -->

    <div class="chat-header">
      <div class="avatar">
        {{ conversation.display_name?.charAt(0)?.toUpperCase() }}
      </div>

      <div>
        <strong>
          {{ conversation.display_name || 'Chat' }}
        </strong>
      </div>
    </div>

    <div ref="messagesContainer" class="messages">
      <div v-if="loading" class="loading">Loading messages...</div>

      <div v-else-if="messages.length === 0" class="no-messages">
        No messages yet. Start the conversation!
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        :class="[
          'message',
          message.sender?.id === currentUserId ? 'message-own' : 'message-other'
        ]"
      >
        <div class="message-bubble">
          <div class="message-user">
            {{ message.sender?.name || 'Unknown' }}
          </div>

          <div class="message-text">
            {{ message.text }}
          </div>

          <small class="message-time">
            {{
              new Date(message.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
            }}
          </small>
        </div>
      </div>
    </div>

    <form class="message-input" @submit.prevent="sendMessage">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Type a message..."
        autocomplete="off"
      />
      <button type="submit" :disabled="!newMessage.trim()">Send</button>
    </form>
  </div>
</template>
