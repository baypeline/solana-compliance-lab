/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// 공통 계약(contracts/)은 저장소 루트에 있으므로 dev 서버가 그 경로를 읽을 수 있게 허용한다.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const contractsDir = fileURLToPath(new URL('../../contracts', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:8080'
  if (mode === 'backend') {
    // `pnpm dev:backend`의 기본값. 저장소는 .env.* 파일을 올리지 않으므로 여기에 둔다.
    // 로컬의 .env.backend(git에서 무시됨, .env.backend.example 참고)나 셸 환경 변수가 있으면 그 값을 쓴다.
    process.env.VITE_API_MODE ??= env.VITE_API_MODE ?? 'backend'
    process.env.VITE_CONSTELLATION_MODELS ??= env.VITE_CONSTELLATION_MODELS ?? '0.1.0-draft,0.1.0-single-leader'
  }

  return {
    // .env.production 같은 파일의 값도 읽도록 loadEnv 결과를 쓴다(셸 환경 변수가 우선).
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
    resolve: {
      alias: { '@contracts': contractsDir },
    },
    server: {
      // Backend CORS 기본 허용 출처가 5173이다. 아래 proxy가 Origin을 빼므로 다른 포트(PORT)도 된다.
      port: Number(process.env.PORT) || 5173,
      strictPort: true,
      fs: { allow: [repoRoot] },
      // backend 모드에서는 같은 출처의 /api 요청을 Backend로 넘긴다. mock 모드에서는 MSW가 먼저 가로챈다.
      // 브라우저의 Origin은 빼고 넘긴다. 그래야 Backend CORS 허용 목록에 없는 dev 포트에서도 같은 출처로 취급된다.
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          configure: (proxy) => proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin')),
        },
      },
    },
    test: {
      // Tests use their own MSW server, even when invoked inside a Backend-mode Compose service.
      env: { VITE_API_MODE: 'mock', VITE_CONSTELLATION_MODELS: '', VITE_DEMO_FIXTURES: 'on' },
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['src/test/setup.ts'],
      // 각 파일의 첫 테스트가 계약 스키마를 컴파일한다(Ajv). 부하가 큰 머신에서는 수 초가 걸린다.
      testTimeout: 30_000,
    },
  }
})
