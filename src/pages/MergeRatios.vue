<template>
  <div class="merge-ratios-container">
    <h1 class="event-title">Merge Ratios</h1>

    <div class="mr-filters">
      <div class="mr-filter-group">
        <span class="mr-filter-label">Sellable</span>
        <select v-model="filterSellable" class="mr-filter-select">
          <option value="all">All</option>
          <option value="yes">Sellable</option>
          <option value="no">Not Sellable</option>
        </select>
      </div>
      <div class="mr-filter-group">
        <span class="mr-filter-label">Min Power (PH/s)</span>
        <input
          v-model="powerInputRaw"
          type="number"
          class="mr-filter-input"
          placeholder="0"
          min="0"
          @input="onPowerInput"
        />
      </div>
    </div>

    <div v-if="loading" class="mr-loading">
      <img :src="duckGif" alt="loading" />
      <span>Calculating ratios...</span>
    </div>

    <div v-else class="mr-table-wrapper">
      <table class="mr-table">
        <thead>
          <tr>
            <th>#</th>
            <th></th>
            <th style="text-align:left">Miner</th>
            <th>Base Price</th>
            <th>Rarity</th>
            <th>Sellable</th>
            <th @click="toggleSort('power')" :class="{ sorted: sortKey === 'power' }">Power</th>
            <th @click="toggleSort('bonus')" :class="{ sorted: sortKey === 'bonus' }">Bonus</th>
            <th @click="toggleSort('cost')" :class="{ sorted: sortKey === 'cost' }">Cost (RLT)</th>
            <th @click="toggleSort('ratio')" :class="{ sorted: sortKey === 'ratio' }">Ratio</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in displayList" :key="item.key">
            <td class="mr-rank-cell">{{ idx + 1 }}</td>
            <td><img :src="getMinerImg(item)" :alt="item.name" class="mr-miner-img" /></td>
            <td class="mr-name-cell">{{ item.name }}</td>
            <td class="mr-baseprice-cell">
              <input
                type="number"
                class="mr-baseprice-input"
                :value="basePrices[item.minerId] || ''"
                placeholder="0"
                min="0"
                step="0.01"
                @input="onBasePriceInput(item.minerId, $event)"
              />
            </td>
            <td><span :class="'mr-rarity-badge mr-rarity-' + item.rarityClass">{{ item.rarityLabel }}</span></td>
            <td><span :class="item.sellable ? 'mr-sell-yes' : 'mr-sell-no'">{{ item.sellable ? 'Yes' : 'No' }}</span></td>
            <td class="mr-power-cell">{{ formatPower(item.power) }}</td>
            <td class="mr-bonus-cell">{{ item.bonus }}%</td>
            <td class="mr-cost-cell">{{ formatRLT(getCost(item)) }}</td>
            <td class="mr-ratio-cell">{{ formatRatio(getRatio(item)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import '../styles/mergeratios.css'
import mergesData from '../assets/merges.json'
import partsData from '../assets/parts.json'
import duckGif from '../assets/duck.gif'

const RARITY_LEVELS = { 1: 'Common', 2: 'Uncommon', 3: 'Rare', 4: 'Epic', 5: 'Legendary' }
const RARITY_CLASS = { 1: 'common', 2: 'uncommon', 3: 'rare', 4: 'epic', 5: 'legendary' }
const STORAGE = 'https://storage.googleapis.com/rc-calculator-d20ac.firebasestorage.app/'

export default {
  name: 'MergeRatios',
  data() {
    return {
      loading: true,
      duckGif,
      filterSellable: 'all',
      powerInputRaw: '',
      minPower: 0,
      powerDebounce: null,
      basePrices: {},
      basePriceDebounce: null,
      allEntries: [],
      minerMergeData: {},
      partPriceMap: {},
      sortKey: 'ratio',
      sortAsc: true
    }
  },
  computed: {
    filteredList() {
      let list = this.allEntries

      if (this.filterSellable === 'yes') {
        list = list.filter(e => e.sellable)
      } else if (this.filterSellable === 'no') {
        list = list.filter(e => !e.sellable)
      }

      if (this.minPower > 0) {
        list = list.filter(e => e.powerPH >= this.minPower)
      }

      list = [...list].sort((a, b) => {
        let va, vb
        if (this.sortKey === 'cost') {
          va = this.getCost(a)
          vb = this.getCost(b)
        } else if (this.sortKey === 'ratio') {
          va = this.getRatio(a)
          vb = this.getRatio(b)
        } else {
          va = a[this.sortKey]
          vb = b[this.sortKey]
        }
        return this.sortAsc ? va - vb : vb - va
      })

      return list
    },
    displayList() {
      return this.filteredList.slice(0, 100)
    }
  },
  mounted() {
    this.buildPartPriceMap(partsData)
    this.buildEntries()
  },
  methods: {
    buildPartPriceMap(parts) {
      for (const p of parts) {
        const key = `${p.name.toLowerCase()}_${p.rarity.toLowerCase()}`
        this.partPriceMap[key] = p.price
      }
    },

    getPartPrice(type, level) {
      if (!level || level === 0) return 0
      const rarityName = RARITY_LEVELS[level]
      if (!rarityName) return 0
      const key = `${type}_${rarityName.toLowerCase()}`
      return this.partPriceMap[key] || 0
    },

    buildEntries() {
      const entries = []

      for (const miner of mergesData) {
        if (!miner.merges || miner.merges.length === 0) continue

        const sortedMerges = [...miner.merges].sort((a, b) => a.level - b.level)

        // Store merge chain data per miner for dynamic recalculation
        this.minerMergeData[miner.miner_id] = sortedMerges.map(merge => {
          let partsCost = 0
          if (merge.fan_count > 0 && merge.fan_level > 0) {
            partsCost += merge.fan_count * this.getPartPrice('fan', merge.fan_level)
          }
          if (merge.hashboard_count > 0 && merge.hashboard_level > 0) {
            partsCost += merge.hashboard_count * this.getPartPrice('hashboard', merge.hashboard_level)
          }
          if (merge.wire_count > 0 && merge.wire_level > 0) {
            partsCost += merge.wire_count * this.getPartPrice('wire', merge.wire_level)
          }
          return {
            level: merge.level,
            prevCount: merge.required_previous_count || 2,
            partsCost,
            mergeFee: parseFloat(merge.merge_fee) || 0
          }
        })

        for (const merge of sortedMerges) {
          const power = parseFloat(merge.power) || 0
          const powerPH = power / 1e6
          const bonus = parseFloat(merge.bonus) || 0

          entries.push({
            key: `${miner.miner_id}_${merge.level}`,
            minerId: miner.miner_id,
            name: miner.name,
            slug: miner.slug,
            imagePath: miner.image_path,
            sellable: miner.sellable,
            level: merge.level,
            rarityLabel: RARITY_LEVELS[merge.level] || `Lv${merge.level}`,
            rarityClass: RARITY_CLASS[merge.level] || 'common',
            power,
            powerPH,
            bonus
          })
        }
      }

      this.allEntries = entries.filter(e => e.powerPH > 0)
      this.loading = false
    },

    getCostForLevel(minerId, targetLevel) {
      const chain = this.minerMergeData[minerId]
      if (!chain) return 0

      const basePrice = this.basePrices[minerId] || 0
      let prevCost = basePrice

      for (const step of chain) {
        const minersCost = prevCost * step.prevCount
        const totalCost = minersCost + step.partsCost + step.mergeFee
        if (step.level === targetLevel) return totalCost
        prevCost = totalCost
      }
      return 0
    },

    getCost(item) {
      return this.getCostForLevel(item.minerId, item.level)
    },

    getRatio(item) {
      const cost = this.getCost(item)
      return item.powerPH > 0 ? cost / item.powerPH : Infinity
    },

    onBasePriceInput(minerId, event) {
      clearTimeout(this.basePriceDebounce)
      const val = event.target.value
      this.basePriceDebounce = setTimeout(() => {
        this.$set(this.basePrices, minerId, parseFloat(val) || 0)
      }, 400)
    },

    onPowerInput() {
      clearTimeout(this.powerDebounce)
      this.powerDebounce = setTimeout(() => {
        this.minPower = parseFloat(this.powerInputRaw) || 0
      }, 400)
    },

    toggleSort(key) {
      if (this.sortKey === key) {
        this.sortAsc = !this.sortAsc
      } else {
        this.sortKey = key
        this.sortAsc = key === 'ratio'
      }
    },

    getMinerImg(item) {
      if (!item.imagePath) return null
      const filename = item.imagePath.split('/').pop()
      return `${STORAGE}miner/${filename}`
    },

    formatPower(val) {
      const ph = val / 1e6
      if (ph >= 1000) return (ph / 1000).toFixed(2) + ' EH/s'
      return ph.toFixed(2) + ' PH/s'
    },

    formatRLT(val) {
      if (val >= 1000) return val.toFixed(2)
      if (val >= 1) return val.toFixed(4)
      return val.toFixed(6)
    },

    formatRatio(val) {
      if (val === Infinity) return '-'
      if (val >= 1) return val.toFixed(4)
      return val.toFixed(6)
    }
  }
}
</script>
