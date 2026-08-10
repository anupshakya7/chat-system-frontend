<script setup>

import {
    ref,
    watch,
    nextTick,
    onBeforeUnmount
} from 'vue';

import echo from '../services/echo';
import chatApi from '../api/chat';


// --------------------------------------------------
// Props
// --------------------------------------------------

const props = defineProps({
    conversation: {
        type: Object,
        required: true
    }
});


// --------------------------------------------------
// State
// --------------------------------------------------

const messages = ref([]);

const loading = ref(false);

const newMessage = ref('');

const messagesContainer = ref(null);


// --------------------------------------------------
// Current User
// --------------------------------------------------

const storedUser =
    localStorage.getItem('user');

const currentUser =
    storedUser
        ? JSON.parse(storedUser)
        : null;

const currentUserId =
    currentUser?.id;


// --------------------------------------------------
// Echo Channel
// --------------------------------------------------

let currentChannel = null;

let subscribedConversationId = null;


// --------------------------------------------------
// Load Messages
// --------------------------------------------------

const loadMessages = async () => {

    if (!props.conversation?.id) {
        return;
    }

    loading.value = true;

    try {

        const response =
            await chatApi.getMessages(
                props.conversation.id
            );

        /*
         * Depending on your API response:
         *
         * {
         *     success: true,
         *     messages: [...]
         * }
         */

        messages.value =
            response.messages || [];

        await nextTick();

        scrollToBottom();

    } catch (error) {

        console.error(
            'Failed to load messages:',
            error
        );

    } finally {

        loading.value = false;

    }
};


// --------------------------------------------------
// Mark Conversation As Read
// --------------------------------------------------

const markConversationAsRead = async () => {

    if (!props.conversation?.id) {
        return;
    }

    try {

        await chatApi.markAsRead(
            props.conversation.id
        );

    } catch (error) {

        console.error(
            'Failed to mark conversation as read:',
            error
        );

    }
};


// --------------------------------------------------
// Subscribe To Reverb Channel
// --------------------------------------------------

const subscribeToConversation = () => {

    if (!props.conversation?.id) {
        return;
    }

    const conversationId =
        props.conversation.id;


    console.log(
        'Subscribing to conversation:',
        conversationId
    );


    /*
     * If already subscribed to this conversation,
     * don't subscribe again.
     */

    if (
        subscribedConversationId ===
        conversationId
    ) {
        return;
    }


    /*
     * Subscribe to:
     *
     * private-conversation.{id}
     *
     * Echo automatically adds "private-"
     */

    currentChannel =
        echo.private(
            `conversation.${conversationId}`
        );


    subscribedConversationId =
        conversationId;


    /*
     * Listen for Laravel broadcast event.
     *
     * This assumes your Laravel event uses:
     *
     * broadcastAs()
     * {
     *     return 'MessageSent';
     * }
     */

    currentChannel.listen(
        '.MessageSent',
        (event) => {

            console.log(
                'Realtime message received:',
                event
            );


            /*
             * Depending on your event response,
             * message may be:
             *
             * event.message
             */

            const incomingMessage =
                event.message;


            if (!incomingMessage) {
                return;
            }


            /*
             * Prevent duplicate messages.
             *
             * This can happen because the sender may
             * receive the same message from the API
             * response and Reverb.
             */

            const alreadyExists =
                messages.value.some(
                    message =>
                        message.id ===
                        incomingMessage.id
                );


            if (alreadyExists) {
                return;
            }


            messages.value.push(
                incomingMessage
            );


            nextTick(() => {
                scrollToBottom();
            });
        }
    );


    /*
     * Optional Reverb connection events
     */

    currentChannel.subscribed(() => {

        console.log(
            `Successfully subscribed to conversation.${conversationId}`
        );

    });

};


const unsubscribeFromConversation = () => {

    if (
        subscribedConversationId ===
        null
    ) {
        return;
    }


    console.log(
        'Leaving conversation:',
        subscribedConversationId
    );


    echo.leave(
        `conversation.${subscribedConversationId}`
    );


    currentChannel = null;

    subscribedConversationId = null;

};

