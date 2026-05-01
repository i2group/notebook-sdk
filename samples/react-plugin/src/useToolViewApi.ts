import { toolview } from '@i2analyze/notebook-sdk';
import { createContext, useContext } from 'react';

export const ToolViewApiContext = createContext<
  toolview.IToolViewApi | undefined
>(undefined);

export function useToolViewApi() {
  return useContext(ToolViewApiContext)!;
}
