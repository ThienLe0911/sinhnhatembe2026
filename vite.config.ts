import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Nhiều điểm vào (ADR-001): site quà ở `/` và trang mời ở `/moi/` có gói tách biệt
      input: {
        main: entry('./index.html'),
        moi: entry('./moi/index.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,mjs,js}'],
  },
})
