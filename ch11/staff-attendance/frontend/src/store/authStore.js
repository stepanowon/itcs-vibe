import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient } from '../queryClient.js'

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null, // User 스키마(id,email,name,employeeNo,hireDate,role,status)
      role: null,

      login: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user, role: user.role }),

      setTokens: ({ accessToken, refreshToken }) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        })),

      setUser: (user) => set({ user, role: user.role }),

      logout: () => {
        queryClient.clear()
        set({ accessToken: null, refreshToken: null, user: null, role: null })
      },
    }),
    { name: 'staff-attendance-auth' },
  ),
)
