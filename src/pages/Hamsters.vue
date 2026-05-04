<template>
  <div class="hamsters-container">
    <h1 class="event-title">{{ t.hamsters?.title }}</h1>

    <div
      class="hamsters-scroll-wrapper"
      ref="scrollWrapper"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
    >
      <table class="hamsters-table">
        <thead>
          <tr>
            <th colspan="2">{{ t.hamsters?.name }}</th>
            <th>{{ t.hamsters?.baseStats }}</th>
            <th>{{ t.hamsters?.maxStatsSum }}</th>
            <th>{{ t.hamsters?.extraSurvival }}</th>
            <th>{{ t.hamsters?.baseSurvival }}</th>
            <th
              v-for="exp in expeditions"
              :key="exp.name"
              :class="['exp-header', { 'exp-sorted': sortBy && sortBy.name === exp.name }]"
              @click="toggleSort(exp)"
            >
              <div class="exp-header-content">
                <img
                  v-if="exp.img"
                  :src="getExpImg(exp.img)"
                  :alt="exp.name"
                  class="exp-header-img"
                />
                <span class="exp-header-name">{{ exp.name }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="h in sortedHamsters">
            <tr
              :key="h.name"
              :class="{ 'kitsumi-group': hasMaxStats(h), 'maxstats-hover': maxStatsHover === h.name }"
              @mouseenter="onRowHover(h, true)"
              @mouseleave="onRowHover(h, false)"
            >
              <td class="hamster-img-cell" :rowspan="hasMaxStats(h) ? 2 : 1">
                <img
                  v-if="h.img"
                  :src="getHamsterImg(h.img)"
                  :alt="h.name"
                  class="hamster-img"
                />
              </td>
              <td class="hamster-name" :rowspan="hasMaxStats(h) ? 2 : 1">{{ h.name }}</td>
              <td class="stats-cell" :rowspan="hasMaxStats(h) ? 2 : 1">
                <div>❤️ {{ h.baseStats.hp }}</div>
                <div>💪 {{ h.baseStats.str }}</div>
                <div>🍀 {{ h.baseStats.luck }}</div>
              </td>
              <td class="total-stats-cell">{{ getMaxStatsSum(h) }}</td>
              <td class="extra-survival-cell">
                <span v-if="getSurviveAbility(h) > 0" class="extra-survive-tag">
                  +{{ getSurviveAbility(h) }}%
                </span>
              </td>
              <td class="survival-cell base-surv">
                {{ getBaseSurvivalMax(h).toFixed(2) }}%
              </td>
              <td
                v-for="exp in expeditions"
                :key="exp.name"
                class="survival-cell"
                :class="getSurvivalClass(getExpSurvivalMax(h, exp))"
              >
                {{ getExpSurvivalMax(h, exp).toFixed(2) }}%
              </td>
            </tr>
            <tr
              v-if="hasMaxStats(h)"
              :key="h.name + '-max'"
              :class="['kitsumi-row', 'kitsumi-group', { 'maxstats-hover': maxStatsHover === h.name }]"
              @mouseenter="onRowHover(h, true)"
              @mouseleave="onRowHover(h, false)"
            >
              <td class="total-stats-cell">300</td>
              <td class="extra-survival-cell">
                <span v-if="getSurviveAbility(h) > 0" class="extra-survive-tag">
                  +{{ getSurviveAbility(h) }}%
                </span>
              </td>
              <td class="survival-cell base-surv">
                {{ getSurvivalFromStats(300).toFixed(2) }}%
              </td>
              <td
                v-for="exp in expeditions"
                :key="exp.name + '-kit'"
                class="survival-cell"
                :class="getSurvivalClass(getExpSurvivalFromStats(300, h, exp))"
              >
                {{ getExpSurvivalFromStats(300, h, exp).toFixed(2) }}%
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import '../styles/hamsters.css'
import hamstersData from '../assets/hamsters.json'
import expeditionsData from '../assets/expeditions.json'

const hamsterImages = import.meta.glob('../assets/hamsters/*.gif', { eager: true })
const expImages = import.meta.glob('../assets/expeditions/*.png', { eager: true })

export default {
  name: 'Hamsters',
  inject: ['i18n'],
  data() {
    return {
      hamsters: hamstersData,
      expeditions: expeditionsData,
      maxStatsHover: null,
      sortBy: null,
      dragging: false,
      dragStart: { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 }
    }
  },
  computed: {
    t() {
      return this.i18n.t
    },
    sortedHamsters() {
      if (!this.sortBy) return [...this.hamsters].reverse()
      const exp = this.sortBy
      return [...this.hamsters].sort((a, b) => {
        return this.getExpSurvivalMax(b, exp) - this.getExpSurvivalMax(a, exp)
      })
    }
  },
  methods: {
    getHamsterImg(path) {
      const key = '../assets/' + path
      return hamsterImages[key]?.default || ''
    },
    getExpImg(path) {
      const key = '../assets/' + path
      return expImages[key]?.default || ''
    },
    hasMaxStats(h) {
      return h.name === 'Kitsumi' || h.name === 'Anomaly' || h.name === 'Hammy Hooks'
    },
    getBaseStatsSum(h) {
      return h.baseStats.hp + h.baseStats.str + h.baseStats.luck
    },
    getMaxStatsSum(h) {
      return this.getBaseStatsSum(h) + 49
    },
    getSurviveAbility(h) {
      const ab = h.abilities.find(a => a.type === 'survive')
      return ab ? ab.value : 0
    },
    calcBaseSurvival(statsSum) {
      if (statsSum <= 0) return 20
      if (statsSum >= 300) return 90
      const xs = [0,50,100,149,150,185,200,215,220,244,250,275,300]
      const ys = [20,20.38,24.71,33.66,33.83,43.07,47.75,52.86,54.66,64.77,66.47,77.64,90]
      const b = [-0.00571300,0.03422600,0.15140901,0.16944201,0.17229283,0.30644558,0.32602998,0.34743449,0.38549803,0.30828725,0.29884486,0.50947290]
      const c = [0.00000000,0.00079878,0.00154488,-0.00117686,0.00402768,-0.00019474,0.00150037,-0.00007340,0.00768611,-0.01090323,0.00932950,-0.00090437]
      const d = [0.00000533,0.00000497,-0.00001852,0.00173485,-0.00004021,0.00003767,-0.00003497,0.00051730,-0.00025819,0.00112404,-0.00013645,0.00001206]
      let i = 0
      for (i = 0; i < xs.length - 2; i++) { if (statsSum < xs[i + 1]) break }
      const dx = statsSum - xs[i]
      const result = ys[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx
      return Math.max(20, Math.min(90, result))
    },
    getDifficultyInfluence(difficulty) {
      return 5 - (difficulty - 1) * (10 / 9)
    },
    getSurvivalFromStats(statsSum) {
      return this.calcBaseSurvival(statsSum)
    },
    getBaseSurvivalMax(h) {
      const maxStats = this.getMaxStatsSum(h)
      return this.calcBaseSurvival(maxStats)
    },
    getExpSurvivalFromStats(statsSum, h, exp) {
      const base = this.calcBaseSurvival(statsSum)
      const diff = this.getDifficultyInfluence(exp.difficulty)
      const ability = this.getSurviveAbility(h)
      return Math.max(0, Math.min(100, base + diff + ability))
    },
    getExpSurvivalMax(h, exp) {
      const maxStats = this.getMaxStatsSum(h)
      return this.getExpSurvivalFromStats(maxStats, h, exp)
    },
    getSurvivalClass(value) {
      if (value >= 70) return 'survival-high'
      if (value >= 40) return 'survival-mid'
      return 'survival-low'
    },
    toggleSort(exp) {
      if (this.sortBy && this.sortBy.name === exp.name) {
        this.sortBy = null
      } else {
        this.sortBy = exp
      }
    },
    onRowHover(h, enter) {
      if (this.hasMaxStats(h)) {
        this.maxStatsHover = enter ? h.name : null
      }
    },
    startDrag(e) {
      const el = this.$refs.scrollWrapper
      this.dragging = true
      this.dragStart = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop
      }
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
    },
    onDrag(e) {
      if (!this.dragging) return
      const el = this.$refs.scrollWrapper
      el.scrollLeft = this.dragStart.scrollLeft - (e.clientX - this.dragStart.x)
      el.scrollTop = this.dragStart.scrollTop - (e.clientY - this.dragStart.y)
    },
    stopDrag() {
      if (!this.dragging) return
      this.dragging = false
      const el = this.$refs.scrollWrapper
      el.style.cursor = 'grab'
      el.style.userSelect = ''
    }
  }
}
</script>
