import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosMerchant from "../../axios";
import { readCache, writeCache } from "@/lib/idbCache";
import moment from "moment";

const normalizeStatuses = (staticStatuses, systemStatuses) => {
  const normalizedStatic = Object.entries(staticStatuses).map(
    ([key, value]) => ({
      value: key,
      label: value.label,
      description: value.description,
    })
  );

  const normalizedSystem = systemStatuses.map((status) => ({
    value: status.id,
    label: status.label,
    description: status.description,
  }));

  return [...normalizedStatic, ...normalizedSystem];
};

const fetchWithCache = async (key, url, { force = false } = {}) => {
  const cached = await readCache(key);
  const latestTimestamp = force
    ? null
    : cached?.timestamp === "NaN"
    ? null
    : cached?.timestamp;

  // Retrieve the values from local storage.
  const workspaceKey = localStorage.getItem("X-Workspace-Key");
  const workspaceType = localStorage.getItem("X-Workspace-Type");

  // Create an object to hold the headers.
  const headers = {};
  if (workspaceKey) {
    headers["X-Workspace-Key"] = workspaceKey;
  }
  if (workspaceType) {
    headers["X-Workspace-Type"] = workspaceType;
  }

  const res = await axiosMerchant.get(url, {
    // Pass the headers along with the other request parameters.
    headers: headers,
    params: {
      timestamp: latestTimestamp,
      bust: force ? Date.now() : undefined,
    },
  });
  const incoming = res.data.data;

  // لو force وفاضي، رجّع فاضي (علشان ما تعتمدش على الكاش)
  if (force) {
    await writeCache(key, { data: incoming, timestamp: Date.now() / 1000 });
    return { data: incoming, timestamp: Date.now() / 1000 };
  }

  if ((incoming?.length ?? 0) === 0 && cached) {
    return { data: cached.data, timestamp: cached.timestamp };
  }

  const newest = incoming.reduce((max, row) => {
    const ts = moment(row.updated_at).unix() || max;
    return ts > max ? ts : max;
  }, moment(latestTimestamp).unix());

  await writeCache(key, { data: incoming, timestamp: newest });
  return { data: incoming, timestamp: newest };
};
export const getCountries = createAsyncThunk("getCountries", async () => {
  return fetchWithCache("countries", "countries");
});

export const getGovernorates = createAsyncThunk("getGovernorates", async () => {
  return fetchWithCache("governorates", "governorates/all");
});

export const getStates = createAsyncThunk("getStates", async () => {
  return fetchWithCache("states", "states/all");
});

export const getRoles = createAsyncThunk("getRoles", async () => {
  const res = await axiosMerchant.get("roles/all");
  return res.data.data;
});
export const getPermissions = createAsyncThunk("getPermissions", async () => {
  const res = await axiosMerchant.get("permissions/all"); 
  const raw = res?.data?.data ?? res?.data ?? [];
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  return list;
});

export const getCities = createAsyncThunk("getCities", async () => {
  return fetchWithCache("cities", "cities/all");
});

export const getHubs = createAsyncThunk("getHubs", async () => {
  const res = await axiosMerchant.get("hubs/all");
  return res.data.data;
});

export const getStations = createAsyncThunk("getStations", async () => {
  const res = await axiosMerchant.get("stations/all");
  return res.data.data;
});

export const getBranches = createAsyncThunk("getBranches", async () => {
  const res = await axiosMerchant.get("branches/all");
  return res.data.data;
});

export const getShippers = createAsyncThunk("getShippers", async () => {
  return fetchWithCache("shippers", "shippers/all");
});

export const getMerchants = createAsyncThunk("getMerchants", async () => {
  const res = await axiosMerchant.get("merchants/all");
  console.log(res.data);
  return res.data;
});

export const getConsignees = createAsyncThunk("getConsignee", async () => {
  const res = await axiosMerchant.get("consignees/all");
  return res.data;
});

export const getMerchantConsignees = createAsyncThunk(
  "getMerchantConsignees",
  async () => {
    const res = await axiosMerchant.get("merchant/consignees");
    return res.data.data;
  }
);

export const getDrivers = createAsyncThunk("getDrivers", async () => {
  return fetchWithCache("drivers", "users/get-all-drivers");
});

export const getDriversWithBonuses = createAsyncThunk(
  "getDriversWithBonuses",
  async () => {
    const res = await axiosMerchant.get("users/get-all-drivers-with-bonuses");
    return res.data.data;
  }
);

