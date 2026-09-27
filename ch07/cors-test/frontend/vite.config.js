import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: Number(env.PORT) || 8080,
      // 기본값(localhost)은 IPv6(::1)에만 바인딩되어 nip.io(IPv4 127.0.0.1)로 접속이 안 됨
      host: true,
      // nip.io 등 localhost 외 호스트명으로 접속해 CORS를 테스트할 수 있도록 허용
      allowedHosts: true,
    },
  };
});
