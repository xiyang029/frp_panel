import { createRouter, createWebHashHistory } from 'vue-router'
import ClientConfigure from '../views/ClientConfigure.vue'
import LoginView from '../views/LoginView.vue'
import ProxyDetail from '../views/ProxyDetail.vue'
import ProxyEdit from '../views/ProxyEdit.vue'
import ProxyList from '../views/ProxyList.vue'
import VisitorDetail from '../views/VisitorDetail.vue'
import VisitorEdit from '../views/VisitorEdit.vue'
import VisitorList from '../views/VisitorList.vue'
import { useProxyStore } from '../stores/proxy'
import { hasDashboardAuth, probeDashboardAuthRequired } from '../utils/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/',
      redirect: '/proxies',
    },
    {
      path: '/proxies',
      name: 'ProxyList',
      component: ProxyList,
    },
    {
      path: '/proxies/detail/:name',
      name: 'ProxyDetail',
      component: ProxyDetail,
    },
    {
      path: '/proxies/create',
      name: 'ProxyCreate',
      component: ProxyEdit,
      meta: { requiresStore: true },
    },
    {
      path: '/proxies/:name/edit',
      name: 'ProxyEdit',
      component: ProxyEdit,
      meta: { requiresStore: true },
    },
    {
      path: '/visitors',
      name: 'VisitorList',
      component: VisitorList,
    },
    {
      path: '/visitors/detail/:name',
      name: 'VisitorDetail',
      component: VisitorDetail,
    },
    {
      path: '/visitors/create',
      name: 'VisitorCreate',
      component: VisitorEdit,
      meta: { requiresStore: true },
    },
    {
      path: '/visitors/:name/edit',
      name: 'VisitorEdit',
      component: VisitorEdit,
      meta: { requiresStore: true },
    },
    {
      path: '/config',
      name: 'ClientConfigure',
      component: ClientConfigure,
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.name === 'Login' && hasDashboardAuth()) {
    return { name: 'ProxyList' }
  }

  if (to.meta.public) {
    return true
  }

  if (hasDashboardAuth()) {
    return true
  }

  const authRequired = await probeDashboardAuthRequired()
  if (!authRequired) {
    return true
  }

  if (!to.meta.public && authRequired && !hasDashboardAuth()) {
    return {
      name: 'Login',
      query: { next: encodeURIComponent(to.fullPath) },
    }
  }

  if (!to.matched.some((record) => record.meta.requiresStore)) {
    return true
  }

  const proxyStore = useProxyStore()
  const enabled = await proxyStore.checkStoreEnabled()
  if (enabled) {
    return true
  }

  return { name: 'ProxyList' }
})

export default router
