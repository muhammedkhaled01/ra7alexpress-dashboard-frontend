import { configureStore } from "@reduxjs/toolkit"
import authFeature from "./features/authFeature"
import settingFeature from "./features/settingFeature"
import ajaxFeature from "./features/ajaxFeature"
import shipmentFeature from "./features/shipmentFeature"
import dashboardFeature from "./features/dashboardFeature"
import tabsFeature from "./features/tabsFeature"
import shipmentFiltersFeature from "./features/shipmentFiltersFeature";

const store = configureStore({
    reducer: {
        auth: authFeature,
        ajax: ajaxFeature,
        shipment: shipmentFeature,
        dashboard: dashboardFeature,
        setting: settingFeature,
        tabs: tabsFeature,
        shipmentFilters: shipmentFiltersFeature,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredPaths: ['tabs.cachedComponents'],
                ignoredActions: ['tabs/cacheComponent'],
            },
        }),
})

export default store