import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SanadAiChatDataAccess',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['@tanstack/react-query', 'axios', '@sanad-ai/api', '@sanad-ai/chat/domain', '@sanad-ai/response-parser'],
    },
  },
});