const sendMessage = async () => {
    const message = newMessage.value.trim();

    if (!message) {
        return;
    }

    if (!props.conversation?.id) {
        return;
    }

    try {
        newMessage.value = '';

        const response =
            await chatApi.sendMessage(
                props.conversation.id,
                message
            );


        /*
         * Your Laravel response should be:
         *
         * {
         *     success: true,
         *     message: {...}
         * }
         */

        const sentMessage =
            response.message;


        /*
         * If Laravel returns the message,
         * add it locally.
         *
         * Reverb will also broadcast it,
         * but our duplicate check will prevent
         * adding it twice.
         */

        if (sentMessage) {

            const alreadyExists =
                messages.value.some(
                    item =>
                        item.id ===
                        sentMessage.id
                );


            if (!alreadyExists) {

                messages.value.push(
                    sentMessage
                );

            }

        }


        await nextTick();

        scrollToBottom();

    } catch (error) {

        console.error(
            'Failed to send message:',
            error
        );


        /*
         * Put message back if sending failed.
         */

        newMessage.value = message;

    }

};


// --------------------------------------------------
// Scroll To Bottom
// --------------------------------------------------

const scrollToBottom = () => {

    if (!messagesContainer.value) {
        return;
    }


    messagesContainer.value.scrollTop =
        messagesContainer.value.scrollHeight;

};


// --------------------------------------------------
// Conversation Changed
// --------------------------------------------------

watch(
    () => props.conversation?.id,

    async (
        newConversationId,
        oldConversationId
    ) => {

        /*
         * Ignore if nothing changed.
         */

        if (
            newConversationId ===
            oldConversationId
        ) {
            return;
        }


        /*
         * Leave previous Reverb channel.
         */

        unsubscribeFromConversation();


        /*
         * Clear old messages immediately.
         */

        messages.value = [];


        if (!newConversationId) {
            return;
        }


        /*
         * Load new conversation messages.
         */

        await loadMessages();


        /*
         * Mark messages as read.
         */

        await markConversationAsRead();


        /*
         * Subscribe to realtime messages.
         */

        subscribeToConversation();

    },

    {
        immediate: true
    }
);


// --------------------------------------------------
// Cleanup
// --------------------------------------------------

onBeforeUnmount(() => {

    unsubscribeFromConversation();

});

</script>


<template>

    <div class="chat-window">

        <!-- --------------------------------------- -->
        <!-- Header -->
        <!-- --------------------------------------- -->

        <div class="chat-header">

            <div class="avatar">

                {{
                    conversation.users?.[0]?.name
                        ?.charAt(0)
                        ?.toUpperCase()
                }}

            </div>


            <div>

                <strong>

                    {{
                        conversation.users?.[0]?.name
                            || 'Chat'
                    }}

                </strong>

            </div>

        </div>


        <!-- --------------------------------------- -->
        <!-- Messages -->
        <!-- --------------------------------------- -->

        <div
            ref="messagesContainer"
            class="messages"
        >

            <!-- Loading -->

            <div
                v-if="loading"
                class="loading"
            >
                Loading messages...
            </div>


            <!-- No Messages -->

            <div
                v-else-if="messages.length === 0"
                class="no-messages"
            >
                No messages yet.
                Start the conversation!
            </div>


            <!-- Messages -->

            <div
                v-for="message in messages"
                :key="message.id"
                :class="[
                    'message',
                    message.user_id === currentUserId
                        ? 'message-own'
                        : 'message-other'
                ]"
            >

                <div class="message-bubble">

                    <!-- User -->

                    <div class="message-user">

                        {{
                            message.user?.name
                                || 'Unknown'
                        }}

                    </div>


                    <!-- Message -->

                    <div class="message-text">

                        {{ message.message }}

                    </div>


                    <!-- Time -->

                    <small class="message-time">

                        {{
                            new Date(
                                message.created_at
                            ).toLocaleTimeString(
                                [],
                                {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }
                            )
                        }}

                    </small>

                </div>

            </div>

        </div>


        <!-- --------------------------------------- -->
        <!-- Input -->
        <!-- --------------------------------------- -->

        <form
            class="message-input"
            @submit.prevent="sendMessage"
        >

            <input
                v-model="newMessage"
                type="text"
                placeholder="Type a message..."
                autocomplete="off"
            />


            <button
                type="submit"
                :disabled="!newMessage.trim()"
            >
                Send
            </button>

        </form>

    </div>

</template>