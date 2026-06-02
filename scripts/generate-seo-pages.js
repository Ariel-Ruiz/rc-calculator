import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')

const BASE_URL = 'https://ariel-ruiz.github.io/rc-calculator'

const pages = {
  '/rooms': {
    title: 'Room Simulator | RC Calculator',
    description: 'Simulate and optimize your RollerCoin room layout. Import your configuration and find the best miner placement for maximum power and bonus.',
    keywords: 'rollercoin rooms, room simulator, miner placement, room optimizer, rollercoin power',
    image: `${BASE_URL}/previews/rooms.png`,
  },
  '/marketplace': {
    title: 'Marketplace | RC Calculator',
    description: 'Analyze and compare RollerCoin marketplace miners. Find the best deals based on power, bonus and price.',
    keywords: 'rollercoin marketplace, miner comparison, best miners, rollercoin deals, miner price',
    image: `${BASE_URL}/previews/marketplace.png`,
  },
  '/current-progression': {
    title: 'Progression Event | RC Calculator',
    description: 'Calculate the best multiplier and cost for RollerCoin progression events. See reward tables and profitability scores.',
    keywords: 'rollercoin progression event, event calculator, progression multiplier, rollercoin rewards',
    image: `${BASE_URL}/previews/progression.png`,
  },
  '/burning-event': {
    title: 'Burning Event | RC Calculator',
    description: 'Tools and calculations for RollerCoin burning events. Optimize your strategy for maximum value.',
    keywords: 'rollercoin burning event, burn calculator, rollercoin event, burning strategy',
    image: `${BASE_URL}/previews/burning.png`,
  },
  '/rollertap': {
    title: 'RollerTap | RC Calculator',
    description: 'Manage your RollerTap hamsters and find the best upgrades by ROI.',
    keywords: 'rollertap, hamster calculator, rollertap roi, hamster upgrades, rollercoin telegram',
    image: `${BASE_URL}/previews/rollertap.png`,
  },
  '/hamsters': {
    title: 'Hamsters | RC Calculator',
    description: 'Manage your RollerCoin hamsters for expeditions. Track levels, stats and optimize your team.',
    keywords: 'rollercoin hamsters, expedition hamsters, hamster manager, rollercoin expeditions',
    image: `${BASE_URL}/previews/hamsters.png`,
  },
}

// Read the base index.html from dist
const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf-8')

for (const [route, meta] of Object.entries(pages)) {
  const pageUrl = `${BASE_URL}${route}`

  let html = indexHtml

  // Replace title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${meta.title}</title>`
  )

  // Replace meta description
  html = html.replace(
    /<meta name="description"[^>]*\/>/,
    `<meta name="description" content="${meta.description}" />`
  )

  // Replace meta keywords
  html = html.replace(
    /<meta name="keywords"[^>]*\/>/,
    `<meta name="keywords" content="${meta.keywords}" />`
  )

  // Replace Open Graph tags
  html = html.replace(
    /<meta property="og:title"[^>]*\/>/,
    `<meta property="og:title" content="${meta.title}" />`
  )
  html = html.replace(
    /<meta property="og:description"[^>]*\/>/,
    `<meta property="og:description" content="${meta.description}" />`
  )
  html = html.replace(
    /<meta property="og:image"[^>]*\/>/,
    `<meta property="og:image" content="${meta.image}" />`
  )
  html = html.replace(
    /<meta property="og:url"[^>]*\/>/,
    `<meta property="og:url" content="${pageUrl}" />`
  )

  // Replace Twitter Cards
  html = html.replace(
    /<meta name="twitter:title"[^>]*\/>/,
    `<meta name="twitter:title" content="${meta.title}" />`
  )
  html = html.replace(
    /<meta name="twitter:description"[^>]*\/>/,
    `<meta name="twitter:description" content="${meta.description}" />`
  )
  html = html.replace(
    /<meta name="twitter:image"[^>]*\/>/,
    `<meta name="twitter:image" content="${meta.image}" />`
  )

  // Replace canonical URL
  html = html.replace(
    /<link rel="canonical"[^>]*\/>/,
    `<link rel="canonical" href="${pageUrl}" />`
  )

  // Write to dist/route/index.html
  const routeDir = join(distDir, route.slice(1))
  if (!existsSync(routeDir)) {
    mkdirSync(routeDir, { recursive: true })
  }
  writeFileSync(join(routeDir, 'index.html'), html)
  console.log(`Generated: ${route}/index.html`)
}

console.log('Main /index.html already has canonical from source.')

console.log('\nDone! All SEO pages generated.')
