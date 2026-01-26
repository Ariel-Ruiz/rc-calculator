<template>
  <header class="navbar">
    <div class="navbar-container">
      <div class="navbar-tittle">
        <button class="navbar-toggle" @click="toggleMenu" aria-label="Toggle navigation menu">
          ☰
        </button>
        <h1 class="navbar-title">{{ t.page_title }}🦆</h1>
        <button class="navbar-lang-movil" id="toggleLang" @click="toggleLang">
          {{ lang }}
        </button>
      </div>

      <nav :class="['navbar-links', { open: isMenuOpen }]">
        <router-link
          to="/"
          @click.native="toggleMenu"
          :class="{ active: $route.path === '/' }"
        >
          {{ t.nav && t.nav.profit }}
        </router-link>
        <router-link
          to="/rollertap"
          @click.native="toggleMenu"
          :class="{ active: $route.path === '/rollertap' }"
        >
          {{ t.nav && t.nav.rollertap }}
        </router-link>
        <router-link
          to="/current-progression"
          @click.native="toggleMenu"
          :class="{ active: $route.path === '/current-progression' }"
        >
          {{ t.nav && t.nav.progression }}
        </router-link>
        <a
          href="#"
          class="comming-soon"
          tabindex="-1"
          aria-disabled="true"
        >
          {{ t.nav && t.nav.rooms }}
          <div class="comming-soon-text">{{ t.nav && t.nav.comming_soon }}</div>
        </a>
      </nav>
      <div class="navbar-lang-container">
        <button class="navbar-lang" id="toggleLang" @click="toggleLang">
          {{ lang }}
        </button>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header',
  inject: ['i18n'],
  data() {
    return {
      isMenuOpen: false
    }
  },
  computed: {
    t() {
      return this.i18n.t
    },
    lang() {
      return this.i18n.lang
    }
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
    },
    toggleLang() {
      this.i18n.toggleLang()
    }
  }
}
</script>
