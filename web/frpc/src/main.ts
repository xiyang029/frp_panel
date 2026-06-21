import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'
import App from './App.vue'
import router from './router'
import '../../common/base.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
