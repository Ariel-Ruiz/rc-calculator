// Shared burning-event points scoring, reused by BurningEvent.vue and the Rooms burning mode.
// Keep this the single source of truth for the formula so both views stay in sync.

export function parseNumericValue(str) {
  const cleanedStr = String(str).replace(/[^\d.,]/g, '')
  return parseFloat(cleanedStr.replace(',', '.'))
}

// Event scoring: points depend ONLY on power. Each pointsXPh is the previous multiplier scaled by
// 5/24 (same power/sellable tiers). The bonus term is ignored this event; if a future event counts
// bonus again with the old values, re-add `+ (pointsXBonus * bonus)` using the commented tiers.
export function calcularPuntos(poder, bonus, isSellable = false) {
  const valorPoder = parseNumericValue(poder)
  let poderEnPhs = 0
  if (poder.includes('Eh/s')) poderEnPhs = valorPoder * 1000
  else if (poder.includes('Ph/s')) poderEnPhs = valorPoder
  else if (poder.includes('Th/s')) poderEnPhs = valorPoder / 1000

  let pointsXPh = 1
  if (poderEnPhs >= 10 && isSellable) pointsXPh = 3000        // pointsXBonus 60
  else if (poderEnPhs >= 10) pointsXPh = 2000                 // 40
  else if (poderEnPhs >= 5 && isSellable) pointsXPh = 3750    // 75
  else if (poderEnPhs >= 5) pointsXPh = 2500                  // 50
  else if (poderEnPhs >= 1 && isSellable) pointsXPh = 4687.5  // 93.75
  else if (poderEnPhs >= 1) pointsXPh = 3125                  // 62.5
  else if (poderEnPhs > 0.75 && isSellable) pointsXPh = 9687.5 // 193.75
  else if (isSellable) pointsXPh = 5812.5                     // 116.25
  else pointsXPh = 3875                                       // 77.5

  return Math.ceil(poderEnPhs * pointsXPh)
}
