import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  avatar?: string;
};

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  rehydrated: boolean;
  setAuth: (token: string, refreshToken: string, user?: User) => void;
  logout: () => void;
  setRehydrated: (val: boolean) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      user: null,
      rehydrated: false,
      setAuth: (token, refreshToken, user) =>
        set({
          token,
          refreshToken,
          isAuthenticated: true,
          user: user || null,
        }),
      logout: () =>
        set({
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          user: null,
        }),
      setRehydrated: (rehydrated) => set({ rehydrated }),
    }),
    {
      name: "bees-auth",
      onRehydrateStorage: () => (state) => {
        state?.setRehydrated(true);
      },
    },
  ),
);
