import { createApp } from 'vue'
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'
import App from './App.vue'
import router from './router'
import '../../common/base.css'

const app = createApp(App)

app.use(router)

app.mount('#app')
