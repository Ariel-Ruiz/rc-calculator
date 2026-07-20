<template>
  <div>
  <!-- Mobile top bar -->
  <div class="v2-mobile-header">
    <img :src="headerBg" alt="" class="v2-mobile-header-bg" />
    <div class="v2-mobile-header-content">
      <div class="v2-mobile-header-logo">
        <div class="v2-mobile-header-logo-wrap">
          <img :src="rltIcon" alt="" class="v2-mobile-header-rlt" />
          <img :src="duckLogo" alt="RC Calculator" class="v2-mobile-header-duck" />
        </div>
        <span class="v2-mobile-header-title">RC Calculator</span>
      </div>
      <button class="v2-lang-btn" @click="toggleLang">{{ lang }}</button>
    </div>
  </div>

  <aside class="v2-sidebar">
    <div class="v2-sidebar-logo-wrap">
      <img :src="rltIcon" alt="" class="v2-sidebar-logo-bg" />
      <img :src="duckLogo" alt="RC Calculator" class="v2-sidebar-logo" />
    </div>
    <div class="v2-sidebar-divider"></div>

    <nav class="v2-sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="['v2-sidebar-item', {
          active: item.routeName === $route.name,
          featured: item.featured,
          disabled: item.disabled
        }]"
        :event="item.disabled ? '' : 'click'"
      >
        <div v-if="item.grid" class="v2-sidebar-grid">
          <img :src="item.icon" /><img :src="item.icon" />
          <img :src="item.icon" /><img :src="item.icon" />
        </div>
        <img v-else :src="item.icon" :alt="item.label" />
        <span class="v2-sidebar-tooltip">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="v2-sidebar-bottom">
      <button class="v2-lang-btn" @click="toggleLang">{{ lang }}</button>
    </div>
  </aside>
  </div>
</template>

<script>
import duckLogo from '../assets/duck.gif'
import rltIcon from '../assets/symbols/rlt.svg'
import headerBg from '../assets/icons/header.png'
import earningIcon from '../assets/icons/earning.svg'
import statsUpIcon from '../assets/icons/stats-up.svg'
import energyIcon from '../assets/icons/energy.svg'
import pcIcon from '../assets/icons/pc.svg'
import hamsterIcon from '../assets/icons/hamsters.svg'
import marketplaceIcon from '../assets/icons/marketplace.svg'
import gameIcon from '../assets/icons/game.svg'

export default {
  name: 'Header',
  inject: ['i18n'],
  data() {
    return { duckLogo, rltIcon, headerBg }
  },
  computed: {
    t() { return this.i18n.t },
    lang() { return this.i18n.lang },
    navItems() {
      const nav = this.t.nav || {}
      return [
        { to: '/', routeName: 'Home', icon: earningIcon, label: nav.profit || 'Profit' },
        { to: '/rollertap', routeName: 'Rollertap', icon: hamsterIcon, grid: true, label: nav.rollertap || 'RollerTap' },
        { to: '/current-progression', routeName: 'PE', icon: statsUpIcon, label: nav.progression || 'Progression' },
        { to: '/burning-event', routeName: 'BurningEvent', icon: energyIcon, label: nav.burning || 'Burning' },
        { to: '/rooms', routeName: 'Rooms', icon: pcIcon, label: nav.rooms || 'Rooms' },
        { to: '/hamsters', routeName: 'Hamsters', icon: hamsterIcon, label: nav.hamsters || 'Hamsters' },
        { to: '/marketplace', routeName: 'Marketplace', icon: marketplaceIcon, label: nav.marketplace || 'Marketplace', featured: true },
        { to: '#', routeName: null, icon: gameIcon, label: nav.games || 'Games', disabled: true }
      ]
    }
  },
  methods: {
    toggleLang() {
      this.i18n.toggleLang()
    }
  }
}
</script>
