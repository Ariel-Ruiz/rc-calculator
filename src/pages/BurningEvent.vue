<template>
  <div class="v2-burn">
    <!-- Maintenance -->
    <div v-if="maintenance" class="v2-loading">
      <div style="text-align:center">
        <h1 class="v2-burn-title">{{ t.burning?.maintenanceTitle }}</h1>
        <p style="color:var(--v2-text-muted);font-size:1.1rem">{{ t.burning?.maintenanceSubtitle }}</p>
      </div>
    </div>

    <!-- LEFT: Input -->
    <div class="v2-burn-input">
      <h1 class="v2-burn-title">{{ t.burning?.title }}</h1>
      <p class="v2-burn-help" v-html="cleanSubtitle"></p>

      <div class="v2-burn-examples">
        <div v-for="(img, key) in exampleImages" :key="key" class="v2-burn-example" @click="openPreview(img)">
          <img :src="img" :alt="key" class="v2-burn-thumb" />
          <span class="v2-burn-thumb-label">{{ key }}</span>
        </div>
      </div>

      <!-- Preview -->
      <div v-if="previewImage" class="v2-preview-overlay" @click="closePreview">
        <div class="v2-preview-container" @click.stop>
          <img :src="previewImage" alt="Preview" />
          <button class="v2-preview-close v2-close-btn" @click="closePreview">
            <img :src="timesIcon" alt="Close" />
          </button>
        </div>
      </div>

      <textarea v-model="inputText" class="v2-textarea" :placeholder="t.burning?.placeholder || 'paste data here...'" />

      <div class="v2-burn-btns">
        <button class="v2-burn-btn-calc" @click="calculate">{{ t.burning?.calculate || 'CALCULATE' }}</button>
        <button class="v2-burn-btn-clear" @click="clearAll">{{ t.burning?.clear || 'CLEAR' }}</button>
      </div>
    </div>

    <!-- RIGHT: Results -->
    <div class="v2-burn-results">
      <!-- Points bar -->
      <div v-if="results.length > 0" class="v2-burn-points-bar">
        <div class="v2-burn-points-left">
          <span class="v2-burn-points-label">{{ t.burning?.selectedPoints }}</span>
          <img src="../assets/symbols/ecoin.svg" alt="ecoin" class="v2-burn-ecoin-lg" />
          <span class="v2-burn-points-value">{{ formatNumber(selectedPoints) }}</span>
        </div>
        <div class="v2-burn-points-right">
          <span class="v2-burn-points-label">{{ t.burning?.selectedMiners }}</span>
          <span class="v2-burn-points-value">{{ selectedMinersCount }}</span>
        </div>
      </div>

      <!-- Controls -->
      <div v-if="results.length > 0" class="v2-burn-controls">
        <div class="v2-burn-sources">
          <button
            v-for="source in availableSources" :key="source"
            :class="['v2-burn-source-btn', 'v2-burn-src-' + source.toLowerCase(), { hidden: hiddenSources.includes(source) }]"
            @click="toggleSource(source)"
          >{{ source }}</button>
        </div>
        <div class="v2-burn-controls-right">
          <button class="v2-burn-filter-btn" @click="filtersOpen = !filtersOpen">
            {{ t.burning?.filters || 'FILTERS' }}
            <span :class="['v2-burn-arrow', { open: filtersOpen }]">&#9660;</span>
          </button>
          <div class="v2-burn-sort-wrap">
            <button class="v2-burn-sort-btn" @click="sortMenuOpen = !sortMenuOpen">
              {{ currentSortLabel }}
              <span :class="['v2-burn-arrow', { open: sortMenuOpen }]">&#9660;</span>
            </button>
            <div v-if="sortMenuOpen" class="v2-burn-sort-menu">
              <div v-for="opt in sortOptions" :key="opt.value"
                :class="['v2-burn-sort-opt', { active: sortBy === opt.value }]"
                @click="selectSort(opt.value)"
              >{{ opt.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div v-if="results.length > 0 && filtersOpen" class="v2-burn-filters">
        <div class="v2-burn-filter-group">
          <label class="v2-label">{{ t.burning?.minPoints }}</label>
          <input class="v2-input" type="number" :value="filterMinPoints" @input="debouncedFilter('filterMinPoints', $event)" min="0" />
        </div>
        <div class="v2-burn-filter-group">
          <label class="v2-label">{{ t.burning?.minPtsRlt }}</label>
          <input class="v2-input" type="number" :value="filterMinPtsRlt" @input="debouncedFilter('filterMinPtsRlt', $event)" min="0" />
        </div>
        <div class="v2-burn-filter-group">
          <label class="v2-label">{{ t.burning?.maxPrice }}</label>
          <input class="v2-input" type="number" :value="filterMaxPrice" @input="debouncedFilter('filterMaxPrice', $event)" min="0" step="0.01" />
        </div>
        <div class="v2-burn-filter-group">
          <label class="v2-label">{{ t.burning?.filterSellable }}</label>
          <select class="v2-input" v-model="filterSellable">
            <option value="all">{{ t.burning?.filterAll }}</option>
            <option value="sellable">{{ t.burning?.sellable }}</option>
            <option value="not-sellable">{{ t.burning?.notSellable }}</option>
          </select>
        </div>
        <button class="v2-burn-btn-calc v2-burn-reset-btn" @click="resetFilters">{{ t.burning?.reset || 'RESET' }}</button>
      </div>

      <!-- Cards grid -->
      <div v-if="filteredResults.length > 0" class="v2-burn-grid">
        <div
          v-for="item in filteredResults" :key="item.uid"
          :class="['v2-burn-card', { selected: isSelected(item) }]"
          @click="toggleSelect(item)"
        >
          <button class="v2-burn-card-del v2-close-btn" @click.stop="removeItem(item)">
            <img :src="timesIcon" alt="x" />
          </button>
          <div :class="['v2-burn-card-src', 'v2-burn-src-' + (item.source || 'marketplace').toLowerCase()]">{{ item.source || 'MARKETPLACE' }}</div>
          <div class="v2-burn-card-pts">
            <img src="../assets/symbols/ecoin.svg" alt="ecoin" class="v2-burn-ecoin" />
            <span>{{ formatNumber(item.points) }}</span>
          </div>
          <div class="v2-burn-card-body">
            <div class="v2-burn-miner-row">
              <img v-if="getMinerImageUrl(item)" :src="getMinerImageUrl(item)" alt="miner" class="v2-burn-miner-img" />
              <div class="v2-burn-badges">
                <img v-if="item.isLegacy || getRarityLevel(item.name) === 'legacy'" :src="getAssetUrl('others/legacy.png')" alt="legacy" class="v2-burn-badge" />
                <img v-else-if="getRarityLevel(item.name)" :src="getLevelIcon(item.name)" alt="level" class="v2-burn-badge" />
                <img v-if="item.isSet" :src="getAssetUrl('others/set.png')" alt="set" class="v2-burn-badge" />
              </div>
            </div>
            <span class="v2-burn-card-name">{{ getCleanName(item.name) }}</span>
            <div class="v2-burn-card-stats">
              <span>{{ item.power }}</span>
              <span class="v2-burn-sep">|</span>
              <span class="v2-burn-bonus">{{ item.bonus }}%</span>
            </div>
            <a v-if="item.isSellable && getMinerLink(item)"
              :href="getMinerLink(item)"
              target="_blank" class="v2-burn-sellable-link" @click.stop
            >{{ t.burning?.sellable }}</a>
            <div v-else :class="['v2-burn-sellable', item.isSellable ? 'yes' : 'no']">
              {{ item.isSellable ? t.burning?.sellable : t.burning?.notSellable }}
            </div>
          </div>
          <div v-if="item.price !== null" class="v2-burn-card-footer">
            <div class="v2-burn-price">{{ formatPrice(item.price) }} RLT</div>
            <div class="v2-burn-ppr">{{ formatNumber(item.pointsPerRlt) }} PtsxRLT</div>
          </div>
          <div v-if="item.quantity > 1 && (item.source === 'SELL' || item.source === 'INVENTORY' || item.source === 'MARKETPLACE')" class="v2-burn-qty-badge">x{{ item.quantity }}</div>
          <div v-if="isSelected(item) && (item.source === 'SELL' || item.source === 'INVENTORY' || item.source === 'MARKETPLACE')" class="v2-burn-qty-ctrl" @click.stop>
            <button class="v2-burn-qty-btn minus" @click="decrementQty(item)">-</button>
            <span class="v2-burn-qty-val">{{ selectedUids[item.uid] }}</span>
            <button class="v2-burn-qty-btn plus" @click="incrementQty(item)" :disabled="selectedUids[item.uid] >= item.quantity">+</button>
          </div>
        </div>
      </div>

      <div v-else class="v2-burn-empty">
        <div>{{ t.burning?.empty }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import '../styles/burning.css'
import exampleMarketplace from '../assets/example_burn_marketplace.png'
import exampleSell from '../assets/example_burn_sell.png'
import exampleInventory from '../assets/example_burn_inventory.png'
import exampleCollection from '../assets/example_burn_collection.png'
import minersData from '../assets/miners.json'
import mergesData from '../assets/merges.json'
import timesIcon from '../assets/icons/times.svg'
import infoIcon from '../assets/icons/info.svg'

export default {
  name: 'BurningEvent',
  inject: ['i18n'],
  data() {
    return {
      maintenance: false,
      storagePath: 'https://storage.googleapis.com/rc-calculator-d20ac.firebasestorage.app/',
      inputText: '',
      results: [],
      selectedUids: {},
      sortBy: 'points-desc',
      sortMenuOpen: false,
      filtersOpen: false,
      filterMinPoints: null,
      filterMinPtsRlt: null,
      filterMaxPrice: null,
      previewImage: null,
      filterSellable: 'all',
      hiddenSources: [],
      miners: minersData,
      exampleImages: {
        marketplace: exampleMarketplace,
        sell: exampleSell,
        inventory: exampleInventory,
        collection: exampleCollection
      },
      sortOptions: [
        { value: 'points-asc', label: 'Points: Low - High' },
        { value: 'points-desc', label: 'Points: High - Low' },
        { value: 'ppr-asc', label: 'PtsxRLT: Low - High' },
        { value: 'ppr-desc', label: 'PtsxRLT: High - Low' }
      ],
      timesIcon,
      infoIcon,
      merges: mergesData
    }
  },
  computed: {
    t() {
      return this.i18n.t
    },
    currentSortLabel() {
      const option = this.sortOptions.find(o => o.value === this.sortBy)
      return option ? option.label : 'Sort'
    },
    minerCache() {
      const cache = {}
      for (const m of this.miners) {
        cache[m.id] = m
      }
      return cache
    },
    computedResults() {
      return this.results.map(item => {
        const minerData = this.findMinerCached(item)
        const isSellable = minerData ? !!minerData.can_be_sold : false
        const points = this.calcularPuntos(item.power, item.bonus, isSellable)
        const pointsPerRlt = item.price > 0 ? Math.round(points / item.price) : item.pointsPerRlt
        return { ...item, points, pointsPerRlt, isSellable }
      })
    },
    sortedResults() {
      const sorted = [...this.computedResults]
      switch (this.sortBy) {
        case 'points-asc':
          return sorted.sort((a, b) => a.points - b.points)
        case 'points-desc':
          return sorted.sort((a, b) => b.points - a.points)
        case 'ppr-asc':
          return sorted.sort((a, b) => a.pointsPerRlt - b.pointsPerRlt)
        case 'ppr-desc':
          return sorted.sort((a, b) => b.pointsPerRlt - a.pointsPerRlt)
        default:
          return sorted
      }
    },
    availableSources() {
      const sources = [...new Set(this.results.map(r => r.source || 'MARKETPLACE'))]
      const order = ['MARKETPLACE', 'SELL', 'INVENTORY', 'COLLECTION']
      return sources.sort((a, b) => order.indexOf(a) - order.indexOf(b))
    },
    filteredResults() {
      return this.sortedResults.filter(item => {
        const source = item.source || 'MARKETPLACE'
        if (this.hiddenSources.includes(source)) return false

        if (this.filterMinPoints && item.points < this.filterMinPoints) return false
        if (this.filterMinPtsRlt && (item.pointsPerRlt === null || item.pointsPerRlt < this.filterMinPtsRlt)) return false
        if (this.filterMaxPrice && (item.price === null || item.price > this.filterMaxPrice)) return false

        if (this.filterSellable === 'sellable' && !item.isSellable) return false
        if (this.filterSellable === 'not-sellable' && item.isSellable) return false

        return true
      })
    },
    computedResultsMap() {
      const map = {}
      for (const item of this.computedResults) {
        map[item.uid] = item
      }
      return map
    },
    selectedPoints() {
      let total = 0
      for (const uid in this.selectedUids) {
        const qty = this.selectedUids[uid]
        if (qty) {
          const item = this.computedResultsMap[uid]
          if (item) {
            total += item.points * qty
          }
        }
      }
      return total
    },
    selectedMinersCount() {
      let count = 0
      for (const uid in this.selectedUids) {
        const qty = this.selectedUids[uid]
        if (qty) {
          count += qty
        }
      }
      return count
    },
    cleanSubtitle() {
      const raw = this.i18n.t?.burning?.subtitle || ''
      return raw.replace(/💡/g, `<img src="${this.infoIcon}" class="v2-burn-info-icon" alt="" />`)
    }
  },
  mounted() {
    this.loadFromStorage()
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    parseNumericValue(str) {
      const cleanedStr = str.replace(/[^\d.,]/g, '')
      return parseFloat(cleanedStr.replace(',', '.'))
    },

    calcularPuntos(poder, bonus, isSellable = false) {
      let valorPoder = this.parseNumericValue(poder)
      let valorBonus = this.parseNumericValue(bonus)
      let poderEnPhs = 0

      if (poder.includes('Eh/s')) {
        poderEnPhs = valorPoder * 1000
      } else if (poder.includes('Ph/s')) {
        poderEnPhs = valorPoder
      } else if (poder.includes('Th/s')) {
        poderEnPhs = valorPoder / 1000
      }

      // Updated event scoring: points now depend ONLY on power. Each pointsXPh is the previous
      // multiplier scaled by 5/24 (same power/sellable tiers). pointsXBonus is kept at its
      // original values but ignored in the calc — if a future event counts bonus again with the
      // same values, just re-enable the bonus term below.
      let pointsXPh = 1
      let pointsXBonus = 1

      if (poderEnPhs >= 10 && isSellable) {
        pointsXPh = 3000
        pointsXBonus = 60
      } else if (poderEnPhs >= 10) {
        pointsXPh = 2000
        pointsXBonus = 40
      } else if (poderEnPhs >= 5 && isSellable) {
        pointsXPh = 3750
        pointsXBonus = 75
      } else if (poderEnPhs >= 5) {
        pointsXPh = 2500
        pointsXBonus = 50
      } else if (poderEnPhs >= 1 && isSellable) {
        pointsXPh = 4687.5
        pointsXBonus = 93.75
      } else if (poderEnPhs >= 1) {
        pointsXPh = 3125
        pointsXBonus = 62.5
      } else if (poderEnPhs > 0.75 && isSellable) {
        pointsXPh = 9687.5
        pointsXBonus = 193.75
      } else if (isSellable) {
        pointsXPh = 5812.5
        pointsXBonus = 116.25
      } else {
        pointsXPh = 3875
        pointsXBonus = 77.5
      }

      // Bonus term ignored this event; re-add `+ (pointsXBonus * valorBonus)` if it counts again.
      void pointsXBonus; void valorBonus
      let puntos = poderEnPhs * pointsXPh
      return Math.ceil(puntos)
    },

    parseInput(text) {
      const miners = []
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      let uidCounter = Date.now()

      const findExisting = (miner) => {
        return miners.find(m =>
          m.name === miner.name &&
          m.power === miner.power &&
          m.bonus === miner.bonus &&
          m.source === miner.source
        )
      }

      const addMiner = (miner) => {
        miner.uid = uidCounter++

        const existing = findExisting(miner)
        if (existing) {
          if (miner.isSet && !existing.isSet) {
            existing.isSet = true
          }
          if (miner.minerId && !existing.minerId) {
            existing.minerId = miner.minerId
          }
          if ((miner.source === 'INVENTORY' || miner.source === 'SELL') && miner.quantity) {
            existing.quantity = (existing.quantity || 1) + miner.quantity
          }
        } else {
          miners.push(miner)
        }
      }

      let i = 0
      while (i < lines.length) {
        if ((lines[i].match(/^product\d*$/i) && !lines[i].includes('set badge')) ||
            lines[i] === 'In collection' ||
            lines[i].match(/^productRating star$/i)) {
          i++
          continue
        }

        // ========== COLLECTION FORMAT ==========
        const collectionBonusMatch = lines[i].match(/^Bonus power \+([\d.,]+)%$/i)
        if (collectionBonusMatch) {
          let bonus = collectionBonusMatch[1]
          let name = ''
          let power = ''
          let quantity = 1
          let rarity = ''
          let isSet = false
          let isLegacy = false

          if (i + 1 < lines.length) {
            const idLine = lines[i + 1]

            const isSetBadge = idLine.includes('set badge')
            isLegacy = idLine.includes('Rating star')

            const cleanId = idLine.replace('set badge', '').replace('Rating star', '').trim()
            const idMatch = cleanId.match(/^([a-f0-9]{24})([1-5])?$/i)

            if (idMatch) {
              const minerId = idMatch[0].substring(0, 24)
              isSet = isSetBadge
              if (idMatch[2]) {
                const rarityMap = { '1': 'Uncommon', '2': 'Rare', '3': 'Epic', '4': 'Legendary', '5': 'Unreal' }
                rarity = rarityMap[idMatch[2]] || ''
              }

              let nameIndex = i + 2

              if (isSet && nameIndex < lines.length) {
                const potentialSetName = lines[nameIndex]
                if (potentialSetName.toLowerCase().endsWith(' set')) {
                  nameIndex++
                }
              }

              if (nameIndex < lines.length) {
                name = lines[nameIndex]
                if (isLegacy) {
                  name = `Legacy ${name}`
                } else if (rarity) {
                  name = `${rarity} ${name}`
                }
              }

              let endIdx = nameIndex + 1
              for (let j = nameIndex + 1; j < Math.min(i + 12, lines.length); j++) {
                const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
                if (powerMatch) {
                  power = `${powerMatch[1]} ${powerMatch[2]}`
                }
                endIdx = j + 1
                if (lines[j] === 'Miner details') break
              }

              if (name && power) {
                const minerData = this.findMiner({ name: this.getCleanName(name), minerId })
                const isSellable = minerData ? !!minerData.can_be_sold : false
                const points = this.calcularPuntos(power, bonus, isSellable)
                addMiner({
                  name,
                  power,
                  bonus,
                  quantity,
                  price: null,
                  points,
                  pointsPerRlt: null,
                  source: 'COLLECTION',
                  isSet,
                  isLegacy,
                  minerId
                })
              }
              i = endIdx - 1
            } else {
              i++
            }
          } else {
            i++
          }
          continue
        }

        // ========== INVENTORY FORMAT ==========
        const isInventoryLegacy = lines[i] === 'Rating star' && i + 2 < lines.length && lines[i + 2] === 'Set'
        const isInventorySetBadge = lines[i] === 'set badge' && i + 2 < lines.length && lines[i + 2] === 'Set'
        const isInventoryNormal = i + 1 < lines.length && lines[i + 1] === 'Set' && lines[i] !== 'Rating star' && lines[i] !== 'set badge'

        if (isInventoryLegacy || isInventorySetBadge || isInventoryNormal) {
          let name = ''
          let power = ''
          let bonus = ''
          let quantity = 1
          let isLegacy = isInventoryLegacy
          let isSet = isInventorySetBadge
          let startIndex = i

          if (isInventoryLegacy) {
            name = `Legacy ${lines[i + 1]}`
            startIndex = i + 1
          } else if (isInventorySetBadge) {
            let candidateName = lines[i + 1]
            startIndex = i + 1
            if (candidateName.toLowerCase().endsWith(' set') && i + 3 < lines.length) {
              candidateName = lines[i + 3]
              startIndex = i + 3
            }
            name = candidateName
          } else {
            name = lines[i]
            if (i > 0 && lines[i - 1].match(/^[1-5]$/)) {
              const prevPrevLine = i > 1 ? lines[i - 2].toLowerCase() : ''
              const isPropertyValue = prevPrevLine.match(/^(power|bonus|quantity|from|price|size|miner details|ph\/s|th\/s|eh\/s|gh\/s|%)[:.]?$/i) ||
                                       prevPrevLine.match(/\d+\s*(ph\/s|th\/s|eh\/s|gh\/s|%)/i)

              if (!isPropertyValue) {
                const rarityMap = { '1': 'Uncommon', '2': 'Rare', '3': 'Epic', '4': 'Legendary', '5': 'Unreal' }
                const rarity = rarityMap[lines[i - 1]]
                if (rarity) name = `${rarity} ${name}`
              }
            }
          }

          let foundQuantityLabel = false
          for (let j = startIndex + 2; j < Math.min(startIndex + 15, lines.length); j++) {
            const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
            if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`

            const bonusMatch = lines[j].match(/^([\d.,]+)\s*%$/)
            if (bonusMatch) bonus = bonusMatch[1]

            if (lines[j].match(/^Quantity:?$/i)) {
              foundQuantityLabel = true
            }
            if (foundQuantityLabel && lines[j].match(/^\d+$/)) {
              quantity = parseInt(lines[j])
              foundQuantityLabel = false
            }

            if (lines[j] === 'Miner details') break
          }

          if (name && power && bonus !== '') {
            const minerData = this.findMiner({ name: this.getCleanName(name), minerId: null })
            const isSellable = minerData ? !!minerData.can_be_sold : false
            const points = this.calcularPuntos(power, bonus, isSellable)
            addMiner({
              name,
              power,
              bonus,
              quantity,
              price: null,
              points,
              pointsPerRlt: null,
              source: 'INVENTORY',
              isLegacy,
              isSet,
              minerId: null
            })
          }

          i += (isInventoryLegacy || isInventorySetBadge) ? 2 : 1
          continue
        }

        // ========== SELL FORMAT (MOBILE) ==========
        const isMobileSell = i + 1 < lines.length &&
          lines[i + 1] === 'Size' &&
          !lines[i].match(/^[a-f0-9]{24}/i) &&
          !lines[i].match(/^(product|In collection|Rating star|set badge|\d+)$/i) &&
          !(i > 0 && lines[i - 1] === 'Set')

        if (isMobileSell) {
          let name = lines[i]
          let power = ''
          let bonus = ''
          let quantity = 1
          let isLegacy = false
          let isSet = false

          if (i > 0) {
            if (lines[i - 1] === 'Rating star') {
              isLegacy = true
              name = `Legacy ${name}`
            } else if (lines[i - 1] === 'set badge') {
              isSet = true
            } else if (lines[i - 1].match(/^(Uncommon|Rare|Epic|Legendary|Unreal)$/i)) {
              name = `${lines[i - 1]} ${name}`
            }
          }

          let foundQuantityLabelMobile = false
          for (let j = i + 2; j < Math.min(i + 15, lines.length); j++) {
            const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
            if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`

            const bonusMatch = lines[j].match(/^([\d.,]+)\s*%$/)
            if (bonusMatch) bonus = bonusMatch[1]

            if (lines[j].match(/^Quantity:?$/i)) {
              foundQuantityLabelMobile = true
            }
            if (foundQuantityLabelMobile && lines[j].match(/^\d+$/)) {
              quantity = parseInt(lines[j])
              foundQuantityLabelMobile = false
            }

            if (lines[j] === 'iconSell Miner') break
          }

          if (name && power && bonus) {
            const minerData = this.findMiner({ name: this.getCleanName(name), minerId: null })
            const isSellable = minerData ? !!minerData.can_be_sold : false
            const points = this.calcularPuntos(power, bonus, isSellable)
            addMiner({
              name,
              power,
              bonus,
              quantity,
              price: null,
              points,
              pointsPerRlt: null,
              source: 'SELL',
              isLegacy,
              isSet,
              minerId: null
            })
          }

          i++
          continue
        }

        // ========== SELL FORMAT (DESKTOP) ==========
        const sellIdMatch = lines[i].match(/^([a-f0-9]{24})([1-5])?(Rating star|set badge)?$/i)
        if (sellIdMatch) {
          const minerId = sellIdMatch[1]
          let name = ''
          let power = ''
          let bonus = ''
          let quantity = 1
          let rarity = ''
          let isLegacy = sellIdMatch[3] && sellIdMatch[3].toLowerCase() === 'rating star'
          let isSet = sellIdMatch[3] && sellIdMatch[3].toLowerCase() === 'set badge'

          if (sellIdMatch[2]) {
            const rarityMap = { '1': 'Uncommon', '2': 'Rare', '3': 'Epic', '4': 'Legendary', '5': 'Unreal' }
            rarity = rarityMap[sellIdMatch[2]] || ''
          }

          let nameIndex = i + 1
          if (nameIndex < lines.length && lines[nameIndex].match(/^(Uncommon|Rare|Epic|Legendary|Unreal)$/i)) {
            if (!rarity) rarity = lines[nameIndex]
            nameIndex++
          }

          if (nameIndex < lines.length) {
            name = lines[nameIndex]

            if (isSet && name.toLowerCase().endsWith(' set')) {
              nameIndex++
              if (nameIndex < lines.length) {
                name = lines[nameIndex]
              }
            }

            if (isLegacy) {
              name = `Legacy ${name}`
            } else if (rarity) {
              name = `${rarity} ${name}`
            }
          }

          let foundQuantityLabelDesktop = false
          let endIdx = nameIndex + 1
          for (let j = nameIndex + 1; j < Math.min(i + 20, lines.length); j++) {
            const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
            if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`

            const bonusMatch = lines[j].match(/^([\d.,]+)\s*%$/)
            if (bonusMatch) bonus = bonusMatch[1]

            if (lines[j].match(/^Quantity:?$/i)) {
              foundQuantityLabelDesktop = true
            }
            if (foundQuantityLabelDesktop && lines[j].match(/^\d+$/)) {
              quantity = parseInt(lines[j])
              foundQuantityLabelDesktop = false
            }

            endIdx = j + 1
            if (lines[j] === 'iconSell Miner') break
          }

          if (name && power && bonus) {
            const minerData = this.findMiner({ name: this.getCleanName(name), minerId })
            const isSellable = minerData ? !!minerData.can_be_sold : false
            const points = this.calcularPuntos(power, bonus, isSellable)
            addMiner({
              name,
              power,
              bonus,
              quantity,
              price: null,
              points,
              pointsPerRlt: null,
              source: 'SELL',
              isLegacy,
              isSet,
              minerId
            })
          }

          i = endIdx - 1
          continue
        }

        // ========== MARKETPLACE FORMAT ==========
        if (lines[i] === 'productset badge') {
          i++
          continue
        }

        const nameLine = lines[i]
        if (!nameLine || nameLine.match(/^\d/) || nameLine.includes('|') ||
            nameLine.toLowerCase().includes('from') || nameLine.toLowerCase().includes('quantity')) {
          i++
          continue
        }

        if (i + 1 < lines.length) {
          const statsLine = lines[i + 1]
          const statsMatch = statsLine.match(/([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)\s*\|\s*([\d.,]+)%/i)

          if (statsMatch) {
            let name = nameLine
            const power = `${statsMatch[1]} ${statsMatch[2]}`
            const bonus = statsMatch[3]

            const isLegacy = name.toLowerCase().startsWith('legacy ')
            const isSet = i > 0 && lines[i - 1] === 'productset badge'

            let price = 0
            let quantity = 1

            for (let j = i + 2; j < Math.min(i + 8, lines.length); j++) {
              const priceMatch = lines[j].match(/^(?:From:?\s*)?([\d.,\s]+)\s*RLT$/i)
              if (priceMatch) price = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'))

              const quantityMatch = lines[j].match(/^Quantity:?\s*(\d+)$/i)
              if (quantityMatch) quantity = parseInt(quantityMatch[1])
            }

            const minerData = this.findMiner({ name: this.getCleanName(name), minerId: null })
            const isSellable = minerData ? !!minerData.can_be_sold : false
            const points = this.calcularPuntos(power, bonus, isSellable)
            const pointsPerRlt = price > 0 ? Math.round(points / price) : 0

            addMiner({
              name,
              power,
              bonus,
              quantity,
              price,
              points,
              pointsPerRlt,
              source: 'MARKETPLACE',
              isLegacy,
              isSet,
              minerId: null
            })

            i += 2
            continue
          }
        }

        i++
      }

      return miners
    },

    calculate() {
      if (!this.inputText.trim()) return

      const newMiners = this.parseInput(this.inputText)

      if (newMiners.length > 0) {
        newMiners.forEach(newMiner => {
          const existing = this.results.find(r =>
            r.name === newMiner.name &&
            r.power === newMiner.power &&
            r.bonus === newMiner.bonus &&
            r.source === newMiner.source
          )
          if (existing) {
            if (newMiner.source === 'INVENTORY' || newMiner.source === 'SELL' || newMiner.source === 'MARKETPLACE') {
              existing.quantity = (existing.quantity || 1) + (newMiner.quantity || 1)
            }
          } else {
            this.results.push(newMiner)
          }
        })
        this.saveToStorage()
        this.inputText = ''
      }
    },

    clearAll() {
      this.results = []
      this.selectedUids = {}
      this.inputText = ''
      localStorage.removeItem('burning_results')
    },

    removeItem(item) {
      const index = this.results.findIndex(r => r.uid === item.uid)
      if (index !== -1) {
        this.results.splice(index, 1)
        if (this.selectedUids[item.uid]) {
          this.$delete(this.selectedUids, item.uid)
        }
        this.saveToStorage()
      }
    },

    isSelected(item) {
      return !!this.selectedUids[item.uid]
    },

    toggleSelect(item) {
      if (this.selectedUids[item.uid]) {
        this.$delete(this.selectedUids, item.uid)
      } else {
        this.$set(this.selectedUids, item.uid, 1)
      }
    },

    incrementQty(item) {
      const current = this.selectedUids[item.uid] || 0
      if (current < item.quantity) {
        this.$set(this.selectedUids, item.uid, current + 1)
      }
    },

    decrementQty(item) {
      const current = this.selectedUids[item.uid] || 0
      if (current > 1) {
        this.$set(this.selectedUids, item.uid, current - 1)
      } else {
        this.$delete(this.selectedUids, item.uid)
      }
    },

    toggleSource(source) {
      const index = this.hiddenSources.indexOf(source)
      if (index === -1) {
        this.hiddenSources.push(source)
      } else {
        this.hiddenSources.splice(index, 1)
      }
    },

    saveToStorage() {
      localStorage.setItem('burning_results', JSON.stringify(this.results))
    },

    loadFromStorage() {
      const saved = localStorage.getItem('burning_results')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          let uidCounter = Date.now()
          this.results = parsed.map(miner => {
            if (!miner.uid) {
              miner.uid = uidCounter++
            }
            return miner
          })
        } catch (e) {
          this.results = []
        }
      }
    },

    formatNumber(num) {
      return num.toLocaleString()
    },

    formatPrice(price) {
      return price % 1 === 0 ? price : price.toFixed(2)
    },

    selectSort(value) {
      this.sortBy = value
      this.sortMenuOpen = false
    },

    resetFilters() {
      this.filterMinPoints = null
      this.filterMinPtsRlt = null
      this.filterMaxPrice = null
      this.filterSellable = 'all'
    },

    getRarityLevel(name) {
      const lowerName = name.toLowerCase()
      if (lowerName.startsWith('unreal ')) return 6
      if (lowerName.startsWith('legendary ')) return 5
      if (lowerName.startsWith('epic ')) return 4
      if (lowerName.startsWith('rare ')) return 3
      if (lowerName.startsWith('uncommon ')) return 2
      if (lowerName.startsWith('legacy ')) return 'legacy'
      return null
    },

    getLevelIcon(name) {
      const level = this.getRarityLevel(name)
      if (!level) return ''
      if (level === 'legacy') {
        return `${this.storagePath}others/legacy.png`
      }
      return `${this.storagePath}others/level_${level}.png`
    },

    getCleanName(name) {
      return name
        .replace(/^(Unreal|Legendary|Epic|Rare|Uncommon|Legacy)\s+/gi, '')
        .trim()
    },

    normalizeName(str) {
      return str
        .toLowerCase()
        .replace(/[\u0027\u2019\u2018\u0060\u00B4\u2032""\-–—\.]/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    },

    extractParenthesesName(str) {
      const match = str.match(/\(([^)]+)\)/)
      return match ? match[1].trim() : null
    },

    normalizeUnicode(str) {
      return str.normalize('NFC').replace(/\s+/g, ' ').trim()
    },

    normalizeApostrophes(str) {
      return str.replace(/[\u0027\u2019\u2018\u0060\u00B4\u2032]/g, "'")
    },

    findMinerCached(item) {
      if (item.minerId && this.minerCache[item.minerId]) {
        return this.minerCache[item.minerId]
      }
      if (item._minerRef !== undefined) return item._minerRef
      const found = this.findMiner(item)
      item._minerRef = found
      return found
    },

    findMiner(item) {
      if (item.minerId) {
        const byId = this.miners.find(m => m.id === item.minerId)
        if (byId) return byId
      }

      const cleanName = this.normalizeUnicode(this.getCleanName(item.name))
      const normalizedClean = this.normalizeName(cleanName)
      const parenthesesName = this.extractParenthesesName(cleanName)
      const normalizedParentheses = parenthesesName ? this.normalizeName(parenthesesName) : null

      let found = this.miners.find(m =>
        this.normalizeApostrophes(this.normalizeUnicode(m.name)).toLowerCase() ===
        this.normalizeApostrophes(cleanName).toLowerCase()
      )
      if (found) return found

      if (parenthesesName) {
        found = this.miners.find(m => {
          const mParentheses = this.extractParenthesesName(this.normalizeUnicode(m.name))
          return mParentheses &&
            this.normalizeApostrophes(mParentheses).toLowerCase() ===
            this.normalizeApostrophes(parenthesesName).toLowerCase()
        })
        if (found) return found
      }

      found = this.miners.find(m => this.normalizeName(m.name) === normalizedClean)
      if (found) return found

      if (normalizedParentheses) {
        found = this.miners.find(m => {
          const mParentheses = this.extractParenthesesName(m.name)
          return mParentheses && this.normalizeName(mParentheses) === normalizedParentheses
        })
        if (found) return found
      }

      found = this.miners.find(m => {
        const mNorm = this.normalizeName(m.name)
        return mNorm.includes(normalizedClean) || normalizedClean.includes(mNorm)
      })
      if (found) return found

      if (normalizedParentheses) {
        found = this.miners.find(m => {
          const mNorm = this.normalizeName(m.name)
          return mNorm.includes(normalizedParentheses) || normalizedParentheses.includes(mNorm)
        })
      }

      return found || null
    },

    getMinerImageUrl(item) {
      const miner = this.findMiner(item)
      if (miner && miner.filename) {
        return `${this.storagePath}miner/${miner.filename}`
      }
      return null
    },

    getAssetUrl(path) {
      return `${this.storagePath}${path}`
    },

    openPreview(imageSrc) {
      this.previewImage = imageSrc
    },

    closePreview() {
      this.previewImage = null
    },

    debouncedFilter(field, event) {
      const val = event.target.value === '' ? null : Number(event.target.value)
      clearTimeout(this._filterTimer)
      this._filterTimer = setTimeout(() => { this[field] = val }, 150)
    },

    getMinerLink(item) {
      const miner = this.findMinerCached(item)
      if (!miner) return null
      const baseId = item.minerId || miner.id
      const rarityLevel = this.getRarityLevel(item.name)
      let linkId = baseId

      if (typeof rarityLevel === 'number' && rarityLevel >= 2) {
        const mergeEntry = this.merges.find(m => m.miner_id === miner.id)
        if (mergeEntry && mergeEntry.merges) {
          const merge = mergeEntry.merges.find(mg => mg.level === rarityLevel)
          if (merge) linkId = merge.merge_id
        }
      }

      if (!linkId) return null
      if (item.source === 'MARKETPLACE') return 'https://rollercoin.com/marketplace/buy/miner/' + linkId
      return 'https://rollercoin.com/marketplace/sell/miner/' + linkId
    },

    handleClickOutside(event) {
      if (this.sortMenuOpen && !event.target.closest('.v2-burn-sort-wrap')) {
        this.sortMenuOpen = false
      }
    }
  }
}
</script>
