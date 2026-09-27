<template>
  <div class="app-layout">
    <header class="app-bar">
      <router-link :to="{ name: 'home' }" class="app-bar__logo">
        <svg viewBox="0 0 48 48" class="app-bar__logo-icon" aria-hidden="true">
          <defs>
            <linearGradient id="app-bar-logo-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#4f46e5" />
              <stop offset="1" stop-color="#06b6d4" />
            </linearGradient>
          </defs>
          <rect x="6" y="5" width="36" height="38" rx="5" fill="url(#app-bar-logo-gradient)" />
          <rect x="6" y="5" width="6" height="38" rx="3" fill="#ffffff" fill-opacity="0.18" />
          <line x1="19" y1="13" x2="34" y2="13" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round" />
          <line x1="19" y1="18" x2="30" y2="18" stroke="#ffffff" stroke-opacity="0.4" stroke-width="1.6" stroke-linecap="round" />
          <rect x="18" y="26" width="14" height="11" rx="2.5" fill="#ffffff" />
          <path d="M21 26v-3.2a4 4 0 0 1 8 0V26" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" />
          <circle cx="25" cy="31" r="2" fill="#4f46e5" />
        </svg>
        <span class="app-bar__logo-text">비밀일기</span>
      </router-link>

      <nav class="app-bar__nav">
        <router-link :to="{ name: 'home' }" class="nav-link" aria-label="일기">
          <span class="nav-link__icon" aria-hidden="true">📖</span>
          <span>일기</span>
        </router-link>
        <router-link :to="{ name: 'me' }" class="nav-link" aria-label="내 정보">
          <span class="nav-link__icon" aria-hidden="true">👤</span>
          <span>내 정보</span>
        </router-link>
      </nav>

      <div class="app-bar__actions">
        <button type="button" class="logout-btn" @click="handleLogout">로그아웃</button>
      </div>
    </header>

    <main class="app-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import httpClient from '../shared/api/httpClient.js'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  try {
    await httpClient.post('/auth/logout', { refreshToken: authStore.refreshToken })
  } finally {
    authStore.logout()
    router.push({ name: 'login' })
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 56px;
  padding: 0 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border-bottom: none;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}

.app-bar__logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
}

.app-bar__logo-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.app-bar__nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.24);
}

.app-content {
  flex: 1;
  margin-top: 56px;
  padding: 16px;
}

.nav-link {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  padding: 0 14px;
  background: none;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nav-link__icon {
  font-size: 1rem;
  line-height: 1;
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-weight: 700;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.18);
}

.app-bar__logo-text,
.nav-link span,
.logout-btn {
  white-space: nowrap;
}

@media (max-width: 420px) {
  .app-bar {
    padding: 0 8px;
    gap: 4px;
  }

  .app-bar__logo-text {
    display: none;
  }

  .nav-link {
    padding: 0 8px;
    font-size: 0.85rem;
    gap: 4px;
  }

  .logout-btn {
    padding: 0 8px;
    font-size: 0.8rem;
  }
}
</style>
