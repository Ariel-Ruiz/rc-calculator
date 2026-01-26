# Rollercoin Calculator 🦆

Calculadora web interactiva para [Rollercoin](https://rollercoin.com) que te permite optimizar tus ganancias de minería virtual y gestionar tus recursos de manera eficiente.

[![Deploy](https://img.shields.io/badge/deploy-gh--pages-success)](https://ariel-ruiz.github.io/rc-calculator/)

## 🎯 Características

### 📊 Calculadora de Profit
- **Cálculo de ganancias**: Calcula tus ganancias por bloque, día, semana y mes
- **Soporte multi-moneda**: BTC, ETH, LTC, BNB, DOGE, XRP, TRX, SOL, POL, ALGO, RLT, RST, HMT
- **Conversión USD**: Precios en tiempo real de criptomonedas
- **Persistencia**: Guarda automáticamente tus datos en localStorage

### 🐹 Calculadora de Rollertap
- **Gestión de hamsters**: Administra el nivel de todos tus hamsters
- **ROI optimizado**: Indicadores visuales de rentabilidad por color
- **Uncle's Blessing**: Incluye el multiplicador de ingresos extra
- **Recomendaciones**: Identifica las mejores mejoras según ROI

### 🎁 Calculadora de Progression Events
- **Eventos actualizados**: Datos de los últimos eventos de progresión
- **Multiplicadores**: Calcula el multiplicador óptimo para cada evento
- **Descuentos**: Aplica descuentos y calcula el costo real
- **Puntuación de rentabilidad**: Score de 0-10 sobre la rentabilidad del evento
- **Tabla de recompensas**: Visualiza todas las recompensas y su costo en cajas/RLT

### 🌍 Multiidioma
- Español (ES)
- English (EN)

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/ariel-ruiz/rc-calculator.git
cd rc-calculator

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

## 🛠️ Tecnologías

- **Vue 2.7** - Framework JavaScript progresivo
- **Vite 4.5** - Build tool ultrarrápido
- **Vue Router 3** - Navegación entre páginas
- **Moment.js** - Manejo de fechas y zonas horarias
- **Firebase** - Backend y almacenamiento
- **Free Crypto API** - Precios de criptomonedas en tiempo real

## 📁 Estructura del Proyecto

```
src/
├── assets/           # Recursos estáticos (imágenes, JSON)
│   ├── symbols/      # Iconos de criptomonedas
│   ├── rollertap/    # Imágenes de hamsters
│   └── progression.json
├── components/       # Componentes reutilizables
│   ├── Header.vue
│   └── Sidebar.vue
├── lang/            # Archivos de traducción
│   ├── en.json
│   └── es.json
├── lib/             # Utilidades y funciones
│   ├── calculations.js
│   └── prices.js
├── pages/           # Páginas principales
│   ├── Home.vue          # Calculadora de profit
│   ├── Rollertap.vue     # Calculadora de hamsters
│   └── PE.vue            # Progression events
├── router/          # Configuración de rutas
├── styles/          # Estilos globales y específicos
└── App.vue          # Componente raíz
```

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Deploy a GitHub Pages
npm run deploy
```

## 🎨 Uso

### Calculadora de Profit

1. Copia todos los datos de la sección **League Power** en Rollercoin
2. Pégalos en el campo "Your league network"
3. Ingresa tu poder en PH/s
4. Click en "CALCULATE"
5. Alterna entre CRYPTO y USD según prefieras

### Calculadora de Rollertap

1. Ajusta el nivel de cada hamster según lo que tienes en el bot de Telegram
2. Los colores indican el ROI:
   - 🟢 Verde: Excelente ROI
   - 🟡 Amarillo: ROI moderado
   - 🟠 Naranja: ROI bajo
   - 🔴 Rojo: ROI muy bajo
   - 🟣 Morado: ROI extremadamente bajo
3. Incluye el nivel de Uncle's Blessing para calcular el bonus

### Calculadora de Progression Events

1. Selecciona tu multiplicador deseado (los recomendados aparecen destacados)
2. Aplica el descuento disponible
3. Visualiza cuántas cajas necesitas abrir o RLT gastar en marketplace
4. Revisa la puntuación de rentabilidad (0-10)

## 🌐 Demo

Visita la versión en vivo: [https://ariel-ruiz.github.io/rc-calculator/](https://ariel-ruiz.github.io/rc-calculator/)

## 🔧 Configuración

### Base Path

El proyecto está configurado para servirse desde `/rc-calculator`. Si necesitas cambiar esto:

```js
// vite.config.js
export default defineConfig({
  base: '/tu-ruta-personalizada',
  // ...
})

// src/router/index.js
const router = new VueRouter({
  base: '/tu-ruta-personalizada',
  // ...
})
```

### Google Analytics

El proyecto incluye Google Analytics. Puedes cambiar el ID en `index.html`:

```html
<script>
  gtag('config', 'TU-GA-ID');
</script>
```

## 📝 Notas

- Los datos se guardan automáticamente en localStorage
- Los precios de criptomonedas se actualizan cada hora
- Los datos de progression events se actualizan manualmente cuando hay nuevos eventos

## 👨‍💻 Autor

**Ariel Ruiz**

- GitHub: [@ariel-ruiz](https://github.com/ariel-ruiz)
- Telegram: [@Ar1el_23](https://t.me/Ar1el_23)
- Discord: ar1el_23

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Si tienes información sobre nuevos niveles de hamsters o datos de eventos, no dudes en contactarme.

---

**¿Te gusta el proyecto? Dale una ⭐ en GitHub!**
