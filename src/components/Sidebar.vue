<template>
  <aside :class="className" id="sidebar">
    <div class="sidebar-content">
      <div class="dropdown">
        <div
          class="dropdown-btn"
          id="menuCalculadoras"
          @click.stop="dropdownOpen = !dropdownOpen"
        >
          {{ t.sidebar && t.sidebar.calculadoras || 'Calculadoras' }}
        </div>

        <div v-if="dropdownOpen" class="dropdown-content" id="calculadorasDropdown">
          <div class="dropdown-item">
            <router-link to="/" id="menuProfit" @click.native="closeSidebar">{{ t.sidebar && t.sidebar.profit || 'Profit' }}</router-link>
          </div>
          <div class="dropdown-item disabled-link">
            <span id="menuRollertap">{{ t.sidebar && t.sidebar.rollertap || 'Rollertap' }}</span>
            <div id="menuRollertapSoon">{{ t.sidebar && t.sidebar.proximamente || 'Próximamente' }}</div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'Sidebar',
  inject: ['sidebar', 'i18n'],
  data() {
    return {
      dropdownOpen: false
    }
  },
  computed: {
    t() {
      return this.i18n.t
    },
    className() {
      const base = 'sidebar'
      const visible = this.sidebar.isVisible ? 'visible' : ''
      const collapsed = this.sidebar.isCollapsed ? 'show' : ''
      return `${base} ${visible} ${collapsed}`.trim()
    }
  },
  methods: {
    closeSidebar() {
      this.sidebar.closeSidebar()
    }
  }
}
</script>
