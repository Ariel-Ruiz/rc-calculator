export let priceCache = {}

export async function fetchAllPrices() {

  try {
    const resp = await fetch(
      'https://api.freecryptoapi.com/v1/getData?symbol=btc+eth+ltc+bnb+doge+xrp+trx+sol+pol+algo',
      {
        headers: {
          'Authorization': 'Bearer nj19lite3vs52lmuooi0'
        }
      }
    )
    const data = await resp.json()
    if (data && data.status == 'success') {
      for (let symbol of data.symbols) {
        priceCache[symbol.symbol] = symbol.last || 0
      }
    }
    priceCache['RLT'] = 1
    priceCache['RST'] = 0.007
    priceCache['HMT'] = 1

    // guardamos en localStorage
    localStorage.setItem('priceCache', JSON.stringify(priceCache))
  } catch (err) {
    console.error('Error fetching prices', err)
  }
}

export function loadPricesFromStorage() {
  const stored = localStorage.getItem('priceCache')
  if (stored) {
    const parsed = JSON.parse(stored)
    priceCache = parsed
  }
}

export function fetchPrice(symbol) {
  if (!symbol) return 0
  return priceCache[symbol] || 0
}
