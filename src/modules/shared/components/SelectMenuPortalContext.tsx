import { createContext, useContext } from 'react';

export const SelectMenuPortalContext = createContext<HTMLElement | null>(null);

export function useSelectMenuPortalTarget(): HTMLElement | null {
  return useContext(SelectMenuPortalContext);
}
