import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // El motor 3D se importa con `lazy()` en App.tsx y sale como chunk propio.
    // Aquí se reparten además las librerías pesadas en chunks independientes
    // para que el navegador pueda descargarlos en paralelo y cacheados por
    // separado entre despliegues (BUG-005).
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three',
              test: /node_modules[\\/](three|three-stdlib)[\\/]/,
            },
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
            {
              name: 'physics',
              test: /node_modules[\\/]@dimforge[\\/]/,
            },
            {
              name: 'postprocessing',
              test: /node_modules[\\/](postprocessing|n8ao)[\\/]/,
            },
          ],
        },
      },
    },
    // El único chunk que supera 500 kB es `physics` (Rapier, 842 kB gzip), que
    // se descarga bajo demanda junto al motor al pulsar JUGAR: la ruta crítica
    // (menú/onboarding) pesa ~89 kB gzip. Se sube el umbral para que la
    // advertencia siga señalando solo lo que sí bloquea el primer pintado.
    chunkSizeWarningLimit: 2500,
  },
})