export const getAllDrivers = createAsyncThunk("getAllDrivers", async () => {
  return fetchWithCache("drivers", "drivers/all");
});

export const getUsers = createAsyncThunk("getUsers", async () => {
  const res = await axiosMerchant.get("users/all");
  return res.data;
});

export const getCrmAgents = createAsyncThunk("getCrmAgents", async () => {
  const res = await axiosMerchant.get("users/crm-agents");
  return res.data.data;
});

export const getCompanies = createAsyncThunk("getCompanies", async () => {
  const res = await axiosMerchant.get("companies/all");
  return res.data.data;
});

export const getMerchantAddressBooks = createAsyncThunk(
  "getMerchantAddressBooks",
  async () => {
    const res = await axiosMerchant.get("merchant/address_book/all");
    return res.data.data;
  }
);

export const getDeliveryExceptions = createAsyncThunk(
  "getDeliveryExceptions",
  async () => {
    const res = await axiosMerchant.get("delivery_exceptions/all");
    return res.data.data;
  }
);

export const getShelfCategories = createAsyncThunk(
  "getShelfCategories",
  async () => {
    const res = await axiosMerchant.get("shelf-categories/all");
    return res.data.data;
  }
);

export const getUnits = createAsyncThunk("getUnits", async () => {
  return fetchWithCache("units", "units/all");
});

export const getStatuses = createAsyncThunk("getStatuses", async () => {
  const res = await axiosMerchant.get("statuses/all");
  const { static: staticStatuses, system: systemStatuses } = res.data.data;
  const normalizedStatuses = normalizeStatuses(staticStatuses, systemStatuses);
  return normalizedStatuses;
});

export const getZones = createAsyncThunk("getZones", async () => {
  const res = await axiosMerchant.get("zones/all");
  return res.data.data;
});

export const getPlaces = createAsyncThunk(
  "getPlaces",
  async ({ force = false } = {}) => {
    return fetchWithCache("places", "places/all", { force });
  }
);

export const getFacilities = createAsyncThunk("getFacilities", async () => {
  const res = await axiosMerchant.get("facilities");
  return res.data.data;
});

export const getFacilityTypes = createAsyncThunk(
  "getFacilityTypes",
  async () => {
    const res = await axiosMerchant.get("facility_types");
    return res.data.data;
  }
);

export const getAccountables = createAsyncThunk("getAccountables", async () => {
  const res = await axiosMerchant.get("accountables");
  return res.data.data;
});

export const getSystemDeliveryExceptions = createAsyncThunk(
  "getSystemDeliveryExceptions",
  async () => {
    const res = await axiosMerchant.get("system_delivery_exceptions");
    return res.data;
  }
);

export const getTrucks = createAsyncThunk("getTrucks", async () => {
  const res = await axiosMerchant.get("trucks/all");
  return res.data.data;
});

export const getTruckDrivers = createAsyncThunk("getTruckDrivers", async () => {
  const res = await axiosMerchant.get("truck_drivers/all");
  return res.data.data;
});

// HRM
export const getEmployeePositions = createAsyncThunk(
  "getEmployeePositions",
  async () => {
    const res = await axiosMerchant.get("employee_positions/all");
    return res.data.data;
  }
);

export const getEmployeeDepartments = createAsyncThunk(
  "getEmployeeDepartments",
  async () => {
    const res = await axiosMerchant.get("employee_departments/all");
    return res.data.data;
  }
);

export const getEmployees = createAsyncThunk("getEmployees", async () => {
  const res = await axiosMerchant.get("employees/all");
  return res.data.data;
});

export const getManagers = createAsyncThunk("getManagers", async () => {
  const res = await axiosMerchant.get("users/warehouse_managers");
  return res.data;
});

// HRM - Leave & Hierarchy Async Thunks
export const getHierarchyLevels = createAsyncThunk(
  "getHierarchyLevels",
  async () => {
    const res = await axiosMerchant.get("hierarchy_levels/all");
    return res.data.data;
  }
);

export const getLeaveReasons = createAsyncThunk("getLeaveReasons", async () => {
  const res = await axiosMerchant.get("leave_reasons/all");
  return res.data.data;
});

export const getLeaveRequests = createAsyncThunk(
  "getLeaveRequests",
  async () => {
    const res = await axiosMerchant.get("leave_requests/all");
    return res.data.data;
  }
);

