import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../pages/Home.vue'
import Rollertap from '../pages/Rollertap.vue'
import PE from '../pages/PE.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/rollertap',
    name: 'Rollertap',
    component: Rollertap
  },
  {
    path: '/current-progression',
    name: 'PE',
    component: PE
  }
]

const router = new VueRouter({
  mode: 'history',
  base: '/rc-calculator',
  routes
})

export default router
