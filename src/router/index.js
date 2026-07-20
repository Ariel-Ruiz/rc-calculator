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
    component: Home,
    meta: {
      title: 'Profit Calculator | RC Calculator',
      description: 'Calculate your RollerCoin mining profits per block, day, week and month.',
    }
  },
  {
    path: '/rollertap',
    name: 'Rollertap',
    component: Rollertap,
    meta: {
      title: 'RollerTap | RC Calculator',
      description: 'Manage your RollerTap hamsters and find the best upgrades by ROI.',
    }
  },
  {
    path: '/current-progression',
    name: 'PE',
    component: PE,
    meta: {
      title: 'Progression Event | RC Calculator',
      description: 'Calculate the best multiplier and cost for RollerCoin progression events.',
    }
  },
  {
    path: '/burning-event',
    name: 'BurningEvent',
    component: BurningEvent,
    meta: {
      title: 'Burning Event | RC Calculator',
      description: 'Tools and calculations for RollerCoin burning events.',
    }
  },
  {
    path: '/rooms',
    name: 'Rooms',
    component: Rooms,
    meta: {
      title: 'Room Simulator | RC Calculator',
      description: 'Simulate and optimize your RollerCoin room layout.',
    }
  },
  {
    path: '/hamsters',
    name: 'Hamsters',
    component: Hamsters,
    meta: {
      title: 'Hamsters | RC Calculator',
      description: 'Manage your RollerCoin hamsters for expeditions.',
    }
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: Marketplace,
    meta: {
      title: 'Marketplace | RC Calculator',
      description: 'Analyze and compare RollerCoin marketplace miners.',
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: '/rc-calculator',
  routes
})

router.afterEach((to) => {
  const { title, description } = to.meta || {}
  if (title) {
    document.title = title
  }
  if (description) {
    const tag = document.querySelector('meta[name="description"]')
    if (tag) tag.setAttribute('content', description)
  }
})

export default router
