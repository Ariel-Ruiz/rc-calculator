<template>
  <div class="mp-container">
    <div class="mp-input">
      <h1 class="event-title">{{ t.marketplace?.title }}</h1>
      <p class="help" v-html="activeTab === 'sell' ? (t.marketplace?.subtitle_sell || t.marketplace?.subtitle) : (t.marketplace?.subtitle_buy || 'Paste data from the marketplace buy page')"></p>

      <div class="mp-example">
        <img
          :src="activeTab === 'sell' ? exampleSellImg : exampleBuyImg"
          alt="Example"
          class="mp-example-thumb"
          @click="previewImage = activeTab === 'sell' ? exampleSellImg : exampleBuyImg"
        />
      </div>

      <div v-if="previewImage" class="image-preview-overlay" @click="previewImage = null">
        <div class="image-preview-container" @click.stop>
          <img :src="previewImage" alt="Preview" class="image-preview" />
          <button class="preview-close" @click="previewImage = null">&times;</button>
        </div>
      </div>

      <textarea
        v-model="inputText"
        class="mp-textarea"
        :placeholder="activeTab === 'sell' ? (t.marketplace?.placeholder_sell || 'Paste sell data here...') : (t.marketplace?.placeholder_buy || 'Paste marketplace data here...')"
      ></textarea>

      <div class="mp-buttons">
        <button class="btn-load" @click="loadData">
          {{ t.marketplace?.load }}
        </button>
        <button class="btn-mp-clear" @click="clearAll">
          {{ t.marketplace?.clear }}
        </button>
      </div>
    </div>

    <div class="mp-results">
      <!-- Top bar: Tabs + Filters + Sort -->
      <div class="mp-top-bar">
        <div class="mp-tabs">
          <button :class="['mp-tab', { active: activeTab === 'sell' }]" @click="activeTab = 'sell'">SELL</button>
          <button :class="['mp-tab', { active: activeTab === 'buy' }]" @click="activeTab = 'buy'">BUY</button>
        </div>
        <div class="mp-top-right">
          <button class="mp-filter-toggle" @click="filtersOpen = !filtersOpen">
            FILTERS
            <span :class="['mp-sort-arrow', { open: filtersOpen }]">&#9660;</span>
          </button>
          <div class="mp-sort-dropdown">
            <button class="mp-sort-btn" @click="sortMenuOpen = !sortMenuOpen">
              <span class="mp-sort-text">{{ currentSortLabel }}</span>
              <span :class="['mp-sort-arrow', { open: sortMenuOpen }]">&#9660;</span>
            </button>
            <div v-if="sortMenuOpen" class="mp-sort-menu">
              <div
                v-for="opt in sortOptions"
                :key="opt.value"
                :class="['mp-sort-option', { active: currentSort === opt.value }]"
                @click="currentSort = opt.value; sortMenuOpen = false"
              >
                {{ opt.label }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters collapse -->
      <div v-if="filtersOpen" class="mp-filters">
        <template v-if="activeTab === 'sell'">
          <div class="mp-filter-field">
            <label>Min Power (Ph)</label>
            <input type="number" v-model.number="filters.sell.minPower" placeholder="0" />
          </div>
          <div class="mp-filter-field">
            <label>Min Bonus</label>
            <input type="number" v-model.number="filters.sell.minBonus" placeholder="0" />
          </div>
          <div class="mp-filter-field">
            <label>Sellable</label>
            <select v-model="filters.sell.sellable">
              <option value="all">All</option>
              <option value="yes">Sellable</option>
              <option value="no">Not Sellable</option>
            </select>
          </div>
        </template>
        <template v-else>
          <div class="mp-filter-field">
            <label>Min Power (Ph)</label>
            <input type="number" v-model.number="filters.buy.minPower" placeholder="0" />
          </div>
          <div class="mp-filter-field">
            <label>Min Bonus</label>
            <input type="number" v-model.number="filters.buy.minBonus" placeholder="0" />
          </div>
          <div class="mp-filter-field">
            <label>Max Price (RLT)</label>
            <input type="number" v-model.number="filters.buy.maxPrice" placeholder="0" step="0.1" />
          </div>
          <div class="mp-filter-field">
            <label>Max Ratio Power</label>
            <input type="number" v-model.number="filters.buy.maxRatioPower" placeholder="0" step="0.1" />
          </div>
          <div class="mp-filter-field">
            <label>Max Ratio Bonus</label>
            <input type="number" v-model.number="filters.buy.maxRatioBonus" placeholder="0" step="0.1" />
          </div>
        </template>
        <button class="mp-filter-reset" @click="resetFilters">RESET</button>
      </div>

      <div v-if="activeResults.length > 0" class="mp-grid">
        <div
          v-for="item in sortedActiveResults"
          :key="item.uid"
          class="mp-card"
        >
          <button class="mp-card-delete" @click="removeItem(item)">&times;</button>

          <div class="mp-miner-row">
            <img
              v-if="getMinerImageUrl(item)"
              :src="getMinerImageUrl(item)"
              alt="miner"
              class="mp-miner-img"
            />
            <div class="mp-miner-badges">
              <img
                v-if="item.isLegacy || getRarityLevel(item.name) === 'legacy'"
                :src="getAssetUrl('others/legacy.png')"
                alt="legacy"
                class="mp-badge-icon"
              />
              <img
                v-else-if="getRarityLevel(item.name)"
                :src="getLevelIcon(item.name)"
                alt="level"
                class="mp-badge-icon"
              />
              <img
                v-if="item.isSet"
                :src="getAssetUrl('others/set.png')"
                alt="set"
                class="mp-badge-icon"
              />
            </div>
          </div>

          <span class="mp-card-name">{{ getCleanName(item.name) }}</span>

          <div class="mp-card-stats">
            <span class="mp-info-value">{{ item.power }}</span>
            <span class="mp-card-separator">|</span>
            <span class="mp-info-bonus">{{ item.bonus }}%</span>
          </div>

          <!-- SELL tab: sellable + quantity + sell/buy buttons -->
          <template v-if="activeTab === 'sell'">
            <div :class="['mp-card-sellable', item.isSellable ? 'mp-sellable' : 'mp-not-sellable']">
              {{ item.isSellable ? t.marketplace?.sellable : t.marketplace?.cantSell }}
            </div>

            <div v-if="item.quantity > 1" class="mp-card-quantity">
              x{{ item.quantity }}
            </div>

            <div v-if="item.minerId" class="mp-card-buttons">
              <template v-if="item.isSellable">
                <a :href="'https://rollercoin.com/marketplace/sell/miner/' + item.minerId" target="_blank" class="mp-btn-sell">SELL</a>
                <a :href="'https://rollercoin.com/marketplace/buy/miner/' + item.minerId" target="_blank" class="mp-btn-buy">BUY</a>
              </template>
              <template v-else>
                <span class="mp-btn-sell mp-btn-disabled">SELL</span>
                <span class="mp-btn-buy mp-btn-disabled">BUY</span>
              </template>
            </div>
          </template>

          <!-- BUY tab: ratios + buy button only -->
          <template v-else>
            <div v-if="item.price" class="mp-card-price">{{ parseFloat(item.price.toFixed(3)) }} RLT</div>
            <div class="mp-card-ratios">
              <div class="mp-ratio-line"><span>Ratio Power</span> <span class="mp-ratio-value">{{ getRltPerPh(item) }} RLT</span></div>
              <div class="mp-ratio-line"><span>Ratio Bonus</span> <span class="mp-ratio-value">{{ getRltPerBonus(item) }}</span></div>
            </div>

            <div v-if="item.minerId" class="mp-card-buttons">
              <a :href="'https://rollercoin.com/marketplace/buy/miner/' + item.minerId" target="_blank" class="mp-btn-buy mp-btn-buy-full">BUY</a>
            </div>
          </template>
        </div>
      </div>

      <div v-else class="mp-empty-state">
        <div class="mp-empty-text">
          {{ activeTab === 'sell' ? (t.marketplace?.empty_sell || 'Paste miners data from the Sell section and click LOAD') : (t.marketplace?.empty_buy || 'Paste miners data from the Marketplace and click LOAD') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import '../styles/marketplace.css'
import minersData from '../assets/miners.json'
import exampleSell from '../assets/example_burn_sell.png'
import exampleMarketplace from '../assets/example_marketplace.png'

export default {
  name: 'Marketplace',
  inject: ['i18n'],
  data() {
    return {
      storagePath: 'https://storage.googleapis.com/rc-calculator-d20ac.firebasestorage.app/',
      inputText: '',
      sellResults: [],
      buyResults: [],
      miners: minersData,
      uidCounter: 0,
      exampleSellImg: exampleSell,
      exampleBuyImg: exampleMarketplace,
      previewImage: null,
      activeTab: 'sell',
      sortMenuOpen: false,
      filtersOpen: false,
      sellSort: 'default',
      buySort: 'default',
      isMobile: window.innerWidth <= 900,
      filters: {
        sell: { minPower: null, minBonus: null, sellable: 'all' },
        buy: { minPower: null, minBonus: null, maxPrice: null, maxRatioPower: null, maxRatioBonus: null }
      }
    }
  },
  computed: {
    t() {
      return this.i18n.t
    },
    activeResults() {
      const list = this.activeTab === 'sell' ? this.sellResults : this.buyResults
      const f = this.activeTab === 'sell' ? this.filters.sell : this.filters.buy
      return list.filter(item => {
        const ph = this.parsePower(item.power)
        const bon = parseFloat(item.bonus) || 0
        if (f.minPower && ph < f.minPower) return false
        if (f.minBonus && bon < f.minBonus) return false
        if (this.activeTab === 'sell' && f.sellable !== 'all') {
          if (f.sellable === 'yes' && !item.isSellable) return false
          if (f.sellable === 'no' && item.isSellable) return false
        }
        if (this.activeTab === 'buy') {
          if (f.maxPrice && item.price && item.price > f.maxPrice) return false
          if (f.maxRatioPower) { const r = this.getRltPerPhNum(item); if (r !== null && r > f.maxRatioPower) return false }
          if (f.maxRatioBonus) { const r = this.getRltPerBonusNum(item); if (r !== null && r > f.maxRatioBonus) return false }
        }
        return true
      })
    },
    currentSort: {
      get() { return this.activeTab === 'sell' ? this.sellSort : this.buySort },
      set(v) { if (this.activeTab === 'sell') this.sellSort = v; else this.buySort = v }
    },
    sortOptions() {
      const base = [
        { value: 'default', label: 'Default' },
        { value: 'power-desc', label: 'Power: High - Low' },
        { value: 'power-asc', label: 'Power: Low - High' },
        { value: 'bonus-desc', label: 'Bonus: High - Low' },
        { value: 'bonus-asc', label: 'Bonus: Low - High' }
      ]
      if (this.activeTab === 'buy') {
        base.push(
          { value: 'rlt-power-asc', label: 'Ratio Power: Low - High' },
          { value: 'rlt-power-desc', label: 'Ratio Power: High - Low' },
          { value: 'rlt-bonus-asc', label: 'Ratio Bonus: Low - High' },
          { value: 'rlt-bonus-desc', label: 'Ratio Bonus: High - Low' }
        )
      }
      return base
    },
    currentSortLabel() {
      const opt = this.sortOptions.find(o => o.value === this.currentSort)
      return opt ? opt.label : 'Sort'
    },
    sortedActiveResults() {
      const list = [...this.activeResults]
      switch (this.currentSort) {
        case 'power-desc': return list.sort((a, b) => this.parsePower(b.power) - this.parsePower(a.power))
        case 'power-asc': return list.sort((a, b) => this.parsePower(a.power) - this.parsePower(b.power))
        case 'bonus-desc': return list.sort((a, b) => (parseFloat(b.bonus) || 0) - (parseFloat(a.bonus) || 0))
        case 'bonus-asc': return list.sort((a, b) => (parseFloat(a.bonus) || 0) - (parseFloat(b.bonus) || 0))
        case 'rlt-power-asc': return list.sort((a, b) => (this.getRltPerPhNum(a) || Infinity) - (this.getRltPerPhNum(b) || Infinity))
        case 'rlt-power-desc': return list.sort((a, b) => (this.getRltPerPhNum(b) || 0) - (this.getRltPerPhNum(a) || 0))
        case 'rlt-bonus-asc': return list.sort((a, b) => (this.getRltPerBonusNum(a) || Infinity) - (this.getRltPerBonusNum(b) || Infinity))
        case 'rlt-bonus-desc': return list.sort((a, b) => (this.getRltPerBonusNum(b) || 0) - (this.getRltPerBonusNum(a) || 0))
        default:
          if (this.activeTab === 'sell') {
            return list.sort((a, b) => {
              if (a.isSellable && !b.isSellable) return -1
              if (!a.isSellable && b.isSellable) return 1
              return 0
            })
          }
          return list
      }
    },
    minerCache() {
      const cache = {}
      for (const m of this.miners) cache[m.id] = m
      return cache
    }
  },
  created() {
    this.loadFromStorage()
    window.addEventListener('resize', () => { this.isMobile = window.innerWidth <= 900 })
  },
  methods: {
    loadData() {
      const text = this.inputText.trim()
      if (!text) return

      if (this.activeTab === 'buy') {
        this.parseBuyData(text)
      } else {
        this.parseSellData(text)
      }
      this.inputText = ''
      this.saveToStorage()
    },

    parseSellData(text) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l)
      for (let i = 0; i < lines.length; i++) {
        // SELL FORMAT (MOBILE)
        const isMobileSell = i + 1 < lines.length &&
          lines[i + 1] === 'Size' &&
          !lines[i].match(/^[a-f0-9]{24}/i) &&
          !lines[i].match(/^(product|In collection|Rating star|set badge|\d+)$/i) &&
          !(i > 0 && lines[i - 1] === 'Set')

        if (isMobileSell) {
          let name = lines[i], power = '', bonus = '', quantity = 1, isLegacy = false, isSet = false
          if (i > 0) {
            if (lines[i - 1] === 'Rating star') { isLegacy = true; name = `Legacy ${name}` }
            else if (lines[i - 1] === 'set badge') { isSet = true }
            else if (lines[i - 1].match(/^(Uncommon|Rare|Epic|Legendary|Unreal)$/i)) { name = `${lines[i - 1]} ${name}` }
          }
          let foundQty = false
          for (let j = i + 2; j < Math.min(i + 15, lines.length); j++) {
            const pm = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
            if (pm) power = `${pm[1]} ${pm[2]}`
            const bm = lines[j].match(/^([\d.,]+)\s*%$/)
            if (bm) bonus = bm[1]
            if (lines[j].match(/^Quantity:?$/i)) foundQty = true
            if (foundQty && lines[j].match(/^\d+$/)) { quantity = parseInt(lines[j]); foundQty = false }
            if (lines[j] === 'iconSell Miner') break
          }
          if (name && power && bonus) this.addResult('sell', { name, power, bonus, quantity, isLegacy, isSet, minerId: null })
          i++; continue
        }

        // SELL FORMAT (DESKTOP)
        const sellId = lines[i].match(/^([a-f0-9]{24})([1-5])?(Rating star|set badge)?$/i)
        if (sellId) {
          const minerId = sellId[1]
          let name = '', power = '', bonus = '', quantity = 1, rarity = ''
          let isLegacy = sellId[3] && sellId[3].toLowerCase() === 'rating star'
          let isSet = sellId[3] && sellId[3].toLowerCase() === 'set badge'
          if (sellId[2]) {
            const rm = { '1': 'Uncommon', '2': 'Rare', '3': 'Epic', '4': 'Legendary', '5': 'Unreal' }
            rarity = rm[sellId[2]] || ''
          }
          let ni = i + 1
          if (ni < lines.length && lines[ni].match(/^(Uncommon|Rare|Epic|Legendary|Unreal)$/i)) { if (!rarity) rarity = lines[ni]; ni++ }
          if (ni < lines.length) {
            name = lines[ni]
            if (isSet && name.toLowerCase().endsWith(' set')) { ni++; if (ni < lines.length) name = lines[ni] }
            if (isLegacy) name = `Legacy ${name}`; else if (rarity) name = `${rarity} ${name}`
          }
          let foundQty = false, endIdx = ni + 1
          for (let j = ni + 1; j < Math.min(i + 20, lines.length); j++) {
            const pm = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
            if (pm) power = `${pm[1]} ${pm[2]}`
            const bm = lines[j].match(/^([\d.,]+)\s*%$/)
            if (bm) bonus = bm[1]
            if (lines[j].match(/^Quantity:?$/i)) foundQty = true
            if (foundQty && lines[j].match(/^\d+$/)) { quantity = parseInt(lines[j]); foundQty = false }
            endIdx = j + 1
            if (lines[j] === 'iconSell Miner') break
          }
          if (name && power && bonus) this.addResult('sell', { name, power, bonus, quantity, isLegacy, isSet, minerId })
          i = endIdx; continue
        }
      }
    },

    parseBuyData(text) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l)
      for (let i = 0; i < lines.length; i++) {
        // MARKETPLACE FORMAT: Name → "Power | Bonus%" → Price RLT
        if (lines[i] === 'productset badge') { i++; continue }
        const nameLine = lines[i]
        if (!nameLine || nameLine.match(/^\d/) || nameLine.includes('|') || nameLine.match(/^(product|Quantity|From|RLT|set badge)$/i)) continue

        if (i + 1 < lines.length) {
          const statsMatch = lines[i + 1].match(/([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)\s*\|\s*([\d.,]+)%/i)
          if (statsMatch) {
            let name = nameLine
            let isSet = false, isLegacy = false
            if (i > 0 && lines[i - 1] === 'productset badge') isSet = true
            if (i > 0 && lines[i - 1] === 'Rating star') { isLegacy = true; name = `Legacy ${name}` }
            const power = `${statsMatch[1]} ${statsMatch[2]}`
            const bonus = statsMatch[3]
            let price = null, quantity = 1

            for (let j = i + 2; j < Math.min(i + 8, lines.length); j++) {
              const priceMatch = lines[j].match(/^(?:From:?\s*)?([\d.,\s]+)\s*RLT$/i)
              if (priceMatch) price = parseFloat(priceMatch[1].replace(/[\s,]/g, ''))
              const qtyMatch = lines[j].match(/^Quantity:?\s*(\d+)$/i)
              if (qtyMatch) quantity = parseInt(qtyMatch[1])
            }

            if (name && power && bonus) {
              this.addResult('buy', { name, power, bonus, quantity: 1, isLegacy, isSet, minerId: null, price })
            }
            i++; continue
          }
        }
      }
    },

    addResult(tab, miner) {
      const list = tab === 'sell' ? this.sellResults : this.buyResults
      const existing = list.find(r => r.name === miner.name && r.power === miner.power && r.bonus === miner.bonus)
      if (existing) {
        if (tab === 'sell') existing.quantity = miner.quantity
        if (miner.minerId && !existing.minerId) existing.minerId = miner.minerId
        if (tab === 'buy' && miner.price) existing.price = miner.price
        return
      }
      const minerData = this.findMiner(miner)
      const isSellable = minerData ? !!minerData.can_be_sold : false
      list.push({ ...miner, uid: this.uidCounter++, isSellable, minerId: miner.minerId || (minerData ? minerData.id : null) })
    },

    removeItem(item) {
      if (this.activeTab === 'sell') {
        this.sellResults = this.sellResults.filter(r => r.uid !== item.uid)
      } else {
        this.buyResults = this.buyResults.filter(r => r.uid !== item.uid)
      }
      this.saveToStorage()
    },

    clearAll() {
      if (this.activeTab === 'sell') { this.sellResults = [] }
      else { this.buyResults = [] }
      this.inputText = ''
      this.saveToStorage()
    },

    resetFilters() {
      if (this.activeTab === 'sell') {
        this.filters.sell = { minPower: null, minBonus: null, sellable: 'all' }
      } else {
        this.filters.buy = { minPower: null, minBonus: null, maxPrice: null, maxRatioPower: null, maxRatioBonus: null }
      }
    },

    // Ratios
    parsePower(powerStr) {
      if (!powerStr) return 0
      const m = powerStr.match(/([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)/i)
      if (!m) return 0
      const v = parseFloat(m[1].replace(',', '.'))
      const u = m[2].toLowerCase()
      if (u.includes('eh')) return v * 1e3
      if (u.includes('ph')) return v
      if (u.includes('th')) return v / 1e3
      return v / 1e6
    },

    getRltPerPhNum(item) {
      if (!item.price) return null
      const ph = this.parsePower(item.power)
      return ph > 0 ? item.price / ph : null
    },

    getRltPerBonusNum(item) {
      if (!item.price) return null
      const b = parseFloat(item.bonus) || 0
      return b > 0 ? item.price / b : null
    },

    getRltPerPh(item) {
      const v = this.getRltPerPhNum(item)
      return v !== null ? v.toFixed(2) : '0'
    },

    getRltPerBonus(item) {
      const b = parseFloat(item.bonus) || 0
      if (b === 0) return '-'
      const v = this.getRltPerBonusNum(item)
      return v !== null ? v.toFixed(2) + ' RLT' : '-'
    },

    // Storage
    saveToStorage() {
      localStorage.setItem('marketplace_state', JSON.stringify({
        sellResults: this.sellResults,
        buyResults: this.buyResults
      }))
    },

    loadFromStorage() {
      const saved = localStorage.getItem('marketplace_state')
      if (saved) {
        try {
          const state = JSON.parse(saved)
          if (state.sellResults) this.sellResults = state.sellResults
          if (state.buyResults) this.buyResults = state.buyResults
          // Restore uid counter
          const maxUid = Math.max(0, ...this.sellResults.map(r => r.uid || 0), ...this.buyResults.map(r => r.uid || 0))
          this.uidCounter = maxUid + 1
        } catch (e) { /* ignore */ }
      }
    },

    // Miner resolution helpers
    getCleanName(name) { return name.replace(/^(Unreal|Legendary|Epic|Rare|Uncommon|Legacy)\s+/gi, '').trim() },
    getRarityLevel(name) {
      const ln = name.toLowerCase()
      if (ln.startsWith('unreal ')) return 6; if (ln.startsWith('legendary ')) return 5
      if (ln.startsWith('epic ')) return 4; if (ln.startsWith('rare ')) return 3
      if (ln.startsWith('uncommon ')) return 2; if (ln.startsWith('legacy ')) return 'legacy'
      return null
    },
    getLevelIcon(name) {
      const level = this.getRarityLevel(name)
      if (!level) return ''
      if (level === 'legacy') return `${this.storagePath}others/legacy.png`
      return `${this.storagePath}others/level_${level}.png`
    },
    getMinerImageUrl(item) {
      const miner = this.findMiner(item)
      if (miner && miner.filename) return `${this.storagePath}miner/${miner.filename}`
      return null
    },
    getAssetUrl(path) { return `${this.storagePath}${path}` },
    normalizeName(str) {
      return str.toLowerCase().replace(/[\u0027\u2019\u2018\u0060\u00B4\u2032""\-–—\.]/g, '_').replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '')
    },
    normalizeUnicode(str) { return str.normalize('NFC').replace(/\s+/g, ' ').trim() },
    normalizeApostrophes(str) { return str.replace(/[\u0027\u2019\u2018\u0060\u00B4\u2032]/g, "'") },
    extractParenthesesName(str) { const m = str.match(/\(([^)]+)\)/); return m ? m[1].trim() : null },
    findMiner(item) {
      if (item.minerId && this.minerCache[item.minerId]) return this.minerCache[item.minerId]
      if (item._minerRef !== undefined) return item._minerRef
      const cleanName = this.normalizeUnicode(this.getCleanName(item.name))
      const normalizedClean = this.normalizeName(cleanName)
      let found = this.miners.find(m => this.normalizeApostrophes(this.normalizeUnicode(m.name)).toLowerCase() === this.normalizeApostrophes(cleanName).toLowerCase())
      if (found) { item._minerRef = found; return found }
      const pn = this.extractParenthesesName(cleanName)
      if (pn) { found = this.miners.find(m => { const mp = this.extractParenthesesName(this.normalizeUnicode(m.name)); return mp && this.normalizeApostrophes(mp).toLowerCase() === this.normalizeApostrophes(pn).toLowerCase() }); if (found) { item._minerRef = found; return found } }
      found = this.miners.find(m => this.normalizeName(m.name) === normalizedClean)
      if (found) { item._minerRef = found; return found }
      found = this.miners.find(m => { const mN = this.normalizeName(m.name); return mN.includes(normalizedClean) || normalizedClean.includes(mN) })
      item._minerRef = found || null
      return found || null
    }
  }
}
</script>
