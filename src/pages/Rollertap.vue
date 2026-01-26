<template>
  <div class="rollertap-container">
    <div class='help'>
      {{ t?.rollertap?.help }}
      <br />
      <b>{{ t?.rollertap?.createAccount }} <a href="https://t.me/rollertap_bot?start=7266343545" target="_blank" rel="noopener noreferrer">{{ t?.rollertap?.here }}</a></b>
    </div>
    <div class="resume">
      <div class="resume-profit">
        <span> {{ t?.rollertap?.coinsPerHour }}
          <span class="coin"> 🪙{{ getTotalIncome() }}</span>
        </span>
      </div>
    </div>
    <div class="card-container">
      <div v-for="(row, idx) in rows" :key="idx" class="card">
        <img :src="row.image" :alt="row.name" class="card-image" />
        <div class="card-title">{{ row.name }}</div>
        <div class="card-level">
          <div
            class="level-btn level-down"
            aria-label="Bajar nivel"
            @click="handleLevelChange(idx, Math.max(0, row.currentLevel - 1))"
            style="cursor: pointer"
          >
            ▼
          </div>
          <input
            type="number"
            name='level'
            :min="0"
            :max="row.levels.length"
            :value="row.currentLevel"
            class="level-input"
            @input="handleLevelChange(idx, Math.max(0, Math.min(row.levels.length, Number($event.target.value))))"
            @focus="$event.target.select()"
          />
          <div
            class="level-btn level-up"
            aria-label="Subir nivel"
            @click="handleLevelChange(idx, Math.min(row.levels.length, row.currentLevel + 1))"
            style="cursor: pointer"
          >
            ▲
          </div>
        </div>
        <div class="card-profit">
          {{ t?.rollertap?.profitPerHour }}: <span class="coin">🪙{{ handleCoins(row.coinsPerHour) }}</span>
        </div>
        <div v-if="row.currentLevel === row.levels.length" class="last-level-message">
          {{ t?.rollertap?.lastLevelMessage }}
          <br />
          <div
            class="aport-message"
            v-html="t?.rollertap?.lastLevelAport"
          />
        </div>
        <div v-else class="next-level" :style="{ backgroundColor: getNextLevelColor(row) }">
          <div class="level-title">{{ t?.rollertap?.nextLevel }}</div>
          <div class="coin">+🪙{{ handleCoins(row.levels[row.currentLevel].coinsPerHour) }}</div>
          <div class="cost">{{ t?.rollertap?.cost }}: 🪙{{ handleCoins(row.levels[row.currentLevel].price) }}</div>
          <div class="roi">{{ t?.rollertap?.roiInHours }}: {{ handleHours(getRoi(row.levels[row.currentLevel])) }}</div>
        </div>
      </div>
    </div>
    <div class='card-container' style="border-top: 2px solid var(--secondary); margin-top: 20px; padding-top: 20px; margin-bottom: 40px">
      <div class="card">
        <img :src="unclesBlessing.image" :alt="unclesBlessing.name" class="card-image" />
        <div class="card-title">{{ unclesBlessing.name }}</div>
        <div class="card-level">
          <div
            class="level-btn level-down"
            aria-label="Bajar nivel"
            @click="handleUnclesBlessingLevelChange(Math.max(0, unclesBlessing.currentLevel - 1))"
            style="cursor: pointer"
          >
            ▼
          </div>
          <input
            type="number"
            name='level'
            :min="0"
            :max="unclesBlessing.levels.length"
            :value="unclesBlessing.currentLevel"
            class="level-input"
            @input="handleUnclesBlessingLevelChange(Math.max(0, Math.min(unclesBlessing.levels.length, Number($event.target.value))))"
            @focus="$event.target.select()"
          />
          <div
            class="level-btn level-up"
            aria-label="Subir nivel"
            @click="handleUnclesBlessingLevelChange(Math.min(unclesBlessing.levels.length, unclesBlessing.currentLevel + 1))"
            style="cursor: pointer"
          >
            ▲
          </div>
        </div>
        <div class="card-profit">
          {{ t?.rollertap?.extraIncome }}: <span class="coin">{{ handleCoins(unclesBlessing.value * 100) }}%</span>
        </div>
        <div v-if="unclesBlessing.currentLevel === unclesBlessing.levels.length" class="last-level-message">
          {{ t?.rollertap?.lastLevelMessage }}
        </div>
        <div v-else class="next-level" style="background-color: var(--secondary)">
          <div class="level-title">{{ t?.rollertap?.nextLevel }}</div>
          <div class="coin">+{{ handleCoins(unclesBlessing.levels[unclesBlessing.currentLevel].value * 100) }}%</div>
          <div class="cost">{{ t?.rollertap?.cost }}: 🪙{{ handleCoins(unclesBlessing.levels[unclesBlessing.currentLevel].price) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// NOTA: Este archivo contiene la misma estructura de datos que Rollertap.tsx
// Los datos de hamsters se importarán desde el archivo TypeScript original
// Para mantener este archivo más pequeño y manejable

import '../styles/rollertap.css'
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

// Importar los datos desde el archivo React original para evitar duplicación
// Los datos están definidos en el archivo TypeScript y se copian aquí
import { getInitialHamstersData, getUnclesBlessingData } from './rollertapData.js'

export default {
  name: 'Rollertap',
  inject: ['i18n'],
  data() {
    const defaultUnclesBlessing = getUnclesBlessingData(uncleBlessing)
    return {
      rows: getInitialHamstersData({
        funnyHamster,
        magicHamster,
        mightyHamster,
        handsomeHamster,
        pepeHamster,
        devilHamster,
        hamdelion,
        wizardHamster,
        roboHamster,
        popeHamster,
        banditHamster,
        poorHamdes,
        hamsterita,
        hamJinn,
        mrHamster,
        bigBossHamster,
        officeHamster,
        fifiHamster,
        knightHamster,
        cosmoHamster
      }),
      unclesBlessing: defaultUnclesBlessing,
      defaultUnclesBlessingImage: defaultUnclesBlessing.image,
      defaultUnclesBlessingName: defaultUnclesBlessing.name,
      defaultUnclesBlessingLevels: defaultUnclesBlessing.levels
    }
  },
  computed: {
    t() {
      return this.i18n.t
    }
  },
  mounted() {
    this.loadSavedData()
  },
  methods: {
    loadSavedData() {
      const savedRows = localStorage.getItem('rollertap_rows')
      if (savedRows) {
        try {
          const loadedRows = JSON.parse(savedRows)
          const defaultRowsById = Object.fromEntries(this.rows.map(r => [r.id, r]))
          const loadedRowsById = Object.fromEntries(loadedRows.map(r => [r.id, r]))
          const mergedRows = Object.values(defaultRowsById).map(defaultRow => {
            if (loadedRowsById[defaultRow.id]) {
              return {
                ...loadedRowsById[defaultRow.id],
                levels: defaultRow.levels,
                image: defaultRow.image,
                name: defaultRow.name
              }
            }
            return defaultRow
          })
          this.rows = mergedRows
        } catch {
          // Si hay error, usar por defecto
        }
      }

      const savedBlessing = localStorage.getItem('rollertap_unclesBlessing')
      if (savedBlessing) {
        const loadedBlessing = JSON.parse(savedBlessing)
        this.unclesBlessing = {
          ...loadedBlessing,
          image: this.defaultUnclesBlessingImage,
          name: this.defaultUnclesBlessingName,
          levels: this.defaultUnclesBlessingLevels
        }
      }
    },
    handleLevelChange(idx, value) {
      const newRows = this.rows.map((row, i) =>
        i === idx
          ? {
              ...row,
              currentLevel: value,
              coinsPerHour: row.levels
                .slice(0, value)
                .reduce((sum, lvl) => sum + lvl.coinsPerHour, 0)
            }
          : row
      )
      this.rows = newRows
      localStorage.setItem('rollertap_rows', JSON.stringify(newRows))
    },
    handleUnclesBlessingLevelChange(value) {
      const newLevel = value
      const updated = {
        ...this.unclesBlessing,
        currentLevel: newLevel,
        value: newLevel > 0 ? this.unclesBlessing.levels[newLevel - 1].value : 0
      }
      this.unclesBlessing = updated
      localStorage.setItem('rollertap_unclesBlessing', JSON.stringify(updated))
    },
    getNextLevelColor(row) {
      const color = this.getRoiColor(this.getRoi(row.levels[row.currentLevel]))
      return color
    },
    getRoi(level) {
      return parseFloat((level.price / level.coinsPerHour).toFixed(4))
    },
    lerpColorHex(hex1, hex2, t) {
      const c1 = [
        parseInt(hex1.slice(1, 3), 16),
        parseInt(hex1.slice(3, 5), 16),
        parseInt(hex1.slice(5, 7), 16)
      ]
      const c2 = [
        parseInt(hex2.slice(1, 3), 16),
        parseInt(hex2.slice(3, 5), 16),
        parseInt(hex2.slice(5, 7), 16)
      ]
      const lerped = c1.map((v, i) => Math.round(v + (c2[i] - v) * t))
      return `#${lerped.map(c => c.toString(16).padStart(2, '0')).join('')}`
    },
    getRoiColor(roi, minRoi = 0, redRoi = 8000, maxRoi = 80000) {
      if (roi <= minRoi) return '#247e2d'
      if (roi >= maxRoi) return '#3a184e'
      if (roi <= redRoi) {
        const t = (roi - minRoi) / (redRoi - minRoi)
        return this.lerpColorHex('#247e2d', '#c62929ff', t)
      } else {
        const t = (roi - redRoi) / (maxRoi - redRoi)
        return this.lerpColorHex('#c62929ff', '#3a184e', t)
      }
    },
    handleCoins(value) {
      if (value === null || value === undefined) return '0'
      const format = (num, suffix) =>
        num.toFixed(3).replace(/\.?0+$/, '') + suffix
      if (value >= 1e12) return format(value / 1e12, 't')
      if (value >= 1e9) return format(value / 1e9, 'b')
      if (value >= 1e6) return format(value / 1e6, 'm')
      if (value >= 1e3) return format(value / 1e3, 'k')
      return value.toFixed(3).replace(/\.?0+$/, '')
    },
    handleHours(value) {
      if (value === null || value === undefined) return '0h'
      return `${value.toFixed(2).replace(/\.?0+$/, '')}h`
    },
    getTotalIncome() {
      return this.handleCoins(this.rows.reduce((sum, lvl) => sum + lvl.coinsPerHour, 0) * (1 + this.unclesBlessing.value))
    }
  }
}
</script>
