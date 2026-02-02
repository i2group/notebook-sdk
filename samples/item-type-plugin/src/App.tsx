import React from 'react';
import { ToolView } from 'components/ToolView';
import { ToolViewApiContext, useGetToolViewApi } from './hooks/useToolViewApi';

export const App = () => {
  const toolViewApi = useGetToolViewApi();

  if (toolViewApi) {
    return (
      <ToolViewApiContext.Provider value={toolViewApi}>
        <ToolView />
      </ToolViewApiContext.Provider>
    );
  } else {
    return null;
  }
};
