<template>
  <div class="burning-container">
    <!-- Input Section -->
    <div class="burning-input">
      <h1 class="event-title">{{ t.burning?.title }}</h1>
      <p class="help" v-html="t.burning?.subtitle"></p>

      <div class="example-grid">
        <img
          :src="exampleImages.marketplace"
          alt="Marketplace example"
          class="example-thumb"
          @click="openPreview(exampleImages.marketplace)"
        />
        <img
          :src="exampleImages.sell"
          alt="Sell example"
          class="example-thumb"
          @click="openPreview(exampleImages.sell)"
        />
        <img
          :src="exampleImages.inventory"
          alt="Inventory example"
          class="example-thumb"
          @click="openPreview(exampleImages.inventory)"
        />
        <img
          :src="exampleImages.collection"
          alt="Collection example"
          class="example-thumb"
          @click="openPreview(exampleImages.collection)"
        />
      </div>

      <!-- Image Preview Modal -->
      <div v-if="previewImage" class="image-preview-overlay" @click="closePreview">
        <div class="image-preview-container" @click.stop>
          <img :src="previewImage" alt="Preview" class="image-preview" />
          <button class="preview-close" @click="closePreview">&times;</button>
        </div>
      </div>

      <textarea
        v-model="inputText"
        class="burning-textarea"
        :placeholder="t.burning?.placeholder || 'paste data here...'"
      ></textarea>

      <div class="burning-buttons">
        <button class="btn-calculate" @click="calculate">
          {{ t.burning?.calculate || 'CALCULATE' }}
        </button>
        <button class="btn-clear" @click="clearAll">
          {{ t.burning?.clear || 'CLEAR' }}
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div class="burning-results">
      <div v-if="results.length > 0" class="results-controls">
        <!-- Source Filters -->
        <div class="source-filters">
          <button
            v-for="source in availableSources"
            :key="source"
            :class="['filter-btn', 'filter-' + source.toLowerCase(), { hidden: hiddenSources.includes(source) }]"
            @click="toggleSource(source)"
          >
            {{ source }}
          </button>
        </div>
        <!-- Sort Dropdown -->
        <div class="sort-dropdown">
          <button class="sort-button" @click="sortMenuOpen = !sortMenuOpen">
            {{ currentSortLabel }}
            <span :class="['sort-arrow', { open: sortMenuOpen }]">&#9660;</span>
          </button>
          <div v-if="sortMenuOpen" class="sort-menu">
            <div
              v-for="option in sortOptions"
              :key="option.value"
              :class="['sort-option', { active: sortBy === option.value }]"
              @click="selectSort(option.value)"
            >
              {{ option.label }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="filteredResults.length > 0" class="results-grid">
        <div
          v-for="(item, index) in filteredResults"
          :key="index"
          class="result-card"
        >
          <button class="card-delete" @click="removeItem(item)">&times;</button>
          <div :class="['card-source', 'source-' + (item.source || 'marketplace').toLowerCase()]">{{ item.source || 'MARKETPLACE' }}</div>
          <div class="card-header">
            <img src="../assets/symbols/ecoin.svg" alt="ecoin" class="ecoin-icon" />
            <span class="card-points">{{ formatNumber(item.points) }}</span>
          </div>
          <div class="card-body">
            <div class="miner-row">
              <img
                v-if="getMinerImageUrl(item)"
                :src="getMinerImageUrl(item)"
                alt="miner"
                class="miner-img"
              />
              <div class="miner-badges">
                <img
                  v-if="item.isLegacy || getRarityLevel(item.name) === 'legacy'"
                  :src="getAssetUrl('others/legacy.png')"
                  alt="legacy"
                  class="badge-icon"
                />
                <img
                  v-else-if="getRarityLevel(item.name)"
                  :src="getLevelIcon(item.name)"
                  alt="level"
                  class="badge-icon"
                />
                <img
                  v-if="item.isSet"
                  :src="getAssetUrl('others/set.png')"
                  alt="set"
                  class="badge-icon"
                />
              </div>
            </div>
            <span class="card-name">{{ getCleanName(item.name) }}</span>
            <div class="card-stats">
              <span class="card-power">{{ item.power }}</span>
              <span class="card-separator">|</span>
              <span class="card-bonus">{{ item.bonus }}%</span>
            </div>
          </div>
          <div v-if="item.price !== null" class="card-footer">
            <div class="card-price-row">
              <span class="price">{{ formatPrice(item.price) }} RLT</span>
              <span class="separator">|</span>
              <span class="ppr">{{ formatNumber(item.pointsPerRlt) }} PtsxRLT</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <!-- <div class="empty-state-icon">📋</div> -->
        <div class="empty-state-text">
          {{ 
            t.burning?.empty
          }}
        </div>
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

export default {
  name: 'BurningEvent',
  inject: ['i18n'],
  data() {
    return {
      storagePath: 'https://storage.googleapis.com/rc-calculator-d20ac.firebasestorage.app/',
      inputText: '',
      results: [],
      sortBy: 'ppr-desc',
      sortMenuOpen: false,
      previewImage: null,
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
      ]
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
    sortedResults() {
      const sorted = [...this.results]
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
        return !this.hiddenSources.includes(source)
      })
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

    calcularPuntos(poder, bonus) {
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

      let pointsXPh = 1
      let pointsXBonus = 1

      if (poderEnPhs > 10) {
        pointsXPh = 12800
        pointsXBonus = 40
      } else if (poderEnPhs >= 5) {
        pointsXPh = 16000
        pointsXBonus = 50
      } else if (poderEnPhs >= 1) {
        pointsXPh = 20000
        pointsXBonus = 62.5
      } else {
        pointsXPh = 24800
        pointsXBonus = 77.5
      }

      let puntos = poderEnPhs * pointsXPh + (pointsXBonus * valorBonus)
      return Math.ceil(puntos)
    },

    parseInput(text) {
      const miners = []
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

      // Helper to find existing miner with same stats
      const findExisting = (miner) => {
        return miners.find(m =>
          m.name === miner.name &&
          m.power === miner.power &&
          m.bonus === miner.bonus
        )
      }

      // Helper to add miner if not duplicate, or update isSet if needed
      const addMiner = (miner) => {
        const existing = findExisting(miner)
        if (existing) {
          // If new miner has isSet=true and existing doesn't, update it
          if (miner.isSet && !existing.isSet) {
            existing.isSet = true
          }
          // If new miner has minerId and existing doesn't, update it
          if (miner.minerId && !existing.minerId) {
            existing.minerId = miner.minerId
          }
        } else {
          miners.push(miner)
        }
      }

      let i = 0
      while (i < lines.length) {
        // Skip lines that are just category labels (but not productset badge - we handle that specially)
        if ((lines[i].match(/^product\d*$/i) && !lines[i].includes('set badge')) ||
            lines[i] === 'In collection' ||
            lines[i].match(/^productRating star$/i)) {
          i++
          continue
        }

        // ========== COLLECTION FORMAT ==========
        // Detect by "Bonus power +X%" pattern
        const collectionBonusMatch = lines[i].match(/^Bonus power \+([\d.,]+)%$/i)
        if (collectionBonusMatch) {
          let bonus = collectionBonusMatch[1]
          let name = ''
          let power = ''
          let quantity = 1
          let rarity = ''
          let isSet = false
          let isLegacy = false

          // Next line should be hex ID (possibly with "set badge", "Rating star" or rarity number)
          if (i + 1 < lines.length) {
            const idLine = lines[i + 1]

            // Check for set badge or Rating star
            const isSetBadge = idLine.includes('set badge')
            isLegacy = idLine.includes('Rating star')

            // Check if it's a valid ID line (hex chars at start)
            const idMatch = idLine.match(/^[a-f0-9]{24}/i)

            if (idMatch) {
              const minerId = idMatch[0]
              isSet = isSetBadge

              // Check for rarity number AFTER the 24-char hex ID (not the last char of the ID itself)
              const cleanId = idLine.replace('set badge', '').replace('Rating star', '').trim()
              // Only check for rarity if there's content after the 24-char ID
              if (cleanId.length > 24) {
                const afterId = cleanId.slice(24)
                const rarityMatch = afterId.match(/^[1-5]$/)
                if (rarityMatch) {
                  const rarityMap = { '1': 'Uncommon', '2': 'Rare', '3': 'Epic', '4': 'Legendary', '5': 'Unreal' }
                  rarity = rarityMap[rarityMatch[0]] || ''
                }
              }

              // Get name
              let nameIndex = i + 2

              // If it's a set, the first name line is the set name (ends with " Set") - skip to miner name
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

              // Look for Power in following lines
              for (let j = nameIndex + 1; j < Math.min(i + 12, lines.length); j++) {
                const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
                if (powerMatch) {
                  power = `${powerMatch[1]} ${powerMatch[2]}`
                }
                if (lines[j] === 'Miner details') break
              }

              if (name && power) {
                const points = this.calcularPuntos(power, bonus)
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
            }
          }

          i++
          continue
        }

        // ========== INVENTORY FORMAT ==========
        // Detect by "Set" on next line after name OR "Rating star"/"set badge" before name
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
            // If the name ends with " Set", it's the set name - look for the miner name after "Set" line
            if (candidateName.toLowerCase().endsWith(' set') && i + 3 < lines.length) {
              // Structure: set badge -> SetName -> "Set" -> MinerName
              candidateName = lines[i + 3]
              startIndex = i + 3
            }
            name = candidateName
          } else {
            name = lines[i]
            // Check if previous line is a rarity number
            // Only apply if the line before it (i-2) is not a property label that would indicate
            // the number is a value rather than a rarity indicator
            if (i > 0 && lines[i - 1].match(/^[1-5]$/)) {
              const prevPrevLine = i > 1 ? lines[i - 2].toLowerCase() : ''
              // Skip if the number looks like a value from another property
              const isPropertyValue = prevPrevLine.match(/^(power|bonus|quantity|from|price|size|miner details|ph\/s|th\/s|eh\/s|gh\/s|%)[:.]?$/i) ||
                                       prevPrevLine.match(/\d+\s*(ph\/s|th\/s|eh\/s|gh\/s|%)/i)

              if (!isPropertyValue) {
                const rarityMap = { '1': 'Uncommon', '2': 'Rare', '3': 'Epic', '4': 'Legendary', '5': 'Unreal' }
                const rarity = rarityMap[lines[i - 1]]
                if (rarity) name = `${rarity} ${name}`
              }
            }
          }

          // Look for Power, Bonus, Quantity
          for (let j = startIndex + 2; j < Math.min(startIndex + 15, lines.length); j++) {
            const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
            if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`

            const bonusMatch = lines[j].match(/^([\d.,]+)\s*%$/)
            if (bonusMatch) bonus = bonusMatch[1]

            if (lines[j - 1] === 'Quantity:' && lines[j].match(/^\d+$/)) {
              quantity = parseInt(lines[j])
            }

            if (lines[j] === 'Miner details') break
          }

          if (name && power && bonus !== '') {
            const points = this.calcularPuntos(power, bonus)
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

          // Skip extra line if legacy or set badge to avoid duplicate detection
          i += (isInventoryLegacy || isInventorySetBadge) ? 2 : 1
          continue
        }

        // ========== SELL FORMAT (MOBILE) ==========
        // Mobile format: Name first, then Size, then hex ID at the end
        // Skip if previous line is "Set" (this is a set name, not a miner name)
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

          // Check if previous line indicates rarity or special type
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

          // Parse power, bonus, quantity from following lines
          for (let j = i + 2; j < Math.min(i + 15, lines.length); j++) {
            const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
            if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`

            const bonusMatch = lines[j].match(/^([\d.,]+)\s*%$/)
            if (bonusMatch) bonus = bonusMatch[1]

            if (lines[j - 1] === 'Quantity' && lines[j].match(/^\d+$/)) {
              quantity = parseInt(lines[j])
            }

            if (lines[j] === 'iconSell Miner') break
          }

          if (name && power && bonus) {
            const points = this.calcularPuntos(power, bonus)
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
        // Desktop format: Hex ID first, then name
        const sellIdMatch = lines[i].match(/^([a-f0-9]{24,})(Rating star|set badge)?$/i)
        if (sellIdMatch) {
          const minerId = sellIdMatch[1]
          let name = ''
          let power = ''
          let bonus = ''
          let quantity = 1
          let rarity = ''
          let isLegacy = sellIdMatch[2] && sellIdMatch[2].toLowerCase() === 'rating star'
          let isSet = sellIdMatch[2] && sellIdMatch[2].toLowerCase() === 'set badge'

          let nameIndex = i + 1
          if (nameIndex < lines.length && lines[nameIndex].match(/^(Uncommon|Rare|Epic|Legendary|Unreal)$/i)) {
            rarity = lines[nameIndex]
            nameIndex++
          }

          if (nameIndex < lines.length) {
            name = lines[nameIndex]

            // For sets, the first name is the set name (ends with " Set"), skip to miner name
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

          for (let j = nameIndex + 1; j < Math.min(i + 15, lines.length); j++) {
            const powerMatch = lines[j].match(/^([\d.,]+)\s*(Gh\/s|Th\/s|Ph\/s|Eh\/s)$/i)
            if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`

            const bonusMatch = lines[j].match(/^([\d.,]+)\s*%$/)
            if (bonusMatch) bonus = bonusMatch[1]

            if (lines[j - 1] === 'Quantity' && lines[j].match(/^\d+$/)) {
              quantity = parseInt(lines[j])
            }

            if (lines[j] === 'iconSell Miner') break
          }

          if (name && power && bonus) {
            const points = this.calcularPuntos(power, bonus)
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

          i++
          continue
        }

        // ========== MARKETPLACE FORMAT ==========
        // Check if this is a set badge indicator line
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

            // Check if name starts with Legacy
            const isLegacy = name.toLowerCase().startsWith('legacy ')
            // Check if previous line was productset badge
            const isSet = i > 0 && lines[i - 1] === 'productset badge'

            let quantity = 1
            let price = 0

            for (let j = i + 2; j < Math.min(i + 6, lines.length); j++) {
              const qtyMatch = lines[j].match(/Quantity:\s*(\d+)/i)
              if (qtyMatch) quantity = parseInt(qtyMatch[1])

              const priceMatch = lines[j].match(/^(?:From:\s*)?([\d.,\s]+)\s*RLT$/i)
              if (priceMatch) price = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'))
            }

            const points = this.calcularPuntos(power, bonus)
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
        // Filter out duplicates against existing results
        const uniqueMiners = newMiners.filter(newMiner => {
          return !this.results.some(existing =>
            existing.name === newMiner.name &&
            existing.power === newMiner.power &&
            existing.bonus === newMiner.bonus
          )
        })

        if (uniqueMiners.length > 0) {
          this.results = [...this.results, ...uniqueMiners]
          this.saveToStorage()
        }
        this.inputText = ''
      }
    },

    clearAll() {
      this.results = []
      this.inputText = ''
      localStorage.removeItem('burning_results')
    },

    removeItem(item) {
      const index = this.results.findIndex(r =>
        r.name === item.name &&
        r.power === item.power &&
        r.bonus === item.bonus &&
        r.source === item.source
      )
      if (index !== -1) {
        this.results.splice(index, 1)
        this.saveToStorage()
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

    openPreview(imageSrc) {
      // console.log(this.results)
      this.previewImage = imageSrc
      document.body.style.overflow = 'hidden'
    },

    closePreview() {
      this.previewImage = null
      document.body.style.overflow = ''
    },

    saveToStorage() {
      localStorage.setItem('burning_results', JSON.stringify(this.results))
    },

    loadFromStorage() {
      const saved = localStorage.getItem('burning_results')
      if (saved) {
        try {
          this.results = JSON.parse(saved)
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

    handleClickOutside(event) {
      if (this.sortMenuOpen && !event.target.closest('.sort-dropdown')) {
        this.sortMenuOpen = false
      }
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
        // Normalize all apostrophe/quote variants and punctuation to underscore
        // Apostrophes: U+0027 ' U+2019 ' U+2018 ' U+0060 ` U+00B4 ´ U+2032 ′
        .replace(/[\u0027\u2019\u2018\u0060\u00B4\u2032""\-–—\.]/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    },

    // Extract name from parentheses if present, e.g. "青火龙 (Azure Dragon)" -> "Azure Dragon"
    extractParenthesesName(str) {
      const match = str.match(/\(([^)]+)\)/)
      return match ? match[1].trim() : null
    },

    // Normalize unicode characters for comparison
    normalizeUnicode(str) {
      return str.normalize('NFC').replace(/\s+/g, ' ').trim()
    },

    // Normalize apostrophes and quotes to standard form for comparison
    normalizeApostrophes(str) {
      // U+0027 ' apostrophe, U+2019 ' right single quote, U+2018 ' left single quote
      // U+0060 ` grave, U+00B4 ´ acute, U+2032 ′ prime
      return str.replace(/[\u0027\u2019\u2018\u0060\u00B4\u2032]/g, "'")
    },

    findMiner(item) {
      // Try by ID first
      if (item.minerId) {
        const byId = this.miners.find(m => m.id === item.minerId)
        if (byId) return byId
      }

      // Try by name (clean name without rarity prefix)
      const cleanName = this.normalizeUnicode(this.getCleanName(item.name))

      // Debug log for troubleshooting
      // console.log('findMiner:', {
      //   original: item.name,
      //   clean: cleanName,
      //   normalized: this.normalizeName(cleanName),
      //   normalizedApostrophe: this.normalizeApostrophes(cleanName)
      // })
      const normalizedClean = this.normalizeName(cleanName)
      const parenthesesName = this.extractParenthesesName(cleanName)
      const normalizedParentheses = parenthesesName ? this.normalizeName(parenthesesName) : null

      // Exact match on full name (with unicode and apostrophe normalization)
      let found = this.miners.find(m =>
        this.normalizeApostrophes(this.normalizeUnicode(m.name)).toLowerCase() ===
        this.normalizeApostrophes(cleanName).toLowerCase()
      )
      if (found) return found

      // Exact match on name inside parentheses (both directions)
      if (parenthesesName) {
        found = this.miners.find(m => {
          const mParentheses = this.extractParenthesesName(this.normalizeUnicode(m.name))
          return mParentheses &&
            this.normalizeApostrophes(mParentheses).toLowerCase() ===
            this.normalizeApostrophes(parenthesesName).toLowerCase()
        })
        if (found) return found
      }

      // Normalized match
      found = this.miners.find(m => this.normalizeName(m.name) === normalizedClean)
      if (found) return found

      // Normalized match on parentheses content
      if (normalizedParentheses) {
        found = this.miners.find(m => {
          const mParentheses = this.extractParenthesesName(m.name)
          return mParentheses && this.normalizeName(mParentheses) === normalizedParentheses
        })
        if (found) return found
      }

      // Partial match (contains)
      found = this.miners.find(m => {
        const mNorm = this.normalizeName(m.name)
        return mNorm.includes(normalizedClean) || normalizedClean.includes(mNorm)
      })
      if (found) return found

      // Partial match on parentheses content
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
    }
  }
}
</script>
