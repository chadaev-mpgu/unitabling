import('./assets/styles/main.css');

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import { ensureSeedData } from './api/index.ts';
import App from './App.vue';
import router from './router';

// Мок-бэкенд наполняется до первого обращения стора к репозиториям.
ensureSeedData();

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
