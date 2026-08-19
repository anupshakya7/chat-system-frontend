import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || "127.0.0.1",
    wsPort: Number(
        import.meta.env.VITE_REVERB_PORT || 8080
    ),
    wssPort: Number(
        import.meta.env.VITE_REVERB_PORT || 8080
    ),
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === "https",
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel) => {
        return {
            authorize: (socketId, callback) => {
                const token = localStorage.getItem('token');

                if(!token){
                    console.error('Broadcast auth failed: token not found');
                    callback(true, new Error("Authentication token not found"));
                    return;
                }

                fetch(`${import.meta.env.VITE_BROADCAST_AUTH_URL}`,{
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name
                    }),
                })
                .then(async response => {
                    const data = await response.json();
                    
                    if(!response.ok){
                        throw new Error(data.message || "Broadcast authentication failed");
                    }

                    return data;
                })
                .then(data => {
                    console.log("Broadcast authorized:", channel.name);
                    callback(false, data);
                })
                .catch(error => {
                    console.error("Broadcast auth error: ", channel.name, error);
                    console.error("Broadcast auth error:", error);
                    callback(true, error);
                })
            }
        }
    }
});

export default echo;