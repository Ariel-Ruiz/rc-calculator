<template>
  <div class='progression-container'>
    <div class='progression-info'>
      <div class='event-title'>{{ PeData.event.event.title.en }}</div>
      <div class='event-subtitle'>{{ t.pe?.progression_event }}</div>
      <div class="rentability-score">
        <div :class="['score', getScoreColorClass()]">{{ rentabilityScore }}</div>
        <div class="">/10</div>
      </div>
      <div class="rentability-score-text">{{ t.pe?.rentability_punctuation }}</div>
      <div v-if="isEventActive" class='deadline'>
        {{ t.pe?.ends_on }} {{ eventEndDate }} 15:00 UTC
      </div>
      <div v-else class='deadline ended'>
        {{ t.pe?.the_event_ended }}
      </div>
      <table class="tasks">
        <tbody>
          <tr class='task-info'>
            <td class="task-name">{{ t.pe?.multiplier }}</td>
            <td class="task-description">x{{ PeData.multiplier }} {{ t.pe?.per }} 1 RLT</td>
          </tr>
          <tr v-for="task in PeData.tasks" :key="task.type" class='task-info'>
            <td class="task-name">{{ t.pe?.[task.type] }}</td>
            <td class="task-description">{{ task.xp_reward }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class='progression-details'>
      <div class="calculator">
        <div class='calc-input-area'>
          <div class="calc-info">
            <label class='multiplier-info'>{{ t.pe?.recomended_multiplier }}</label>
            <label class='edit-info' for='buy'>{{ t.pe?.editable_field }}</label>
          </div>
          <div class="calc-table">
            <table>
              <thead>
                <th>MULT</th>
                <th>{{ t.pe?.discount }}</th>
                <th>{{ t.pe?.rlt_to_buy }}</th>
                <th>{{ t.pe?.rlt_with_discount }}</th>
                <th>{{ t.pe?.boxes }}</th>
              </thead>
              <tbody>
                <td>
                  <select
                    :class="['calc-input', { 'recomended': isRecomended(calcConfig.multiplier) }]"
                    id='multiplier'
                    :value="calcConfig.multiplier"
                    @change="handleCalc('multiplier', Number($event.target.value))"
                  >
                    <option
                      v-for="m in multipliers"
                      :key="m"
                      :class="{ 'recomended': isRecomended(m) }"
                      :value="m"
                    >x{{ m }}</option>
                  </select>
                </td>
                <td>
                  <select
                    class='calc-input'
                    id='discount'
                    :value="calcConfig.discount"
                    @change="handleCalc('discount', Number($event.target.value))"
                  >
                    <option v-for="d in discounts" :key="d" :value="d">{{ d }}%</option>
                  </select>
                </td>
                <td>
                  <input
                    class='calc-input'
                    type="number"
                    id='buy'
                    name='buy'
                    :value="calcConfig.buy"
                    @input="handleCalc('buy', Number($event.target.value))"
                  />
                </td>
                <td><input class='calc-input' type="number" :value="calcConfig.buyFinal" id='buyFinal' disabled/></td>
                <td>
                  <select
                    class='calc-input'
                    id='boxes'
                    :value="calcConfig.boxes"
                    @change="handleCalc('boxes', Number($event.target.value))"
                  >
                    <option v-for="b in boxesPrices" :key="b" :value="b">{{ b }} RLT</option>
                  </select>
                </td>
              </tbody>
            </table>
          </div>
        </div>

      </div>
      <div class="rewards">
        <table class='rewards-table'>
          <thead>
            <th>LVL</th>
            <th>TOTAL</th>
            <th>{{ t.pe?.points }}</th>
            <th>{{ t.pe?.reward }}</th>
            <th></th>
            <th>{{ t.pe?.boxes }}</th>
            <th>MARKET</th>
          </thead>
          <tbody>
            <tr v-for="(reward, idx) in PeData.event.rewards" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ PeData.event.levels_config[idx].required_xp }}</td>
              <td>{{ PeData.event.levels_config[idx].level_xp }}</td>
              <td class='reward-name'>
                {{ getRewardName(reward) }}
                <br/>
                <span class='reward-subname'>{{ getRewardSubname(reward) }}</span>
              </td>
              <td class='reward-image-cell' :style="{ backgroundImage: `url(${getRewardImage(reward)})` }">
                <img
                  v-if="reward.item?.level > 0"
                  :src="stPath + `others/level_${reward.item.level + 1}.png`"
                  class='level-image'
                />
              </td>
              <td class='reward-boxes'>{{ getRewardBoxes(PeData.event.levels_config[idx].required_xp) }} {{ t.pe?.boxes }}</td>
              <td class='reward-marketplace'>{{ getRewardMarket(PeData.event.levels_config[idx].required_xp) }} RLT</td>
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

