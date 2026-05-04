<template>
  <div>
    <Header />
    <main>
      <router-view />
    </main>

    <button class="promocode-fab" @click="showPromocode = true">PROMOCODE</button>

    <div v-if="showPromocode" class="promocode-overlay" @click.self="showPromocode = false">
      <div class="promocode-modal">
        <button class="promocode-close" @click="showPromocode = false">&times;</button>
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
