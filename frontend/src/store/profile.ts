import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Address = {
  id: string;
  label: string; // "Home", "Office"
  recipient: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  isDefault?: boolean;
};

export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
};

type ProfileState = {
  profile: Profile;
  addresses: Address[];
  setProfile: (p: Partial<Profile>) => void;
  addAddress: (a: Omit<Address, "id">) => void;
  updateAddress: (id: string, a: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  setDefault: (id: string) => void;
};

const id = () => Math.random().toString(36).slice(2, 10);

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      profile: { fullName: "", email: "", phone: "" },
      addresses: [],
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      addAddress: (a) =>
        set((s) => {
          const newAddr: Address = { ...a, id: id(), isDefault: s.addresses.length === 0 };
          return { addresses: [...s.addresses, newAddr] };
        }),
      updateAddress: (id, a) =>
        set((s) => ({ addresses: s.addresses.map((x) => (x.id === id ? { ...x, ...a } : x)) })),
      removeAddress: (id) =>
        set((s) => {
          const remaining = s.addresses.filter((x) => x.id !== id);
          if (remaining.length && !remaining.some((r) => r.isDefault))
            remaining[0].isDefault = true;
          return { addresses: remaining };
        }),
      setDefault: (id) =>
        set((s) => ({
          addresses: s.addresses.map((x) => ({ ...x, isDefault: x.id === id })),
        })),
    }),
    { name: "bees-profile" },
  ),
);
