import { createSlice } from '@reduxjs/toolkit';

const tabsSlice = createSlice({
  name: 'tabs',
  initialState: {
    tabs: [],       // Array of { id, label, path }
    activeTabId: null,
    cachedComponents: {}, // { [path]: ReactComponent }
  },
  reducers: {
    addTab: (state, action) => {
      const { id, label, path } = action.payload;
      const existingTab = state.tabs.find(tab => tab.id === id);
      
      if (existingTab) {
        // Tab already exists, just make it active
        state.activeTabId = id;
      } else {
        // Tab doesn't exist, add it and make it active
        state.tabs.push({ id, label, path });
        state.activeTabId = id;
      }
    },
    closeTab: (state, action) => {
      const tabId = action.payload;
      state.tabs = state.tabs.filter(tab => tab.id !== tabId);
      delete state.cachedComponents[tabId];
      if (state.activeTabId === tabId) {
        state.activeTabId = state.tabs.length > 0 ? state.tabs[state.tabs.length - 1].id : null;
      }
    },
    setActiveTab: (state, action) => {
      state.activeTabId = action.payload;
    },
    cacheComponent: (state, action) => {
      const { path, component: Component } = action.payload;
      state.cachedComponents[path] = Component;
    },
    resetTabs: (state) => {
      console.log("resetTabs reducer called - clearing tabs state");
      state.tabs = [];
      state.activeTabId = null;
      state.cachedComponents = {};
      console.log("Tabs state cleared:", state);
    },
  },
});

export const { addTab, closeTab, setActiveTab, cacheComponent, resetTabs } = tabsSlice.actions;
export default tabsSlice.reducer;