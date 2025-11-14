import {
  Outlet,
  useLocation,
  useNavigate,
  useOutlet,
  Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getUser } from "@/stores/features/authFeature";
import { getDefaultSettings } from "@/stores/features/settingFeature";
import Header from "./Layouts/Header";
import Sidebar from "./Layouts/Sidebar";
import Loader from "../Loader";
import { SidebarProvider } from "../ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { X } from "lucide-react";
import ErrorBoundary from "@/Error/ErrorBoundry";
import { useLanguage } from "@/contexts/LanguageProvider";
import Tab from "../ui/Tab";
import { useTranslation } from "react-i18next";
import { addTab, closeTab, setActiveTab } from '@/stores/features/tabsFeature';
import { ImportProgressProvider } from "@/contexts/ImportProgressProvider";
import { FiltersProvider } from "@/contexts/ShipmentFiltersContext";

// Performance constants
const MAX_CACHED_TABS = 10; // Limit cached tabs to prevent memory issues
const CLEANUP_INTERVAL = 300000; // 5 minutes cleanup interval
const INACTIVE_TAB_THRESHOLD = 600000; // 10 minutes threshold for inactive tabs

export function AdminLayout() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { tabs, activeTabId } = useSelector((state) => state.tabs);
  const navigate = useNavigate();
  const location = useLocation();

  // Enhanced component caching with performance optimizations
  const tabComponents = useRef({});
  const tabStates = useRef({});
  const tabConfigCache = useRef(new Map());
  const cleanupInterval = useRef(null);
  const currentOutlet = useOutlet();
  const { t } = useTranslation();
  const { language } = useLanguage();

  // Memoized normalize path function
  const normalizePath = useCallback((path) => {
    return path === "/" ? "/dashboard" : path;
  }, []);

  // Get decimal precision from Redux store
  const { decimalPrecision } = useSelector((state) => state.setting);

  // Load user data and decimal precision if not available
  useEffect(() => {
    if (!user) {
      dispatch(getUser());
    } else if (decimalPrecision === undefined) {
      // Only fetch if decimal precision is not already loaded
      dispatch(getDefaultSettings())
        .unwrap()
        .catch((error) => {
          console.error('Failed to load decimal precision:', error);
        });
    }
  }, [user, dispatch, decimalPrecision]);

  // Memoized label generation
  const getLabelFromPath = useCallback((path) => {
    const normalizedPath = normalizePath(path);
    const segments = normalizedPath.split("/").filter(Boolean);

    if (segments.length === 0) return "Dashboard";

    const lastSegment = segments[segments.length - 1];
    const isNumeric = /^\d+$/.test(lastSegment);

    if (isNumeric && segments.length >= 2) {
      const previousSegment = segments[segments.length - 2];
      return `${previousSegment.charAt(0).toUpperCase()}${previousSegment.slice(
        1
      )} - ${lastSegment}`;
    }

    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  }, [normalizePath]);

  const getTabId = useCallback((pathname) => `tab-${normalizePath(pathname)}`, [normalizePath]);

  // Optimized cleanup function
  const cleanupInactiveTabs = useCallback(() => {
    const now = Date.now();
    const tabsToCleanup = [];

    // Find tabs that haven't been accessed recently
    Object.keys(tabStates.current).forEach(path => {
      const state = tabStates.current[path];
      if (state && (now - state.lastAccessed) > INACTIVE_TAB_THRESHOLD) {
        tabsToCleanup.push(path);
      }
    });

    // Clean up old tabs if we exceed the limit
    const cachedTabsCount = Object.keys(tabComponents.current).length;
    if (cachedTabsCount > MAX_CACHED_TABS) {
      const sortedTabs = Object.keys(tabStates.current)
        .map(path => ({ path, lastAccessed: tabStates.current[path]?.lastAccessed || 0 }))
        .sort((a, b) => a.lastAccessed - b.lastAccessed);

      const excessTabs = sortedTabs.slice(0, cachedTabsCount - MAX_CACHED_TABS);
      tabsToCleanup.push(...excessTabs.map(tab => tab.path));
    }

    // Perform cleanup
    tabsToCleanup.forEach(path => {
      const currentActiveTab = tabs.find(tab => tab.id === activeTabId);
      // Don't cleanup the currently active tab
      if (currentActiveTab?.path !== path) {
        delete tabComponents.current[path];
        delete tabStates.current[path];
        tabConfigCache.current.delete(path);
      }
    });
  }, [tabs, activeTabId]);

  // Setup cleanup interval
  useEffect(() => {
    cleanupInterval.current = setInterval(cleanupInactiveTabs, CLEANUP_INTERVAL);
    return () => {
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
    };
  }, [cleanupInactiveTabs]);

  // Cache the mounted outlet instance for the currently active tab.  We keep the *instance* so
  // its internal state survives when the tab becomes inactive.
  useEffect(() => {
    if (!currentOutlet) return;
    if (currentOutlet.type === Navigate) return; // skip caching redirect elements

    const normalizedPath = normalizePath(location.pathname);

    // Store the instance only once.
    if (!tabComponents.current[normalizedPath]) {
      tabComponents.current[normalizedPath] = currentOutlet;
    }

    // Track last access time for cleanup logic
    const now = Date.now();
    tabStates.current[normalizedPath] = {
      initialized: true,
      lastAccessed: now,
    };
  }, [currentOutlet, location.pathname, normalizePath]);

  // Sync URL → Redux
  useEffect(() => {
    const normalizedPath = normalizePath(location.pathname);
    const tabId = `tab-${normalizedPath}`;
    const label = getLabelFromPath(normalizedPath);

    // Check if tab already exists before dispatching
    const existingTab = tabs.find(tab => tab.id === tabId);
    if (!existingTab) {
      dispatch(addTab({ id: tabId, label, path: normalizedPath }));
    } else {
      dispatch(setActiveTab(tabId));
    }
  }, [location.pathname, tabs, dispatch, normalizePath, getLabelFromPath]);

  // Handle tab close
  const handleCloseTab = (e, tabId) => {
    e.stopPropagation();
    dispatch(closeTab(tabId));
    console.log(tabId);
    // Navigate to the last tab or dashboard
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        navigate(remainingTabs[remainingTabs.length - 1].path);
      } else {
        navigate('/dashboard');
      }
    }
  };

  // Handle tab opening from sidebar
  const handleTabOpen = useCallback((tabInfo) => {
    const normalizedPath = normalizePath(tabInfo.path);
    const tabId = `tab-${normalizedPath}`;
    const label = tabInfo.label || getLabelFromPath(normalizedPath);
    console.log(normalizedPath, label, tabId, tabInfo);

    // Check if tab already exists before dispatching
    const existingTab = tabs.find(tab => tab.id === tabId);
    if (!existingTab) {
      dispatch(addTab({ id: tabId, label, path: normalizedPath }));
    } else {
      dispatch(setActiveTab(tabId));
    }
    navigate(normalizedPath, { state: { tabLabel: label } });
  }, [dispatch, normalizePath, navigate, getLabelFromPath, tabs]);

  const renderedTabs = tabs.map((tab) => {
    const isActive = tab.id === activeTabId;
    const cachedComponent = tabComponents.current[tab.path];

    return (
      <TabsContent
        key={tab.id}
        value={tab.id}
        className={`mt-4 ${isActive ? "min-h-[300px]" : ""}`}
        forceMount={true}
      >
        <div
          style={{
            display: isActive ? 'block' : 'none'
          }}
        >
          {cachedComponent || (isActive && <Outlet />)}
        </div>
      </TabsContent>
    );
  });

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen w-screen">
        <Loader />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <FiltersProvider>
        <ImportProgressProvider>
          <SidebarProvider>
            <Sidebar onTabOpen={handleTabOpen} />
            <div className="flex flex-col w-full overflow-x-hidden">
              <Header />
              <main className="w-full flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {tabs.length > 0 ? (
                  <Tabs
                    dir={language === "ar" ? "rtl" : "ltr"}
                    value={activeTabId}
                    className="relative"
                  >
                    <TabsList className="flex w-full flex-wrap h-fit gap-x-2">
                      {tabs.map((tab) => {
                        console.log(activeTabId);
                        return (
                          <Tab
                            key={tab.id}
                            tab={tab}
                            setActiveTab={setActiveTab}
                            handleCloseTab={handleCloseTab}
                            language={language}
                            forceMount={true}
                          />
                        )
                      })}
                    </TabsList>
                    {renderedTabs}
                  </Tabs>
                ) : (
                  <div className="flex items-center justify-center h-full p-8 text-muted-foreground">
                    {t("Select an item from the sidebar to begin")}
                  </div>
                )}
              </main>
            </div>
          </SidebarProvider>
        </ImportProgressProvider>
      </FiltersProvider>
    </ErrorBoundary>
  );
}
