import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Chat from "../views/Chat.vue";

const routes = [
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: {
            guest: true
        },
    },
    {
        path: '/register',
        name: 'register',
        component: Register,
        meta: {
            guest: true
        },
    },
    {
        path: '/',
        redirect: '/chat'
    },
    {
        path: '/chat',
        name: 'chat',
        component: Chat,
        meta: {
            requiresAuth: true
        },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to) => {
    const token = localStorage.getItem('token');

    if(to.meta.requiresAuth && !token){
        return {
            name: 'login'
        };
    }

    if(to.meta.guest && token){
        return {
            name: 'chat'
        };
    }
});

export default router;