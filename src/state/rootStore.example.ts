// This is an example of a Zustand store, use this for secure storage.
// DO NOT USE THIS FILE, create new ones in the state folder.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import secureStorage from "../utils/secureStorage";

interface RootStore {
  someData: number;
  addSomeData: () => void;
}

// Make sure to persist the store using the persist middleware with SecureStore.
const useRootStore = create<RootStore>()(
  persist(
    (set, get) => ({
      someData: 0,
      addSomeData: () => set({ someData: get().someData + 1 }),
    }),
    {
      name: "root-storage",
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);

export default useRootStore;
