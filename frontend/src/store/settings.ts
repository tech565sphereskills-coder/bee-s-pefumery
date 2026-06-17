import { create } from "zustand";
import axios from "axios";

type SettingsState = {
  settings: any | null;
  fetchSettings: () => Promise<void>;
};

export const useSettings = create<SettingsState>((set) => ({
  settings: null,
  fetchSettings: async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/settings/1/");
      set({ settings: res.data });
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  },
}));