const ajaxFeature = createSlice({
  name: "Ajax",
  initialState: {
    countries: null,
    countriesTimestamp: null,
    countriesLoading: false,
    states: null,
    statesLoading: false,
    statesTimestamp: null,
    governorates: null,
    governoratesLoading: false,
    governoratesTimestamp: null,
    cities: null,
    citiesLoading: false,
    driversWithBonusLoading: false,
    citiesTimestamp: null,
    permissions: null,
    places: null,
    placesLoading: false,
    placesTimestamp: null,
    hubs: null,
    shippers: null,
    shippersLoading: false,
    shippersTimestamp: null,
    crmAgents: null,
    managers: null,
    merchants: null,
    merchantsLoading: false,
    merchantsTimestamp: null,
    roles: null,
    consignees: null,
    merchantConsignees: null,
    users: null,
    usersTimestamp: null,
    drivers: null,
    driversTimestamp: null,
    driversWithBonuses: null,
    allDrivers: null,
    allDriversTimestamp: null,
    shelfcategories: null,
    units: null,
    unitsLoading: false,
    unitsTimestamp: null,
    shipment_statuses: null,
    deliveryExceptions: null,
    systemDeliveryExceptions: null,
    zones: null,
    facilities: null,
    facilityTypes: null,
    employeePositions: null,
    employeeDepartments: null,
    employees: null,
    hierarchyLevels: null,
    leaveReasons: null,
    leaveRequests: null,
    trucks: null,
    truck_drivers: null,
    accountables: null,
    merchantAddressBooks: null,
    loading: false,
    error: false,
  },
  extraReducers: (builder) => {
    // Hubs
    builder.addCase(getHubs.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getHubs.fulfilled, (state, action) => {
      state.loading = false;
      state.hubs = action.payload;
    });
    builder.addCase(getHubs.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to load hubs";
    });

    builder.addCase(getCountries.pending, (state) => {
      state.countriesLoading = true;
    });

    builder.addCase(getCountries.fulfilled, (state, action) => {
      state.countriesLoading = false;
      state.countries = action.payload.data;
      state.countriesTimestamp = action.payload.timestamp;
    });

    builder.addCase(getCountries.rejected, (state) => {
      state.countriesLoading = false;
    });

    //governorates

    builder.addCase(getGovernorates.pending, (state) => {
      state.governoratesLoading = true;
    });

    builder.addCase(getGovernorates.fulfilled, (state, action) => {
      state.governoratesLoading = false;
      state.governorates = action.payload.data;
      state.governoratesTimestamp = action.payload.timestamp;
    });
    // PERMISSIONS
    builder.addCase(getPermissions.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getPermissions.fulfilled, (state, action) => {
      state.loading = false;
      state.permissions = action.payload; // Array مضمونة
    });
    builder.addCase(getPermissions.rejected, (state) => {
      state.loading = false;
    });

    builder.addCase(getGovernorates.rejected, (state) => {
      state.governoratesLoading = false;
    });

    builder.addCase(getStates.pending, (state) => {
      state.statesLoading = true;
    });

    builder.addCase(getStates.fulfilled, (state, action) => {
      state.statesLoading = false;
      state.states = action.payload.data;
      state.statesTimestamp = action.payload.timestamp;
    });

    builder.addCase(getStates.rejected, (state) => {
      state.statesLoading = false;
    });

    builder.addCase(getCities.pending, (state) => {
      state.citiesLoading = true;
    });

    builder.addCase(getCities.fulfilled, (state, action) => {
      state.citiesLoading = false;
      state.cities = action.payload.data;
      state.citiesTimestamp = action.payload.timestamp;
    });

    builder.addCase(getCities.rejected, (state) => {
      state.citiesLoading = false;
    });

    // Stations
    builder.addCase(getStations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getStations.fulfilled, (state, action) => {
      state.loading = false;
      state.stations = action.payload;
    });
    builder.addCase(getStations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to load hubs";
    });

    // Branches
    builder.addCase(getBranches.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getBranches.fulfilled, (state, action) => {
      state.loading = false;
      state.branches = action.payload;
    });
    builder.addCase(getBranches.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to load hubs";
    });

    // Shippers
    builder.addCase(getShippers.pending, (state) => {
      state.shippersLoading = true;
      state.error = null;
    });
    builder.addCase(getShippers.fulfilled, (state, action) => {
      state.shippersLoading = false;
      state.shippers = action.payload.data;
      state.shippersTimestamp = action.payload.timestamp;
    });
    builder.addCase(getShippers.rejected, (state, action) => {
      state.shippersLoading = false;
      state.error = action.error.message;
    });

    // Merchants
    builder.addCase(getMerchants.pending, (state) => {
      state.merchantsLoading = true;
      state.error = null;
    });
    builder.addCase(getMerchants.fulfilled, (state, action) => {
      state.merchantsLoading = false;
      state.merchants = action.payload.data;
      state.merchantsTimestamp = action.payload.timestamp;
    });
    builder.addCase(getMerchants.rejected, (state, action) => {
      state.merchantsLoading = false;
      state.error = action.error.message;
    });

    // ROLES
    builder.addCase(getRoles.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getRoles.fulfilled, (state, action) => {
      state.loading = false;
      state.roles = action.payload;
    });

    builder.addCase(getRoles.rejected, (state) => {
      state.loading = false;
    });

    // CONSIGNEES
    builder.addCase(getConsignees.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getConsignees.fulfilled, (state, action) => {
      state.loading = false;
      state.consignees = action.payload.data;
      state.consigneesTimestamp = action.payload.timestamp;
    });

    builder.addCase(getConsignees.rejected, (state) => {
      state.loading = false;
    });

    // MERCHANT CONSIGNEES
    builder.addCase(getMerchantConsignees.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getMerchantConsignees.fulfilled, (state, action) => {
      state.loading = false;
      state.merchantConsignees = action.payload;
    });

    builder.addCase(getMerchantConsignees.rejected, (state) => {
      state.loading = false;
    });

    // CONSIGNEES
    builder.addCase(getDrivers.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getDrivers.fulfilled, (state, action) => {
      state.loading = false;
      state.drivers = action.payload.data;
      state.driversTimestamp = action.payload.timestamp;
    });

    builder.addCase(getDrivers.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(getDriversWithBonuses.pending, (state) => {
      state.driversWithBonusLoading = true;
    });

    builder.addCase(getDriversWithBonuses.fulfilled, (state, action) => {
      state.driversWithBonusLoading = false;
      state.driversWithBonuses = action.payload.data;
    });

    builder.addCase(getDriversWithBonuses.rejected, (state) => {
      state.driversWithBonusLoading = false;
    });
    // CONSIGNEES
    builder.addCase(getAllDrivers.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getAllDrivers.fulfilled, (state, action) => {
      state.loading = false;
      state.allDrivers = action.payload.data;
      state.allDriversTimestamp = action.payload.timestamp;
    });

    builder.addCase(getAllDrivers.rejected, (state) => {
      state.loading = false;
    });
    // Users
    builder.addCase(getUsers.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.users = action.payload.data;
      state.usersTimestamp = action.payload.timestamp;
    });

    builder.addCase(getUsers.rejected, (state) => {
      state.loading = false;
    });

    // DELIVERY EXCEPTION
    builder.addCase(getDeliveryExceptions.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getDeliveryExceptions.fulfilled, (state, action) => {
      state.loading = false;
      state.deliveryExceptions = action.payload;
    });

    builder.addCase(getDeliveryExceptions.rejected, (state) => {
      state.loading = false;
    });

    // Shelf categories
    builder.addCase(getShelfCategories.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getShelfCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.shelfcategories = action.payload;
    });

    builder.addCase(getShelfCategories.rejected, (state) => {
      state.loading = false;
    });

    // UNITS
    builder.addCase(getUnits.pending, (state) => {
      state.unitsLoading = true;
    });

    builder.addCase(getUnits.fulfilled, (state, action) => {
      state.unitsLoading = false;
      state.units = action.payload.data;
      state.unitsTimestamp = action.payload.timestamp;
    });

    builder.addCase(getUnits.rejected, (state) => {
      state.unitsLoading = false;
    });

    // Shipment Statuses
    builder.addCase(getStatuses.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getStatuses.fulfilled, (state, action) => {
      state.loading = false;
      state.shipment_statuses = action.payload;
    });

    builder.addCase(getStatuses.rejected, (state) => {
      state.loading = false;
    });

    // SYSTEM DELIVERY EXCEPTION
    builder.addCase(getSystemDeliveryExceptions.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getSystemDeliveryExceptions.fulfilled, (state, action) => {
      state.loading = false;
      state.systemDeliveryExceptions = action.payload;
    });

    builder.addCase(getSystemDeliveryExceptions.rejected, (state) => {
      state.loading = false;
    });

    // ZONES
    builder.addCase(getZones.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getZones.fulfilled, (state, action) => {
      state.loading = false;
      state.zones = action.payload;
    });

    builder.addCase(getZones.rejected, (state) => {
      state.loading = false;
    });

    // PLACES
    builder.addCase(getPlaces.pending, (state) => {
      state.placesLoading = true;
    });

    builder.addCase(getPlaces.fulfilled, (state, action) => {
      state.placesLoading = false;
      state.places = action.payload.data;
      state.placesTimestamp = action.payload.timestamp;
    });

    builder.addCase(getPlaces.rejected, (state) => {
      state.placesLoading = false;
    });

    // FACILITY TYPES
    builder.addCase(getFacilityTypes.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getFacilityTypes.fulfilled, (state, action) => {
      state.loading = false;
      state.facilityTypes = action.payload;
    });

    builder.addCase(getFacilityTypes.rejected, (state) => {
      state.loading = false;
    });

    // FACILITIES
    builder.addCase(getFacilities.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getFacilities.fulfilled, (state, action) => {
      state.loading = false;
      state.facilities = action.payload;
    });

    builder.addCase(getFacilities.rejected, (state) => {
      state.loading = false;
    });

    // ACCOUNTABLES
    builder.addCase(getAccountables.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getAccountables.fulfilled, (state, action) => {
      state.loading = false;
      state.accountables = action.payload;
    });

    builder.addCase(getAccountables.rejected, (state) => {
      state.loading = false;
    });

    // HRM
    builder.addCase(getEmployeePositions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getEmployeePositions.fulfilled, (state, action) => {
      state.loading = false;
      state.employeePositions = action.payload;
    });
    builder.addCase(getEmployeePositions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to load employee positions";
    });

    // Employee Departments

    builder.addCase(getEmployeeDepartments.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getEmployeeDepartments.fulfilled, (state, action) => {
      state.loading = false;
      state.employeeDepartments = action.payload;
    });

    builder.addCase(getEmployeeDepartments.rejected, (state) => {
      state.loading = false;
    });

    // Employees
    builder.addCase(getEmployees.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getEmployees.fulfilled, (state, action) => {
      state.loading = false;
      state.employees = action.payload;
    });
    builder.addCase(getEmployees.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to load employees";
    });
    // Hierarchy Levels
    builder.addCase(getHierarchyLevels.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getHierarchyLevels.fulfilled, (state, action) => {
      state.loading = false;
      state.hierarchyLevels = action.payload;
    });
    builder.addCase(getHierarchyLevels.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to load hierarchy levels";
    });

    // Leave Reasons
    builder.addCase(getLeaveReasons.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getLeaveReasons.fulfilled, (state, action) => {
      state.loading = false;
      state.leaveReasons = action.payload;
    });
    builder.addCase(getLeaveReasons.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to load leave reasons";
    });

    // Leave Requests
    builder.addCase(getLeaveRequests.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getLeaveRequests.fulfilled, (state, action) => {
      state.loading = false;
      state.leaveRequests = action.payload;
    });
    builder.addCase(getLeaveRequests.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to load leave requests";
    });

    // TRUCKS
    builder.addCase(getTrucks.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getTrucks.fulfilled, (state, action) => {
      state.loading = false;
      state.trucks = action.payload;
    });

    builder.addCase(getTrucks.rejected, (state) => {
      state.loading = false;
    });

    // TRUCK DRIVERS
    builder.addCase(getTruckDrivers.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getTruckDrivers.fulfilled, (state, action) => {
      state.loading = false;
      state.truck_drivers = action.payload;
    });

    builder.addCase(getTruckDrivers.rejected, (state) => {
      state.loading = false;
    });

    builder.addCase(getCompanies.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getCompanies.fulfilled, (state, action) => {
      state.loading = false;
      state.companies = action.payload;
    });

    builder.addCase(getCompanies.rejected, (state) => {
      state.loading = false;
    });

    // Merchant Address Books
    builder.addCase(getMerchantAddressBooks.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getMerchantAddressBooks.fulfilled, (state, action) => {
      state.loading = false;
      state.merchantAddressBooks = action.payload;
    });

    builder.addCase(getMerchantAddressBooks.rejected, (state) => {
      state.loading = false;
    });

    // CRM AGENTS
    builder.addCase(getCrmAgents.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getCrmAgents.fulfilled, (state, action) => {
      state.loading = false;
      state.crmAgents = action.payload.data;
    });

    builder.addCase(getCrmAgents.rejected, (state) => {
      state.loading = false;
    });

    // getManagers
    builder.addCase(getManagers.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getManagers.fulfilled, (state, action) => {
      state.loading = false;
      state.managers = action.payload.data;
    });

    builder.addCase(getManagers.rejected, (state) => {
      state.loading = false;
    });
  },
});

export default ajaxFeature.reducer;
