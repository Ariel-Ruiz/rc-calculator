<template>
  <div class="container">
    <div class="input-section">
      <div id="warning" style="color: #e85217">{{ t.warning || 'Asegúrese...' }}</div>
      <img :src="exampleImg" width="100%" alt="example" />
      <h5 id="networkLabel">{{ t.networkLabel || 'Red de tu liga' }}</h5>
      <textarea
        id="networkInput"
        v-model="networkInput"
        :placeholder="t.networkPlaceholder || 'Pega aquí los datos de la red...'"
      />
      <h5 id="powerLabel">{{ t.powerLabel || 'Poder en Ph/s' }}</h5>
      <input
        type="number"
        id="myPower"
        v-model.number="myPower"
        :placeholder="t.powerPlaceholder || 'Tu poder (PH/s)'"
      />
      <button id="processBtn" @click="procesarRed">{{ t.processBtn || 'Procesar' }}</button>
    </div>

    <div class="results-section">
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

      <div class="table-wrapper">
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
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
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
import exampleImg from '../assets/example.png'

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
      { symbol: "ALGO", power: "0 Zh/s", reward: "0 ALGO", blockTime: "10:01" }
    ]

    return {
      networkInput: '',
      myPower: Number(localStorage.getItem('power') || 1000),
      parsedLines: savedLines ? JSON.parse(savedLines) : defaultLines,
      useUSD: localStorage.getItem('useUSD') === '1',
      lastPricesLoaded: localStorage.getItem('lastPricesLoaded') || '',
      pricesLoaded: false,
      symbolIcons,
      exampleImg
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
      const myPowerPH = this.myPower || 0
      const myPowerHs = myPowerPH * 1e15

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
      if (this.useUSD && data.symbol != 'HMT') {
        const price = fetchPrice(rewardSymbol)
        myRewardBlock *= price
        myRewardDay *= price
        myRewardWeek *= price
        myRewardMonth *= price
        suffix = 'USD'
      }

      return {
        perBlock: myRewardBlock,
        perDay: myRewardDay,
        perWeek: myRewardWeek,
        perMonth: myRewardMonth,
        suffix
      }
    }
  }
}
</script>
