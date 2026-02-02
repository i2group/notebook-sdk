import { getToolViewApi, toolview } from '@i2analyze/notebook-sdk';
import { createContext, useContext, useEffect, useState } from 'react';

export const ToolViewApiContext = createContext<toolview.IToolViewApi | undefined>(undefined);

export function useToolViewApi() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return useContext(ToolViewApiContext)!;
}

export function useGetToolViewApi() {
  const [toolViewApi, setToolViewApi] = useState<toolview.IToolViewApi | undefined>();

  useEffect(() => {
    getToolViewApi().then((api) => {
      setToolViewApi(api);
    });
  }, []);

  return toolViewApi;
}
