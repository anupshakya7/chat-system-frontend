<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authApi from '../../api/auth';

const router = useRouter();

const name = ref('');
const email = ref('');
const mobile = ref('');
const password = ref('');
const passwordConfirmation = ref('');

const loading = ref(false);
const error = ref('');

const register = async() => {
    error.value = '';

    if(!name.value || !email.value || !mobile.value || !password.value || !passwordConfirmation.value){
        error.value = 'All fields are required.';
        return;
    }

    if(password.value !== passwordConfirmation.value){
        error.value = 'Password do not match';
        return;
    }

    loading.value = true;

    try{
        const response = await authApi.register({
            name: name.value,
            email: email.value,
            mobile: mobile.value,
            password: password.value,
            password_confirmation: passwordConfirmation.value
        });
        
        if(response.success){
            router.push('/login');
        }else{
            error.value = 'Something went wrong';
        }
        // localStorage.setItem('token', response.token);
        // localStorage.setItem('user', JSON.stringify(response.user));
        // localStorage.setItem('user_id', response.user.id);

        
    }catch(err){
        const errors = err.response?.data?.errors;

        if(errors){
            error.value = Object.values(errors).flat().join(' ');
        }else{
            error.value = err.response?.data?.message || 'Registration Failed';
        }
    }finally{
        loading.value = false;
    }
}
</script>
<template>
    <div class="auth-page">
        <h2>Create Account</h2>
        <p class="auth-subtitle">
            Create your chat account
        </p>
        <div v-if="error" class="error">
            {{ error }}
        </div>
        <form @submit.prevent="register">
            <div class="form-group">
                <label>Name</label>
                <input v-model="name" type="text" placeholder="Enter your name"/>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input v-model="email" type="email" placeholder="Enter your email"/>
            </div>
            <div class="form-group">
                <label>Mobile</label>
                <input v-model="mobile" type="text" placeholder="Enter your mobile"/>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input v-model="password" type="password" placeholder="Enter your password"/>
            </div>
            <div class="form-group">
                <label>Confirm Password</label>
                <input v-model="passwordConfirmation" type="password" placeholder="Enter your confirm password"/>
            </div>
            <button type="submit" :disabled="loading">
                {{ loading ? 'Creating account...' : 'Register' }}
            </button>
        </form>
        <p class="auth-link">
            Already have an account? <router-link to="/login">Login</router-link>
        </p>
    </div>
</template>