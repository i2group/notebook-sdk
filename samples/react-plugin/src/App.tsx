import { getToolViewApi, toolview } from '@i2analyze/notebook-sdk';
import { useEffect, useState } from 'react';

import ToolView from './ToolView';
import { ToolViewApiContext } from './useToolViewApi';

export default function App() {
  const [toolViewApi, setToolViewApi] = useState<
    toolview.IToolViewApi | undefined
  >();

  useEffect(() => {
    getToolViewApi().then((api) => {
      setToolViewApi(api);
    });
  }, []);

  if (toolViewApi) {
    return (
      <ToolViewApiContext.Provider value={toolViewApi}>
        <ToolView />
      </ToolViewApiContext.Provider>
    );
  } else {
    return null;
  }
}