export default {
  name: 'PE',
  inject: ['i18n'],
  data() {
    const boxesPrices = [1.45, 3.45, 8.95, 22.95]
    const discounts = [0, 10, 15, 20, 25, 30, 35, 40, 45, 50]
    const maxMultiplier = PeData.event.event.max_multiplier / 100
    const mult = []
    for (let i = 1; i <= maxMultiplier; i++) {
      mult.push(i)
    }

    return {
      stPath: 'https://storage.googleapis.com/rc-calculator-d20ac.firebasestorage.app/',
      PeData,
      calcConfig: {
        multiplier: 1,
        discount: 0,
        buy: 0,
        buyFinal: 0,
        boxes: 1.45
      },
      rentabilityScore: 0,
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
    t() {
      return this.i18n.t
    },
    isEventActive() {
      return moment().isBefore(moment(PeData.event.event.end_date).set({ hour: 15, minute: 0, second: 0 }))
    },
    eventEndDate() {
      return moment(PeData.event.event.end_date).format('DD/MM/YYYY')
    }
  },
  mounted() {
    moment.tz.setDefault("UTC")
    this.calcRecomend()
  },
  methods: {
    isRecomended(multiplier) {
      return this.recomendedMultiplier.includes(multiplier)
    },
    getScoreColorClass() {
      if (this.rentabilityScore == 10) return 'text-accent'
      if (this.rentabilityScore >= 7) return 'text-success'
      if (this.rentabilityScore >= 4) return 'text-warning'
      return 'text-danger'
    },
    calcRecomend() {
      let phXRLT = 0.25
      let feeXBox = 0.15
      let rewardsXRLT = 0
      for (let reward of PeData.event.rewards) {
        switch (reward.type) {
          case 'money':
            switch (reward.currency) {
              case 'RLT': rewardsXRLT += reward.amount / 1e6; break
              case 'RST': rewardsXRLT += reward.amount / 1e8; break
            }
            continue
          case 'power': rewardsXRLT += (reward.amount / 1e6) * phXRLT; continue
          case 'miner': rewardsXRLT += (reward.item.power / 1e6) * phXRLT; continue
        }
      }

      let maxBoxesToOpen = Math.ceil(rewardsXRLT / feeXBox)

      let closestAbove = { m: null, diff: Infinity }
      let closestBelow = { m: null, diff: Infinity }

      for (let m of this.multipliers) {
        let boxesToOpen = Math.ceil(
          PeData.event.event.max_xp / ((this.taskPoints.boxes * this.boxesPrices[0]) * m)
        )
        let diff = boxesToOpen - maxBoxesToOpen

        if (diff >= 0 && diff < closestAbove.diff) {
          closestAbove = { m, diff }
        }

        if (diff <= 0 && Math.abs(diff) < closestBelow.diff) {
          closestBelow = { m, diff: Math.abs(diff) }
        }
      }

      let recomended = []
      if (closestAbove.m !== null && closestAbove.m !== closestBelow.m) recomended.push(closestAbove.m)
      if (closestBelow.m !== null) recomended.push(closestBelow.m)

      let multiplier = recomended[0] || 1
      let buy = ((multiplier - 1) / PeData.multiplier) | 0
      let buyFinal = parseFloat((buy - (buy * (this.calcConfig.discount / 100))).toFixed(2)) | 0

      this.calcConfig = {
        ...this.calcConfig,
        buy,
        buyFinal,
        multiplier
      }

      this.recomendedMultiplier = recomended

      let usdXRLT = buyFinal / rewardsXRLT
      if (usdXRLT < 0.25) this.rentabilityScore = 10
      else if (usdXRLT >= 0.25 && usdXRLT < 0.3) this.rentabilityScore = 9
      else if (usdXRLT >= 0.3 && usdXRLT < 0.4) this.rentabilityScore = 8
      else if (usdXRLT >= 0.4 && usdXRLT < 0.5) this.rentabilityScore = 7
      else if (usdXRLT >= 0.5 && usdXRLT < 0.6) this.rentabilityScore = 6
      else if (usdXRLT >= 0.6 && usdXRLT < 0.7) this.rentabilityScore = 5
      else if (usdXRLT >= 0.7 && usdXRLT < 0.8) this.rentabilityScore = 4
      else if (usdXRLT >= 0.8 && usdXRLT < 0.9) this.rentabilityScore = 3
      else if (usdXRLT >= 0.9 && usdXRLT < 1) this.rentabilityScore = 2
      else if (usdXRLT >= 1 && usdXRLT < 1.1) this.rentabilityScore = 1
      else this.rentabilityScore = 0
    },
    handleCalc(param, value) {
      let buy = this.calcConfig.buy
      let buyFinal = this.calcConfig.buyFinal
      let multiplier = this.calcConfig.multiplier

      if (param == 'discount') {
        buyFinal = parseFloat((buy - (buy * (value / 100))).toFixed(2))
      }

      if (param == 'buy') {
        buyFinal = value - (value * (this.calcConfig.discount / 100))
        multiplier = parseFloat(((value * PeData.multiplier) + 1).toFixed(1))
      }

      if (param == 'multiplier' || multiplier != this.calcConfig.multiplier) {
        if (multiplier > 100) multiplier = 100
        let newMult = this.multipliers.filter(m => Number.isInteger(m))
        if (!this.multipliers.some(m => m == multiplier)) {
          newMult.unshift(multiplier)
        }
        this.multipliers = newMult

        if (param == 'multiplier') {
          buy = (value - 1) / PeData.multiplier
          buyFinal = parseFloat((buy - (buy * (this.calcConfig.discount / 100))).toFixed(2))
        }
      }

      this.calcConfig = {
        ...this.calcConfig,
        buy,
        buyFinal,
        multiplier,
        [param]: value
      }
    },
    getRewardBoxes(required_xp) {
      return Math.ceil(required_xp / ((this.taskPoints.boxes * this.calcConfig.boxes) * this.calcConfig.multiplier))
    },
    getRewardMarket(required_xp) {
      return Math.ceil(required_xp / (this.taskPoints.marketplace * this.calcConfig.multiplier))
    },
    getRewardImage(reward) {
      let filename = ''
      switch (reward.type) {
        case 'money': filename = `others/reward_${reward.currency.toLowerCase()}.png`; break
        case 'season_pass_xp': filename = 'others/season_pass_xp.png'; break
        case 'power': filename = 'others/reward_power.png'; break
        case 'utility_item': filename = `others/${reward.item_id}.gif`; break
        case 'loot_box': filename = `box/${reward.item_id}.png`; break
        case 'rack': filename = `rack/${reward.item_id}.png`; break
        case 'miner': filename = `miner/${reward.item.filename}.gif`; break
      }
      return this.stPath + filename
    },
    getRewardValue(reward) {
      let coinFormatter = new Intl.NumberFormat('De')
      switch (reward.type) {
        case 'money': return `${reward.amount / 1e6} ${reward.currency}`
        case 'power': return `${coinFormatter.format(reward.amount)} Gh/s`
        case 'miner': return `${coinFormatter.format(reward.item.power)} Gh/s`
      }
      return reward.amount
    },
    getRewardName(reward) {
      switch (reward.type) {
        case 'money': return this.getRewardValue(reward)
        case 'season_pass_xp': return this.getRewardValue(reward) + ' XP'
        case 'power': return this.getRewardValue(reward)
        case 'utility_item': return (reward.amount > 1 ? reward.amount : '') + ' ' + reward.item.name.en
        case 'loot_box': return reward.item.title.en
        case 'rack':
        case 'miner': return reward.item.name.en
      }
    },
    getRewardSubname(reward) {
      switch (reward.type) {
        case 'rack': return reward.item.bonus ? (reward.item.bonus / 100) + '%' : ''
        case 'miner': return `${this.getRewardValue(reward)} ${reward.item.bonus ? '| ' + (reward.item.bonus / 100) + '%' : ''}`
      }
      return ''
    }
  }
}
</script>
