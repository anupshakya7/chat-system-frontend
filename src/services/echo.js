import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || "localhost",
    wsPort: Number(
        import.meta.env.VITE_REVERB_PORT || 8080
    ),
    wssPort: Number(
        import.meta.env.VITE_REVERB_PORT || 8080
    ),
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === "https",
    enabledTransports: ['ws', 'wss'],
    authEndpoint: "http://127.0.0.1:8000/broadcasting/auth",
    auth: {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json'
        }
    },
    authorizer: (channel) => {
        return {
            authorize: (socketId, callback) => {
                const token = localStorage.getItem('token');
                fetch('http://127.0.0.1:8000/broadcasting/auth',{
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
                    callback(false, data);
                })
                .catch(error => {
                    console.error("Broadcast auth error:", error);
                    callback(false, error);
                })
            }
        }
    }
});

export default echo;