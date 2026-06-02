import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyABG_c-JgULejkx3M3XXgWATnMOCD0s7QY',
  authDomain: 'rc-calculator-d20ac.firebaseapp.com',
  databaseURL: 'https://rc-calculator-d20ac-default-rtdb.firebaseio.com',
  projectId: 'rc-calculator-d20ac',
  storageBucket: 'rc-calculator-d20ac.firebasestorage.app',
  messagingSenderId: '563772861679',
  appId: '1:563772861679:web:b071a1b49cd68287d4ff1a'
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
