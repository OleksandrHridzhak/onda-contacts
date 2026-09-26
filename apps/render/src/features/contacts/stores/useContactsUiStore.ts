import { create } from "zustand";
import type { ContactSource } from "@onda/shared";

export type ContactsSort = "name" | "recent" | "lastContacted";

interface ContactsUiState {
  search: string;
  tagId: string | null;
  source: ContactSource | null;
  favoritesOnly: boolean;
  sort: ContactsSort;
  setSearch: (search: string) => void;
  setTagId: (tagId: string | null) => void;
  setSource: (source: ContactSource | null) => void;
  setFavoritesOnly: (favoritesOnly: boolean) => void;
  setSort: (sort: ContactsSort) => void;
  resetFilters: () => void;
}

export const useContactsUiStore = create<ContactsUiState>((set) => ({
  search: "",
  tagId: null,
  source: null,
  favoritesOnly: false,
  sort: "name",
  setSearch: (search) => set({ search }),
  setTagId: (tagId) => set({ tagId }),
  setSource: (source) => set({ source }),
  setFavoritesOnly: (favoritesOnly) => set({ favoritesOnly }),
  setSort: (sort) => set({ sort }),
  resetFilters: () =>
    set({ search: "", tagId: null, source: null, favoritesOnly: false }),
}));
