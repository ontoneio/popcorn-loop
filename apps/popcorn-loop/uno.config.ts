import { defineConfig } from 'unocss'
import presetWind4 from '@unocss/preset-wind4'

export default defineConfig({
  presets: [
    presetWind4({
      preflights: { 
        reset: false, 
      } 
    }),
  ],
  theme: {
    colors: {
        primary:  'linear-gradient(135deg, #000000 0%, #1a0033 50%, #000033 100%)',
    },
  },
})