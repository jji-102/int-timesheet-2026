import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/int-timesheet-2026/', // เพิ่มบรรทัดนี้เข้าไป (ต้องมี / หน้าและหลัง)
})
