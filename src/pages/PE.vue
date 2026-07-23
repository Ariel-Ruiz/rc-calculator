<template>
  <div class="v2-pe">
    <!-- LEFT PANEL -->
    <div class="v2-pe-info">
      <div v-if="bannerImg" class="v2-pe-banner">
        <img :src="bannerImg" alt="" class="v2-pe-banner-img" />
        <div class="v2-pe-banner-overlay">
          <h1 class="v2-pe-title">{{ PeData.event.event.title.en }}</h1>
          <div class="v2-pe-subtitle">{{ t.pe?.progression_event }}</div>
        </div>
      </div>
      <div v-else class="v2-pe-banner-placeholder">
        <h1 class="v2-pe-title">{{ PeData.event.event.title.en }}</h1>
        <div class="v2-pe-subtitle">{{ t.pe?.progression_event }}</div>
      </div>

      <div class="v2-pe-score">
        <div :class="['v2-pe-score-num', getScoreColorClass()]">{{ rentabilityScore }}</div>
        <div class="v2-pe-score-max">/10</div>
      </div>
      <div class="v2-pe-score-label">{{ t.pe?.rentability_punctuation }}</div>

      <div class="v2-pe-ratio-wrap">
        <div class="v2-pe-ratio-badge">Ratio: {{ rentabilityRatio }}</div>
        <div class="v2-tooltip v2-pe-ratio-tooltip">
          {{ t.pe?.ratio_line1 || 'Cost / Reward ratio.' }}<br/>
          {{ t.pe?.ratio_line2 || 'Lower is better.' }}<br/><br/>
          {{ t.pe?.ratio_excellent || 'Below 0.3: excellent' }}<br/>
          {{ t.pe?.ratio_bad || 'Above 1.0: not worth it' }}
          <div class="v2-tooltip-arrow-down"></div>
        </div>
      </div>

      <div v-if="isEventActive" class="v2-pe-deadline active">
        {{ t.pe?.ends_on }} {{ eventEndDate }} 15:00 UTC
      </div>
      <div v-else class="v2-pe-deadline ended">
        {{ t.pe?.the_event_ended }}
      </div>

      <table class="v2-pe-tasks">
        <tbody>
          <tr>
            <td class="v2-pe-task-name">{{ t.pe?.multiplier }}</td>
            <td class="v2-pe-task-val">x{{ PeData.multiplier }} {{ t.pe?.per }} 1 RLT</td>
          </tr>
          <tr v-for="task in PeData.tasks" :key="task.type">
            <td class="v2-pe-task-name">{{ t.pe?.[task.type] }}</td>
            <td class="v2-pe-task-val">{{ task.xp_reward }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- RIGHT PANEL -->
    <div class="v2-pe-details">
      <!-- Calculator -->
      <div class="v2-pe-calc">
        <div class="v2-pe-calc-hints">
          <label class="v2-pe-hint-green">{{ t.pe?.recomended_multiplier }}</label>
          <label class="v2-pe-hint-gold">{{ t.pe?.editable_field }}</label>
        </div>
        <div class="v2-pe-calc-scroll"><div class="v2-pe-calc-grid">
          <div class="v2-pe-calc-col v2-pe-col-sm">
            <label class="v2-label">MULT</label>
            <select
              :class="['v2-input', { 'v2-pe-green': isRecomended(calcConfig.multiplier) }]"
              :value="calcConfig.multiplier"
              @change="handleCalc('multiplier', Number($event.target.value))"
            >
              <option v-for="m in multipliers" :key="m" :class="{ 'v2-pe-green': isRecomended(m) }" :value="m">x{{ m }}</option>
            </select>
          </div>
          <div class="v2-pe-calc-col v2-pe-col-sm">
            <label class="v2-label">{{ t.pe?.discount }}</label>
            <select class="v2-input" :value="calcConfig.discount" @change="handleCalc('discount', Number($event.target.value))">
              <option v-for="d in discounts" :key="d" :value="d">{{ d }}%</option>
            </select>
          </div>
          <div class="v2-pe-calc-col">
            <label class="v2-label" style="color: var(--v2-coin)">{{ t.pe?.rlt_to_buy }}</label>
            <input class="v2-input" style="color: var(--v2-coin)" type="number" :value="calcConfig.buy" @input="handleCalc('buy', Number($event.target.value))" />
          </div>
          <div class="v2-pe-calc-col">
            <label class="v2-label">{{ t.pe?.rlt_with_discount }}</label>
            <input class="v2-input" style="color: var(--v2-text-muted)" type="number" :value="calcConfig.buyFinal" disabled />
          </div>
          <div class="v2-pe-calc-col v2-pe-col-sm">
            <label class="v2-label">{{ t.pe?.boxes }}</label>
            <select class="v2-input" :value="calcConfig.boxes" @change="handleCalc('boxes', Number($event.target.value))">
              <option v-for="b in boxesPrices" :key="b" :value="b">{{ b }} RLT</option>
            </select>
          </div>
        </div></div>
      </div>

      <!-- Rewards -->
      <div class="v2-pe-rewards-wrap">
        <table class="v2-pe-rewards">
          <thead>
            <tr>
              <th>LVL</th>
              <th>TOTAL</th>
              <th>{{ t.pe?.points }}</th>
              <th>{{ t.pe?.reward }}</th>
              <th></th>
              <th>{{ t.pe?.boxes }}</th>
              <th>MARKET</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(reward, idx) in PeData.event.rewards" :key="idx">
              <td class="v2-pe-r-lvl">{{ reward.required_level }}</td>
              <td>{{ PeData.event.levels_config[reward.required_level - 1]?.required_xp }}</td>
              <td>{{ PeData.event.levels_config[reward.required_level - 1]?.level_xp }}</td>
              <td class="v2-pe-r-name">
                {{ getRewardName(reward) }}
                <br/><span class="v2-pe-r-sub">{{ getRewardSubname(reward) }}</span>
              </td>
              <td class="v2-pe-r-img" :style="{ backgroundImage: `url(${getRewardImage(reward)})` }">
                <img v-if="reward.item?.level > 0 && reward.type == 'miner'" :src="stPath + `others/level_${reward.item.level + 1}.png`" class="v2-pe-r-lvl-badge" />
              </td>
              <td class="v2-pe-r-boxes">{{ getRewardBoxes(PeData.event.levels_config[reward.required_level - 1]?.required_xp) }} {{ t.pe?.boxes }}</td>
              <td class="v2-pe-r-market">{{ getRewardMarket(PeData.event.levels_config[reward.required_level - 1]?.required_xp) }} RLT</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import '../styles/pe.css'
import moment from 'moment-timezone'
import PeData from '../assets/progression.json'
// Banner mode: 'banner' | 'bg' | '' (none)
const BANNER_MODE = 'banner'

export default {
  name: 'PE',
  inject: ['i18n'],
  data() {
    const boxesPrices = [1.99, 3.99, 11.99, 29.99]
    const discounts = [0, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
    const maxMultiplier = PeData.event.event.max_multiplier / 100
    const mult = []
    for (let i = 1; i <= maxMultiplier; i++) mult.push(i)

    return {
      stPath: 'https://storage.googleapis.com/rc-calculator-d20ac.firebasestorage.app/',
      PeData,
      bannerMode: BANNER_MODE,
      bannerImg: null,
      calcConfig: { multiplier: 1, discount: 0, buy: 0, buyFinal: 0, boxes: 1.99 },
      rentabilityScore: 0,
      rentabilityRatio: 0,
      recomendedMultiplier: [],
      boxesPrices,
      discounts,
      multipliers: mult,
      taskPoints: {
        boxes: (PeData.tasks.find(t => t.type == 'spend_rlt'))?.xp_reward || 1000,
        marketplace: (PeData.tasks.find(t => t.type == 'marketplace'))?.xp_reward || 1000
      }
    }
  },
  computed: {
    t() { return this.i18n.t },
    isEventActive() { return moment().isBefore(moment(PeData.event.event.end_date).set({ hour: 15, minute: 0, second: 0 })) },
    eventEndDate() { return moment(PeData.event.event.end_date).format('DD/MM/YYYY') }
  },
  mounted() {
    moment.tz.setDefault("UTC")
    this.calcRecomend()
    this.loadBanner()
  },
  methods: {
    async loadBanner() {
      const files = {
        banner: () => import('../assets/icons/current-progression-banner.gif'),
        bg: () => import('../assets/icons/current-progression-bg.png')
      }
      if (!this.bannerMode || !files[this.bannerMode]) return
      try {
        const mod = await files[this.bannerMode]()
        this.bannerImg = mod.default
      } catch { /* file doesn't exist, no banner */ }
    },
    isRecomended(multiplier) { return this.recomendedMultiplier.includes(multiplier) },
    getScoreColorClass() {
      if (this.rentabilityScore == 10) return 'v2-c-accent'
      if (this.rentabilityScore >= 7) return 'v2-c-success'
      if (this.rentabilityScore >= 4) return 'v2-c-warning'
      return 'v2-c-danger'
    },
    calcRecomend() {
      let phXRLT = 0.04, rewardsXRLT = 0
      for (let reward of PeData.event.rewards) {
        switch (reward.type) {
          case 'money':
            switch (reward.currency) { case 'RLT': rewardsXRLT += reward.amount / 1e6; break; case 'RST': rewardsXRLT += reward.amount / 4e8; break }
            continue
          case 'miner': if (reward.item.power >= 1e6) rewardsXRLT += (reward.item.power / 1e6) * phXRLT; continue
        }
      }
      let rltToBuy = rewardsXRLT * 0.37
      let rawMultiplier = (rltToBuy * PeData.multiplier) + 1
      let closest = this.multipliers.reduce((p, c) => Math.abs(c - rawMultiplier) < Math.abs(p - rawMultiplier) ? c : p)
      this.recomendedMultiplier = [closest]
      let buy = ((closest - 1) / PeData.multiplier) | 0
      let buyFinal = Math.round((buy - (buy * (this.calcConfig.discount / 100))) * 100) / 100
      this.calcConfig = { ...this.calcConfig, buy, buyFinal, multiplier: closest }
      let ratio = buy / rewardsXRLT
      this.rentabilityRatio = ratio.toFixed(2)
      if (ratio <= 0.3) this.rentabilityScore = 10
      else if (ratio <= 0.35) this.rentabilityScore = 9.5
      else if (ratio <= 0.4) this.rentabilityScore = 9
      else if (ratio <= 0.45) this.rentabilityScore = 8.5
      else if (ratio <= 0.5) this.rentabilityScore = 8
      else if (ratio <= 0.55) this.rentabilityScore = 7.5
      else if (ratio <= 0.6) this.rentabilityScore = 7
      else if (ratio <= 0.7) this.rentabilityScore = 6.5
      else if (ratio <= 0.75) this.rentabilityScore = 6
      else if (ratio <= 0.8) this.rentabilityScore = 5.5
      else if (ratio <= 0.85) this.rentabilityScore = 5
      else if (ratio <= 0.9) this.rentabilityScore = 4.5
      else if (ratio <= 0.95) this.rentabilityScore = 4
      else if (ratio <= 1.0) this.rentabilityScore = 3.5
      else if (ratio <= 1.1) this.rentabilityScore = 3
      else if (ratio <= 1.3) this.rentabilityScore = 2.5
      else if (ratio <= 1.5) this.rentabilityScore = 2
      else if (ratio <= 1.8) this.rentabilityScore = 1.5
      else if (ratio <= 2.2) this.rentabilityScore = 1
      else this.rentabilityScore = 0
    },
    handleCalc(param, value) {
      let { buy, buyFinal, multiplier } = this.calcConfig
      if (param == 'discount') buyFinal = Math.round((buy - (buy * (value / 100))) * 100) / 100
      if (param == 'buy') { buyFinal = Math.round((value - (value * (this.calcConfig.discount / 100))) * 100) / 100; multiplier = parseFloat(((value * PeData.multiplier) + 1).toFixed(1)) }
      if (param == 'multiplier' || multiplier != this.calcConfig.multiplier) {
        if (multiplier > 100) multiplier = 100
        let newMult = this.multipliers.filter(m => Number.isInteger(m))
        if (!this.multipliers.some(m => m == multiplier)) newMult.unshift(multiplier)
        this.multipliers = newMult
        if (param == 'multiplier') { buy = (value - 1) / PeData.multiplier; buyFinal = Math.round((buy - (buy * (this.calcConfig.discount / 100))) * 100) / 100 }
      }
      this.calcConfig = { ...this.calcConfig, buy, buyFinal, multiplier, [param]: value }
    },
    getRewardBoxes(xp) { return Math.ceil(xp / ((this.taskPoints.boxes * this.calcConfig.boxes) * this.calcConfig.multiplier)) },
    getRewardMarket(xp) { return Math.ceil(xp / (this.taskPoints.marketplace * this.calcConfig.multiplier)) },
    getRewardImage(r) {
      let f = ''
      if (r?.type == 'utility_item' && ['Ancient key','Old key','Basic key','Forbidden key','GemStone'].includes(r?.item?.name?.en)) return this.stPath + `others/${r.item_id}.png`
      switch (r.type) {
        case 'money': f = `others/reward_${r.currency.toLowerCase()}.png`; break
        case 'season_pass_xp': f = 'others/season_pass_xp.png'; break
        case 'power': f = 'others/reward_power.png'; break
        case 'utility_item': f = `others/${r.item_id}.gif`; break
        case 'loot_box': case 'mystery_box': f = `box/${r.item_id}.png`; break
        case 'battery': case 'trophy': case 'hat': f = `others/${r.item_id}.png`; break
        case 'mutation_component': f = `mutation_component/${r.item_id}.png`; break
        case 'rack': f = `rack/${r.item_id}.png`; break
        case 'miner': f = `miner/${r.item.filename}.gif`; break
      }
      return this.stPath + f
    },
    getRewardValue(r) {
      let f = new Intl.NumberFormat('De')
      switch (r.type) { case 'money': return `${r.amount / 1e6} ${r.currency}`; case 'power': return `${f.format(r.amount)} Gh/s`; case 'miner': return `${f.format(r.item.power)} Gh/s` }
      return r.amount
    },
    getRewardName(r) {
      switch (r.type) {
        case 'money': return this.getRewardValue(r); case 'season_pass_xp': return this.getRewardValue(r) + ' XP'; case 'power': return this.getRewardValue(r)
        case 'utility_item': case 'mutation_component': return (r.amount > 1 ? r.amount : '') + ' ' + r.item.name.en
        case 'loot_box': case 'mystery_box': return r.item.title.en; case 'battery': return r.title.en
        case 'trophy': case 'hat': return r.item?.title?.en || r.item?.name?.en; case 'rack': case 'miner': return r.item.name.en
      }
    },
    getRewardSubname(r) {
      switch (r.type) {
        case 'rack': return r.item.bonus ? (r.item.bonus / 100) + '%' : ''
        case 'miner': return `${this.getRewardValue(r)} ${r.item.bonus ? '| ' + (r.item.bonus / 100) + '%' : ''}`
      }
      return ''
    }
  }
}
</script>
