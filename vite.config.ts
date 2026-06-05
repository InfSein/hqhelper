import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import svgLoader from 'vite-svg-loader'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    VueDevTools(),
    svgLoader(),
    AutoImport({
      imports: [
        'vue', 'vue-router', 'pinia',
        {
          'naive-ui': [
            'useMessage',
          ]
        }
      ],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      dirs: ['src/components/templates'],
      deep: true,
      resolvers: [NaiveUiResolver()],
      dts: 'src/components.d.ts',
      directoryAsNamespace: false,
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: "0.0.0.0",
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          icons: ['@vicons/material'],
        }
      }
    }
  },
})
