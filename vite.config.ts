import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/web_train/', // 👈 MUY IMPORTANTE
  plugins: [vue()],
})
