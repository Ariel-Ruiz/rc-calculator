<template>
  <div class="app">
    <div class="v2-stars-extra"></div>
    <img v-for="(s, i) in bgItems" :key="'bg'+i" :src="s.src" :class="s.cls" :style="s.style" alt="" />
    <Header />
    <main>
      <router-view />
    </main>

    <button class="promocode-fab" @click="showPromocode = true">PROMOCODE</button>

    <div v-if="showPromocode" class="promocode-overlay" @click.self="showPromocode = false">
      <div class="promocode-modal">
        <button class="promocode-close v2-close-btn" @click="showPromocode = false">
          <img :src="timesIcon" alt="Close" />
        </button>
        <h3 class="promocode-title">Promocode</h3>
        <p class="promocode-desc">{{ i18n.t.promocode_desc || 'Enter the code to redeem it on RollerCoin' }}</p>
        <input
          v-model="promocodeText"
          class="promocode-input"
          type="text"
          placeholder="Enter code..."
          @keyup.enter="redeemPromocode"
        />
        <button class="promocode-btn" @click="redeemPromocode" :disabled="!promocodeText.trim()">
          {{ i18n.t.promocode_redeem || 'REDEEM' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Header from './components/Header.vue'
import duckBg from './assets/icons/duck.png'
import rltBg from './assets/symbols/rlt.svg'
import timesIcon from './assets/icons/times.svg'

export default {
  name: 'App',
  components: {
    Header
  },
  provide() {
    return {
      i18n: this.i18n,
      sidebar: this.sidebar
    }
  },
  data() {
    return {
      showPromocode: false,
      promocodeText: '',
      duckBg,
      rltBg,
      timesIcon,
      i18n: {
        lang: 'EN',
        t: {},
        toggleLang: this.toggleLang,
        loadLang: this.loadLang
      },
      sidebar: {
        isVisible: false,
        isCollapsed: false,
        toggleSidebar: this.toggleSidebar,
        closeSidebar: this.closeSidebar
      }
    }
  },
  computed: {
    bgItems() {
      const items = []
      const placed = []
      const sizes = [30, 35, 40, 45, 50, 55, 60]
      const rand = (min, max) => Math.floor(Math.random() * (max - min)) + min

      const place = (src, cls, canFlip) => {
        for (let attempt = 0; attempt < 30; attempt++) {
          const x = rand(3, 90)
          const y = rand(2, 92)
          const tooClose = placed.some(p => Math.abs(p.x - x) < 8 && Math.abs(p.y - y) < 8)
          if (tooClose) continue
          placed.push({ x, y })
          const w = sizes[rand(0, sizes.length)]
          const rot = rand(-30, 30)
          const flip = canFlip && Math.random() > 0.5 ? ' scaleX(-1)' : ''
          items.push({
            src,
            cls,
            style: `left:${x}%;top:${y}%;width:${w}px;transform:rotate(${rot}deg)${flip}`
          })
          return
        }
      }

      const isMobile = window.innerWidth < 768
      const count = isMobile ? 10 : 20
      for (let i = 0; i < count; i++) place(this.duckBg, 'v2-bg-duck', true)
      for (let i = 0; i < count; i++) place(this.rltBg, 'v2-bg-rlt', false)
      return items
    }
  },
  async created() {
    const saved = localStorage.getItem('rc_lang')
    const lang = saved === 'ES' ? 'ES' : 'EN'
    await this.loadLang(lang)
  },
  methods: {
    async loadLang(l) {
      try {
        const json = await import(`./lang/${l.toLowerCase()}.json`)
        this.i18n.t = json.default || json
        this.i18n.lang = l
        localStorage.setItem('rc_lang', l)
      } catch (err) {
        console.error('error loading lang', err)
      }
    },
    toggleLang() {
      this.loadLang(this.i18n.lang === 'EN' ? 'ES' : 'EN')
    },
    toggleSidebar() {
      if (window.innerWidth >= 900) {
        this.sidebar.isVisible = false
        this.sidebar.isCollapsed = !this.sidebar.isCollapsed
      } else {
        if (!this.sidebar.isVisible) this.sidebar.isCollapsed = false
        this.sidebar.isVisible = !this.sidebar.isVisible
      }
    },
    closeSidebar() {
      this.sidebar.isVisible = false
    },
    redeemPromocode() {
      const code = this.promocodeText.trim()
      if (!code) return
      window.open(`https://rollercoin.com/game?promocode=${encodeURIComponent(code)}`, '_blank')
      this.promocodeText = ''
      this.showPromocode = false
    }
  }
}
</script>
