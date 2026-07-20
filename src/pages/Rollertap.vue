<template>
  <div class="v2-rt">
    <!-- Header -->
    <div class="v2-rt-header">
      <h1 class="v2-rt-title">RollerTap</h1>
      <div class="v2-rt-subtitle">{{ t?.rollertap?.help }}</div>
      <div class="v2-rt-cta">
        <b>{{ t?.rollertap?.createAccount }}
          <a href="https://t.me/rollertap_bot?start=7266343545" target="_blank" rel="noopener noreferrer">{{ t?.rollertap?.here }}</a>
        </b>
      </div>
    </div>

    <!-- Total income bar -->
    <div class="v2-rt-income-wrap">
      <div class="v2-rt-income">
        <span class="v2-rt-income-label">{{ t?.rollertap?.coinsPerHour }}</span>
        <span class="v2-rt-income-value">
          <img :src="coinImg" alt="coin" class="v2-rt-coin-lg" />{{ getTotalIncome() }}
        </span>
      </div>
    </div>

    <!-- Cards grid -->
    <div class="v2-rt-grid">
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        class="v2-rt-card"
      >
        <!-- Card top: avatar + name -->
        <div class="v2-rt-card-top">
          <div class="v2-rt-card-avatar">
            <img :src="row.image" :alt="row.name" />
          </div>
          <div class="v2-rt-card-name">{{ row.name }}</div>
        </div>

        <!-- Card body: level + profit -->
        <div class="v2-rt-card-body">
          <div class="v2-rt-level">
            <div class="v2-rt-level-btn" @click="handleLevelChange(idx, Math.max(0, row.currentLevel - 1))">-</div>
            <input
              type="number"
              :min="0"
              :max="row.levels.length"
              :value="row.currentLevel"
              class="v2-rt-level-input"
              @input="handleLevelChange(idx, Math.max(0, Math.min(row.levels.length, Number($event.target.value))))"
              @focus="$event.target.select()"
            />
            <div class="v2-rt-level-btn" @click="handleLevelChange(idx, Math.min(row.levels.length, row.currentLevel + 1))">+</div>
          </div>

          <div class="v2-rt-card-profit">
            {{ t?.rollertap?.profitPerHour }}:
            <span class="v2-rt-coin-val"><img :src="coinImg" alt="coin" class="v2-rt-coin" />{{ handleCoins(row.coinsPerHour) }}</span>
          </div>
        </div>

        <!-- Card bottom: next level (colored) or maxed -->
        <div v-if="row.currentLevel === row.levels.length" class="v2-rt-maxed">
          {{ t?.rollertap?.lastLevelMessage }}
          <div
            v-if="t?.rollertap?.lastLevelAport"
            class="v2-rt-maxed-aport"
            v-html="t?.rollertap?.lastLevelAport"
          />
        </div>

        <div v-else class="v2-rt-next" :style="{ '--roi-color': getNextLevelColor(row) }">
          <div class="v2-rt-next-title">{{ t?.rollertap?.nextLevel }}</div>
          <div class="v2-rt-next-row">
            <span class="v2-rt-coin-val">+<img :src="coinImg" alt="coin" class="v2-rt-coin" />{{ handleCoins(row.levels[row.currentLevel].coinsPerHour) }}</span>
          </div>
          <div class="v2-rt-next-row v2-rt-next-cost">
            {{ t?.rollertap?.cost }}: <img :src="coinImg" alt="coin" class="v2-rt-coin" />{{ handleCoins(row.levels[row.currentLevel].price) }}
          </div>
          <div class="v2-rt-next-row v2-rt-next-roi">
            ROI: {{ handleHours(getRoi(row.levels[row.currentLevel])) }}
          </div>
          <div
            v-if="row.levels[row.currentLevel].simulated"
            class="v2-rt-sim"
            @mouseenter="showSimTooltip($event)"
            @mouseleave="hideSimTooltip()"
          >SIMULATED</div>
        </div>
      </div>
    </div>

    <!-- Uncle's Blessing section -->
    <div class="v2-rt-blessing-divider"></div>
    <div class="v2-rt-grid">
      <div class="v2-rt-card">
        <div class="v2-rt-card-top">
          <div class="v2-rt-card-avatar">
            <img :src="unclesBlessing.image" :alt="unclesBlessing.name" />
          </div>
          <div class="v2-rt-card-name">{{ unclesBlessing.name }}</div>
        </div>
        <div class="v2-rt-card-body">
          <div class="v2-rt-level">
            <div class="v2-rt-level-btn" @click="handleUnclesBlessingLevelChange(Math.max(0, unclesBlessing.currentLevel - 1))">-</div>
            <input
              type="number"
              :min="0"
              :max="unclesBlessing.levels.length"
              :value="unclesBlessing.currentLevel"
              class="v2-rt-level-input"
              @input="handleUnclesBlessingLevelChange(Math.max(0, Math.min(unclesBlessing.levels.length, Number($event.target.value))))"
              @focus="$event.target.select()"
            />
            <div class="v2-rt-level-btn" @click="handleUnclesBlessingLevelChange(Math.min(unclesBlessing.levels.length, unclesBlessing.currentLevel + 1))">+</div>
          </div>
          <div class="v2-rt-card-profit">
            {{ t?.rollertap?.extraIncome }}:
            <span class="v2-rt-coin-val">{{ handleCoins(unclesBlessing.value * 100) }}%</span>
          </div>
        </div>
        <div v-if="unclesBlessing.currentLevel === unclesBlessing.levels.length" class="v2-rt-maxed">
          {{ t?.rollertap?.lastLevelMessage }}
        </div>
        <div v-else class="v2-rt-next" style="--roi-color: var(--v2-secondary)">
          <div class="v2-rt-next-title">{{ t?.rollertap?.nextLevel }}</div>
          <div class="v2-rt-next-row v2-rt-coin-val">+{{ handleCoins(unclesBlessing.levels[unclesBlessing.currentLevel].value * 100) }}%</div>
          <div class="v2-rt-next-row v2-rt-next-cost">
            {{ t?.rollertap?.cost }}: <img :src="coinImg" alt="coin" class="v2-rt-coin" />{{ handleCoins(unclesBlessing.levels[unclesBlessing.currentLevel].price) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Sim tooltip -->
    <div v-if="simTooltipVisible" class="v2-tooltip v2-rt-sim-tooltip" :style="simTooltipStyle">
      {{ t?.rollertap?.simulatedTooltip }}
      <div class="v2-tooltip-arrow-up"></div>
    </div>
  </div>
</template>

<script>
import '../styles/rollertap.css'
import coinImg from '../assets/rollertap/coin.png'
import funnyHamster from '../assets/rollertap/1.png'
import magicHamster from '../assets/rollertap/2.png'
import mightyHamster from '../assets/rollertap/3.png'
import handsomeHamster from '../assets/rollertap/4.png'
import pepeHamster from '../assets/rollertap/5.png'
import devilHamster from '../assets/rollertap/6.png'
import hamdelion from '../assets/rollertap/7.png'
import wizardHamster from '../assets/rollertap/8.png'
import roboHamster from '../assets/rollertap/9.png'
import popeHamster from '../assets/rollertap/10.png'
import banditHamster from '../assets/rollertap/11.png'
import poorHamdes from '../assets/rollertap/12.png'
import hamsterita from '../assets/rollertap/13.png'
import hamJinn from '../assets/rollertap/14.png'
import mrHamster from '../assets/rollertap/15.png'
import bigBossHamster from '../assets/rollertap/16.png'
import uncleBlessing from '../assets/rollertap/19.gif'
import officeHamster from '../assets/rollertap/22.png'
import fifiHamster from '../assets/rollertap/23.png'
import knightHamster from '../assets/rollertap/hamster_knight.png'
import cosmoHamster from '../assets/rollertap/cosmo_hamster.png'
import plumberHamster from '../assets/rollertap/plumber_hamster.png'
import { getInitialHamstersData, getUnclesBlessingData } from './rollertapData.js'

export default {
  name: 'Rollertap',
  inject: ['i18n'],
  data() {
    const defaultUnclesBlessing = getUnclesBlessingData(uncleBlessing)
    return {
      rows: getInitialHamstersData({
        funnyHamster, magicHamster, mightyHamster, handsomeHamster,
        pepeHamster, devilHamster, hamdelion, wizardHamster,
        roboHamster, popeHamster, banditHamster, poorHamdes,
        hamsterita, hamJinn, mrHamster, bigBossHamster,
        officeHamster, fifiHamster, knightHamster, cosmoHamster, plumberHamster
      }),
      coinImg,
      unclesBlessing: defaultUnclesBlessing,
      defaultUnclesBlessingImage: defaultUnclesBlessing.image,
      defaultUnclesBlessingName: defaultUnclesBlessing.name,
      defaultUnclesBlessingLevels: defaultUnclesBlessing.levels,
      simTooltipVisible: false,
      simTooltipStyle: {}
    }
  },
  computed: {
    t() { return this.i18n.t }
  },
  mounted() { this.loadSavedData() },
  methods: {
    showSimTooltip(e) {
      const rect = e.target.getBoundingClientRect()
      this.simTooltipStyle = { top: (rect.top - 8) + 'px', left: (rect.left + rect.width / 2) + 'px' }
      this.simTooltipVisible = true
    },
    hideSimTooltip() { this.simTooltipVisible = false },
    loadSavedData() {
      const savedRows = localStorage.getItem('rollertap_rows')
      if (savedRows) {
        try {
          const loadedRows = JSON.parse(savedRows)
          const defaultRowsById = Object.fromEntries(this.rows.map(r => [r.id, r]))
          const loadedRowsById = Object.fromEntries(loadedRows.map(r => [r.id, r]))
          this.rows = Object.values(defaultRowsById).map(d =>
            loadedRowsById[d.id] ? { ...loadedRowsById[d.id], levels: d.levels, image: d.image, name: d.name } : d
          )
        } catch { /* default */ }
      }
      const savedBlessing = localStorage.getItem('rollertap_unclesBlessing')
      if (savedBlessing) {
        const lb = JSON.parse(savedBlessing)
        this.unclesBlessing = { ...lb, image: this.defaultUnclesBlessingImage, name: this.defaultUnclesBlessingName, levels: this.defaultUnclesBlessingLevels }
      }
    },
    handleLevelChange(idx, value) {
      const newRows = this.rows.map((row, i) =>
        i === idx ? { ...row, currentLevel: value, coinsPerHour: row.levels.slice(0, value).reduce((s, l) => s + l.coinsPerHour, 0) } : row
      )
      this.rows = newRows
      localStorage.setItem('rollertap_rows', JSON.stringify(newRows))
    },
    handleUnclesBlessingLevelChange(value) {
      const updated = { ...this.unclesBlessing, currentLevel: value, value: value > 0 ? this.unclesBlessing.levels[value - 1].value : 0 }
      this.unclesBlessing = updated
      localStorage.setItem('rollertap_unclesBlessing', JSON.stringify(updated))
    },
    getNextLevelColor(row) { return this.getRoiColor(this.getRoi(row.levels[row.currentLevel])) },
    getRoi(level) { return parseFloat((level.price / level.coinsPerHour).toFixed(4)) },
    lerpColorHex(hex1, hex2, t) {
      const c1 = [parseInt(hex1.slice(1,3),16), parseInt(hex1.slice(3,5),16), parseInt(hex1.slice(5,7),16)]
      const c2 = [parseInt(hex2.slice(1,3),16), parseInt(hex2.slice(3,5),16), parseInt(hex2.slice(5,7),16)]
      return `#${c1.map((v,i) => Math.round(v + (c2[i]-v)*t).toString(16).padStart(2,'0')).join('')}`
    },
    getRoiColor(roi, minRoi = 0, redRoi = 8000, maxRoi = 80000) {
      if (roi <= minRoi) return '#247e2d'
      if (roi >= maxRoi) return '#3a184e'
      if (roi <= redRoi) return this.lerpColorHex('#247e2d', '#c62929', (roi-minRoi)/(redRoi-minRoi))
      return this.lerpColorHex('#c62929', '#3a184e', (roi-redRoi)/(maxRoi-redRoi))
    },
    handleCoins(value) {
      if (value == null) return '0'
      const fmt = (n, s) => n.toFixed(3).replace(/\.?0+$/, '') + s
      if (value >= 1e12) return fmt(value/1e12, 't')
      if (value >= 1e9) return fmt(value/1e9, 'b')
      if (value >= 1e6) return fmt(value/1e6, 'm')
      if (value >= 1e3) return fmt(value/1e3, 'k')
      return value.toFixed(3).replace(/\.?0+$/, '')
    },
    handleHours(value) { return value == null ? '0h' : `${value.toFixed(2).replace(/\.?0+$/,'')}h` },
    getTotalIncome() {
      return this.handleCoins(this.rows.reduce((s, r) => s + r.coinsPerHour, 0) * (1 + this.unclesBlessing.value))
    }
  }
}
</script>
