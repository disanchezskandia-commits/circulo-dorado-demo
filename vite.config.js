import { defineConfig } from 'vite';

// Rutas relativas: el build funciona subido a cualquier carpeta (HubSpot File Manager, hosting externo).
export default defineConfig({ base: './' });
