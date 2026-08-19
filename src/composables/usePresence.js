import { ref } from "vue";
import Echo from "../services/echo";

const onlineUsers = ref([]);
let initialized = false;

export function usePresence() {
    const initializePresence = () => {
        if (initialized) {
            console.log("Presence already initialized");
            return;
        }

        initialized = true;
        console.log("Joining presence channel: users");
        
        Echo.join("users")
            .here((users) => {
                console.log("Presence - currently online:", users);
                onlineUsers.value = users;
            })
            .joining((user) => {
                console.log("Presence - user joined:", user);
                const exists =
                    onlineUsers.value.some(
                        existingUser =>
                            Number(existingUser.id) === Number(user.id)
                            &&
                            existingUser.type ===
                                user.type
                    );

                if (!exists) {
                    onlineUsers.value.push(
                        user
                    );
                }
            })
            .leaving((user) => {
                console.log("Presence - user left:", user);
                onlineUsers.value =
                    onlineUsers.value.filter(
                        existingUser =>
                            !(
                                Number(
                                    existingUser.id
                                ) === Number(user.id)
                                &&
                                existingUser.type ===
                                    user.type
                            )
                    );
            })
            .error((error) => {
                console.error("Presence channel error:", error);
            });
    };

    const isOnline = (id, type) => {
        return onlineUsers.value.some(
            user => Number(user.id) === Number(id) && user.type === type
        );
    };

    const getOnlineUser = (id, type) => {
        return onlineUsers.value.find(
            user => Number(user.id) === Number(id) && user.type === type
        );
    };

    const leavePresence = () => {
        if (!initialized) {
            return;
        }
        console.log("Leaving presence channel: users");
        Echo.leave("users");
        onlineUsers.value = [];

        initialized = false;
    };

    return {
        onlineUsers,
        initializePresence,
        isOnline,
        getOnlineUser,
        leavePresence,
    };
}