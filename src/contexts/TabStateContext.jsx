import React, { createContext, useContext, useState, useRef } from 'react';

// Create a context for managing tab states
const TabStateContext = createContext();

export const TabStateProvider = ({ children }) => {
  // Store the component instances for each tab path
  const [components, setComponents] = useState({});
  
  // Store any state data that needs to persist across tab switches
  const tabStateRef = useRef({});
  
  // Register a component for a tab path
  const registerComponent = (path, component) => {
    setComponents(prev => {
      if (prev[path]) return prev;
      return { ...prev, [path]: component };
    });
  };
  
  // Get a component for a tab path
  const getComponent = (path) => {
    return components[path];
  };
  
  // Store state for a tab
  const setTabState = (path, key, value) => {
    if (!tabStateRef.current[path]) {
      tabStateRef.current[path] = {};
    }
    tabStateRef.current[path][key] = value;
  };
  
  // Get state for a tab
  const getTabState = (path, key, defaultValue) => {
    if (!tabStateRef.current[path] || tabStateRef.current[path][key] === undefined) {
      return defaultValue;
    }
    return tabStateRef.current[path][key];
  };
  
  return (
    <TabStateContext.Provider 
      value={{ 
        registerComponent, 
        getComponent, 
        setTabState, 
        getTabState 
      }}
    >
      {children}
    </TabStateContext.Provider>
  );
};

// Hook for consuming the tab state context
export const useTabState = () => {
  const context = useContext(TabStateContext);
  if (!context) {
    throw new Error('useTabState must be used within a TabStateProvider');
  }
  return context;
};