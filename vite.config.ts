import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for hosting. For GitHub Pages project sites set this to the
  // repo name, e.g. '/Zyrachain-admin/'. For a custom domain (root) use '/'.
  base: process.env.VITE_BASE_PATH || '/',
})