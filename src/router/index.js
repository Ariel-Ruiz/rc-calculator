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
      description: 'Calculate your RollerCoin mining profits per block, day, week and month. Real-time crypto prices for BTC, ETH, DOGE, RLT and more.',
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
      description: 'Calculate the best multiplier and cost for RollerCoin progression events. See reward tables and profitability scores.',
    }
  },
  {
    path: '/burning-event',
    name: 'BurningEvent',
    component: BurningEvent,
    meta: {
      title: 'Burning Event | RC Calculator',
      description: 'Tools and calculations for RollerCoin burning events. Optimize your strategy.',
    }
  },
  {
    path: '/rooms',
    name: 'Rooms',
    component: Rooms,
    meta: {
      title: 'Room Simulator | RC Calculator',
      description: 'Simulate and optimize your RollerCoin room layout. Import your configuration and find the best miner placement for maximum power and bonus.',
    }
  },
  {
    path: '/hamsters',
    name: 'Hamsters',
    component: Hamsters,
    meta: {
      title: 'Hamsters | RC Calculator',
      description: 'Manage your RollerCoin hamsters for expeditions. Track levels, stats and optimize your team.',
    }
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: Marketplace,
    meta: {
      title: 'Marketplace | RC Calculator',
      description: 'Analyze and compare RollerCoin marketplace miners. Find the best deals based on power, bonus and price.',
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
