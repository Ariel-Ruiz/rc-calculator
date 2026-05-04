import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../pages/Home.vue'
import Rollertap from '../pages/Rollertap.vue'
import PE from '../pages/PE.vue'
import BurningEvent from '../pages/BurningEvent.vue'
import Rooms from '../pages/Rooms.vue'
import Hamsters from '../pages/Hamsters.vue'
import Marketplace from '../pages/Marketplace.vue'

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
  },
  {
    path: '/burning-event',
    name: 'BurningEvent',
    component: BurningEvent
  },
  {
    path: '/rooms',
    name: 'Rooms',
    component: Rooms
  },
  {
    path: '/hamsters',
    name: 'Hamsters',
    component: Hamsters
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: Marketplace
  }
]

const router = new VueRouter({
  mode: 'history',
  base: '/rc-calculator',
  routes
})

export default router
