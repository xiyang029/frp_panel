import { createRouter, createWebHashHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import ServerOverview from '../views/ServerOverview.vue'
import ServerConfig from '../views/ServerConfig.vue'
import Clients from '../views/Clients.vue'
import ClientDetail from '../views/ClientDetail.vue'
import Proxies from '../views/Proxies.vue'
import ProxyDetail from '../views/ProxyDetail.vue'
import { hasDashboardAuth } from '../utils/auth'

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/',
      name: 'ServerOverview',
      component: ServerOverview,
    },
    {
      path: '/config',
      name: 'ServerConfig',
      component: ServerConfig,
    },
    {
      path: '/clients',
      name: 'Clients',
      component: Clients,
    },
    {
      path: '/clients/:key',
      name: 'ClientDetail',
      component: ClientDetail,
    },
    {
      path: '/proxies/:type?',
      name: 'Proxies',
      component: Proxies,
    },
    {
      path: '/proxy/:name',
      name: 'ProxyDetail',
      component: ProxyDetail,
    },
  ],
})

router.beforeEach((to) => {
  if (to.name === 'Login' && hasDashboardAuth()) {
    return { name: 'ServerOverview' }
  }

  if (!to.meta.public && !hasDashboardAuth()) {
    return {
      name: 'Login',
      query: { next: encodeURIComponent(to.fullPath) },
    }
  }

  return true
})

export default router
