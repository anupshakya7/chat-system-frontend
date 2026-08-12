<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authApi from '../../api/auth';

const router = useRouter();

const email = ref('');
const password = ref('');

const loading = ref(false);
const error = ref('');

const login = async() => {
    error.value = '';

    if(!email.value || !password.value){
        error.value = 'Email and password are required.';
        return;
    }

    loading.value = true;

    try{
        const response = await authApi.login({
            login: email.value,
            password: password.value
        });
        
        if(response.success){
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
    
            router.push('/chat');
        }else{
            error.value = 'Something went wrong';
        }
    }catch(err){
        if(err.response?.status === 401){
            error.value = 'Invalid email or password.';
        } else {
            error.value = err.response?.data?.message || 'Login Failed.';
        }
    }finally{
        loading.value = false;
    }
}
</script>
<template>
    <div class="auth-page">
        <h2>Login</h2>
        <p class="auth-subtitle">
            Login to your chat account
        </p>
        <div v-if="error" class="error">
            {{ error }}
        </div>
        <form @submit.prevent="login">
            <div class="form-group">
                <label>Email</label>
                <input v-model="email" type="email" placeholder="Enter your email"/>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input v-model="password" type="password" placeholder="Enter your password"/>
            </div>
            <button type="submit" :disabled="loading">
                {{ loading ? 'Logging In...' : 'Login' }}
            </button>
        </form>
        <p class="auth-link">
            Don't have an account? <router-link to="/register">Register</router-link>
        </p>
    </div>
</template>