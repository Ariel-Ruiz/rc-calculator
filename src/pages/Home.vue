<template>
  <div class="profit-container">
    <div class="profit-input">
      <h1 class="event-title">{{ t.profitTitle || 'Profit' }}</h1>
      <div class="event-subtitle">{{ t.profitSubtitle || 'Mining Rewards Calculator' }}</div>
      <p class="help" v-html="t.warning || ''"></p>

      <div class="profit-example">
        <img
          :src="exampleImg"
          alt="example"
          class="profit-example-thumb"
          @click="previewImage = exampleImg"
        />
      </div>

      <div v-if="previewImage" class="image-preview-overlay" @click="previewImage = null">
        <div class="image-preview-container" @click.stop>
          <img :src="previewImage" alt="Preview" class="image-preview" />
          <button class="preview-close" @click="previewImage = null">&times;</button>
        </div>
      </div>

      <label class="profit-label">{{ t.networkLabel || 'Your league network' }}</label>
      <textarea
        id="networkInput"
        v-model="networkInput"
        class="profit-textarea"
        :placeholder="t.networkPlaceholder || 'Pega aquí los datos de la red...'"
        @blur="saveNetwork"
      />
      <label class="profit-label">{{ t.powerInLabel || 'Power in' }}</label>
      <div class="toogle-currency-tab profit-unit-tab">
        <div
          :class="['toogle-currency', { 'active': powerUnit === 'EH' }]"
          @click="powerUnit = 'EH'"
        >EH/s</div>
        <div
          :class="['toogle-currency', { 'active': powerUnit === 'PH' }]"
          @click="powerUnit = 'PH'"
        >PH/s</div>
      </div>
      <input
        type="number"
        id="myPower"
        class="profit-power-input"
        v-model.number="myPower"
        :placeholder="powerUnit === 'EH' ? (t.powerPlaceholderEh || 'Your power (EH/s)') : (t.powerPlaceholderPh || 'Your power (PH/s)')"
        @blur="updateNetworkPower"
      />
      <button class="btn-calculate" @click="procesarRed">{{ t.processBtn || 'Procesar' }}</button>
    </div>

    <div class="profit-results">
      <div class="result-buttons">
        <div class="toogle-currency-tab">
          <div
            id='toogle-crypto'
            :class="['toogle-currency', { 'active': !useUSD }]"
            @click="useUSD = false"
          >CRYPTO</div>
          <div
            id='toogle-usd'
            :class="['toogle-currency', { 'active': useUSD }]"
            @click="useUSD = true"
          >USD</div>
        </div>
      </div>

      <div v-if="!pricesLoaded" class="profit-loading">
        <div class="profit-spinner"></div>
        <span>Loading prices...</span>
      </div>

      <div v-else class="table-wrapper">
        <table id="resultTable">
          <thead>
            <tr>
              <th class="sticky" id="thCoin">{{ t.thCoin || '' }}</th>
              <th id="thNetPower">{{ t.thNetPower || '' }}</th>
              <th id="thReward">{{ t.thReward || '' }}</th>
              <th id="thBlockTime">{{ t.thBlockTime || '' }}</th>
              <th id="thPerBlock">{{ t.thPerBlock || '' }}</th>
              <th id="thPerDay">{{ t.thPerDay || '' }}</th>
              <th id="thPerWeek">{{ t.thPerWeek || '' }}</th>
              <th id="thPerMonth">{{ t.thPerMonth || '' }}</th>
              <th id="thWithdrawIn">{{ t.thWithdrawIn || '' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in rows" :key="idx" :data-idx="idx">
              <td class="sticky">
                <img :src="symbolIcons[r.p.symbol] || '/symbols/default.svg'" class="symbol-icon" :alt="r.p.symbol" />
              </td>
              <td>{{ r.p.power }}</td>
              <td>{{ r.p.reward }}</td>
              <td>
                <input
                  class="editable"
                  type="text"
                  :value="r.p.blockTime"
                  @input="updateBlockTime(idx, $event.target.value)"
                />
              </td>
              <td class="block">{{ r.calc.perBlock.toFixed(useUSD ? 2 : 6) }} {{ r.calc.suffix }}</td>
              <td class="day">{{ r.calc.perDay.toFixed(useUSD ? 2 : 4) }} {{ r.calc.suffix }}</td>
              <td class="week">{{ r.calc.perWeek.toFixed(useUSD ? 2 : 4) }} {{ r.calc.suffix }}</td>
              <td class="month">{{ r.calc.perMonth.toFixed(useUSD ? 2 : 3) }} {{ r.calc.suffix }}</td>
              <td class="withdraw" v-if="r.calc.withdrawMin !== null">
                <span class="withdraw-min">{{ r.calc.withdrawMin }} {{ r.p.symbol }}</span>
                <br/>
                <span class="withdraw-days">{{ r.calc.withdrawDays !== null ? r.calc.withdrawDays + 'd' : '-' }}</span>
              </td>
              <td v-else></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import '../styles/profit.css'
import moment from 'moment'
import { fetchAllPrices, fetchPrice, loadPricesFromStorage } from '../lib/prices'
import { convertirAHs, tiempoASegundos } from '../lib/calculations'

import rltIcon from '../assets/symbols/rlt.svg'
import rstIcon from '../assets/symbols/rst.svg'
import hmtIcon from '../assets/symbols/hmt.svg'
import btcIcon from '../assets/symbols/btc.svg'
import ethIcon from '../assets/symbols/eth.svg'
import ltcIcon from '../assets/symbols/ltc.svg'
import bnbIcon from '../assets/symbols/bnb.svg'
import dogeIcon from '../assets/symbols/doge.svg'
import xrpIcon from '../assets/symbols/xrp.svg'
import trxIcon from '../assets/symbols/trx.svg'
import solIcon from '../assets/symbols/sol.svg'
import polIcon from '../assets/symbols/matic.svg'
import algoIcon from '../assets/symbols/algo.svg'
import usdtIcon from '../assets/symbols/usdt.svg'
import exampleImg from '../assets/example.png'
import { db } from '../firebase'
import { ref as dbRef, set } from 'firebase/database'

// ---- Minimum withdraw amounts per coin ----
const withdrawMinimums = {
  BTC: 0.00085,
  ETH: 0.014,
  LTC: 5,
  BNB: 0.06,
  DOGE: 220,
  XRP: 40,
  TRX: 300,
  SOL: 0.6,
  POL: 300
}

const symbolIcons = {
  RLT: rltIcon,
  RST: rstIcon,
  HMT: hmtIcon,
  BTC: btcIcon,
  ETH: ethIcon,
  LTC: ltcIcon,
  BNB: bnbIcon,
  DOGE: dogeIcon,
  XRP: xrpIcon,
  TRX: trxIcon,
  SOL: solIcon,
  POL: polIcon,
  ALGO: algoIcon,
  USDT: usdtIcon
}

export default {
  name: 'Home',
  inject: ['i18n'],
  data() {
    const savedLines = localStorage.getItem('networkLines')
    const defaultLines = [
      { symbol: "RLT", power: "0 Zh/s", reward: "0 RLT", blockTime: "10:01" },
      { symbol: "RST", power: "0 Zh/s", reward: "0 RST", blockTime: "10:01" },
      { symbol: "HMT", power: "0 Zh/s", reward: "0 HMT", blockTime: "10:01" },
      { symbol: "BTC", power: "0 Zh/s", reward: "0 BTC", blockTime: "10:01" },
      { symbol: "LTC", power: "0 Zh/s", reward: "0 LTC", blockTime: "10:01" },
      { symbol: "BNB", power: "0 Zh/s", reward: "0 BNB", blockTime: "10:01" },
      { symbol: "POL", power: "0 Zh/s", reward: "0 POL", blockTime: "10:01" },
      { symbol: "XRP", power: "0 Zh/s", reward: "0 XRP", blockTime: "10:01" },
      { symbol: "DOGE", power: "0 Zh/s", reward: "0 DOGE", blockTime: "10:01" },
      { symbol: "ETH", power: "0 Zh/s", reward: "0 ETH", blockTime: "10:01" },
      { symbol: "TRX", power: "0 Zh/s", reward: "0 TRX", blockTime: "10:01" },
      { symbol: "SOL", power: "0 Zh/s", reward: "0 SOL", blockTime: "10:01" },
      { symbol: "ALGO", power: "0 Zh/s", reward: "0 ALGO", blockTime: "10:01" },
      { symbol: "USDT", power: "0 Zh/s", reward: "0 USDT", blockTime: "10:01" }
    ]

    return {
      networkInput: '',
      lastSavedNetworkHash: null,
      myPower: localStorage.getItem('power') ? Number(localStorage.getItem('power')) : null,
      parsedLines: savedLines ? JSON.parse(savedLines) : defaultLines,
      useUSD: localStorage.getItem('useUSD') === '1',
      lastPricesLoaded: localStorage.getItem('lastPricesLoaded') || '',
      powerUnit: localStorage.getItem('powerUnit') || 'EH',
      pricesLoaded: false,
      symbolIcons,
      exampleImg,
      previewImage: null
    }
  },
  computed: {
    t() {
      return this.i18n.t
    },
    rows() {
      if (!this.pricesLoaded) return []
      return this.parsedLines.map(p => ({
        p,
        calc: this.computeForLine(p)
      }))
    }
  },
  watch: {
    parsedLines: {
      handler(newVal) {
        localStorage.setItem('networkLines', JSON.stringify(newVal))
      },
      deep: true
    },
    myPower(newVal) {
      localStorage.setItem('power', String(newVal))
    },
    useUSD(newVal) {
      localStorage.setItem('useUSD', newVal ? '1' : '')
    },
    powerUnit(newVal) {
      localStorage.setItem('powerUnit', newVal)
    }
  },
  mounted() {
    this.loadPrices()
  },
  methods: {
    async loadPrices() {
      if (!this.lastPricesLoaded || moment(this.lastPricesLoaded).isBefore(moment().subtract(1, 'hours'))) {
        await fetchAllPrices()
        localStorage.setItem('lastPricesLoaded', moment().format('YYYY-MM-DD HH:mm:ss'))
      } else {
        loadPricesFromStorage()
      }
      this.pricesLoaded = true
    },
    async saveNetwork() {
      const text = this.networkInput.trim()
      if (!text) return
      try {
        let hash = 0
        for (let i = 0; i < text.length; i++) {
          hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
        }
        const key = (hash >>> 0).toString(36)
        if (key === this.lastSavedNetworkHash) return
        this.lastSavedNetworkHash = key
        await set(dbRef(db, 'networks/' + key), {
          network: text,
          power: this.myPower || null,
          powerUnit: this.powerUnit,
          timestamp: Date.now()
        })
      } catch (e) { /* silent */ }
    },
    async updateNetworkPower() {
      if (!this.lastSavedNetworkHash || !this.myPower) return
      try {
        await set(dbRef(db, 'networks/' + this.lastSavedNetworkHash + '/power'), this.myPower)
        await set(dbRef(db, 'networks/' + this.lastSavedNetworkHash + '/powerUnit'), this.powerUnit)
      } catch (e) { /* silent */ }
    },
    procesarRed() {
      if (!this.networkInput) return
      let lines = this.networkInput.split('\n').map(l => l.trim()).filter(l => l)
      lines = lines.filter(l => !['Game currencies', 'Crypto currencies'].includes(l))
      const newParsed = []
      let i = 1
      while (i < lines.length) {
        newParsed.push({
          symbol: lines[i],
          power: lines[i + 3],
          reward: lines[i + 7],
          blockTime: '10:01'
        })
        i += 11
      }
      this.parsedLines = newParsed
      this.networkInput = ''
    },
    updateBlockTime(idx, value) {
      const cp = [...this.parsedLines]
      cp[idx] = { ...cp[idx], blockTime: value }
      this.parsedLines = cp
    },
    computeForLine(data) {
      const myPowerVal = this.myPower || 0
      const myPowerHs = myPowerVal * (this.powerUnit === 'EH' ? 1e18 : 1e15)

      const [powerValueStr, powerUnit] = data.power.split(' ')
      const netPowerHs = convertirAHs(parseFloat(powerValueStr) || 0, powerUnit || '')

      const rewardParts = data.reward.split(' ')
      const rewardValue = parseFloat(rewardParts[0]) || 0
      const rewardSymbol = rewardParts[1] || ''

      const blockSeconds = tiempoASegundos(data.blockTime)

      let myRewardBlock = netPowerHs > 0 ? (myPowerHs / netPowerHs) * rewardValue : 0
      const blocksPerDay = 86400 / blockSeconds
      let myRewardDay = myRewardBlock * blocksPerDay
      let myRewardWeek = myRewardDay * 7
      let myRewardMonth = myRewardDay * 30

      let suffix = rewardSymbol
      if (this.useUSD && data.symbol != 'HMT' && data.symbol != 'RST') {
        const price = fetchPrice(rewardSymbol)
        myRewardBlock *= price
        myRewardDay *= price
        myRewardWeek *= price
        myRewardMonth *= price
        suffix = 'USD'
      }

      const withdrawMin = withdrawMinimums[data.symbol] ?? null
      let withdrawDays = null
      if (withdrawMin != null) {
        const rawPerDay = netPowerHs > 0 ? ((myPowerHs / netPowerHs) * rewardValue) * (86400 / blockSeconds) : 0
        withdrawDays = rawPerDay > 0 ? Math.ceil(withdrawMin / rawPerDay) : null
      }

      return {
        perBlock: myRewardBlock,
        perDay: myRewardDay,
        perWeek: myRewardWeek,
        perMonth: myRewardMonth,
        withdrawMin,
        withdrawDays,
        suffix
      }
    }
  }
}
</script>
