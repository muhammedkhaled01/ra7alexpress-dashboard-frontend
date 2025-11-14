import { createContext, useContext, useReducer } from "react";
import moment from "@/utils/moment.js";

const FiltersContext = createContext();

const initialFilters = {
    activeFiltersCount: 0,
    status: null,
    facility: null,
    currentPage: 1,
    consignee_name: "",
    consignee_email: "",
    consignee_phone: "",
    consignee_alt_phone: "",
    consignee_country: null,
    consignee_gov: null,
    consignee_state: null,
    consignee_place: null,
    sender_name: "",
    sender_email: "",
    sender_phone: "",
    sender_alt_phone: "",
    sender_country: null,
    sender_gov: null,
    sender_state: null,
    sender_place: null,
    exception_type: null,
    exception_from: "",
    exception_to: "",
    exception_from_time: "",
    exception_to_time: "",
    created_from: "",
    created_to: "",
    created_from_time: "",
    created_to_time: "",
    delivered_from: "",
    delivered_to: "",
    delivered_from_time: "",
    delivered_to_time: "",
    todayOnly: false,
};

const filterKeysToExclude = ['activeFiltersCount', 'currentPage', 'todayOnly', '_v'];

const calculateActiveFiltersCount = (filters) => {
    return Object.keys(filters).filter(key =>
        filters[key] !== null &&
        filters[key] !== "" &&
        !filterKeysToExclude.includes(key)
    ).length;
};

const filtersReducer = (state, action) => {
    switch (action.type) {
        case "SET_FILTERS": {
            const newState = { ...state, ...action.payload, currentPage: 1, todayOnly: false };
            const newActiveFiltersCount = calculateActiveFiltersCount(newState);
            return { ...newState, activeFiltersCount: newActiveFiltersCount };
        }
        case "SET_TODAY_ONLY": {
            const today = moment().format("YYYY-MM-DD");
            const newState = {
                ...state,
                created_from: today,
                created_to: today,
                created_from_time: "00:00",
                created_to_time: "23:59",
                todayOnly: action.payload,
                currentPage: 1,
            };
            const newActiveFiltersCount = calculateActiveFiltersCount(newState);
            return { ...newState, activeFiltersCount: newActiveFiltersCount };
        }
        case "CLEAR_FILTERS":
            return initialFilters;
        case "SET_DEFAULT_COUNTRY": {
            const { countries, defaultCountryName } = action.payload;
            const def = countries.find((c) => c.name === defaultCountryName);
            if (!def) return state;

            const newState = {
                ...state,
                consignee_country: state.consignee_country || { value: def.id, label: def.name },
                currentPage: 1,
                // sender_country: state.sender_country || { value: def.id, label: def.name },
            };
            const newActiveFiltersCount = calculateActiveFiltersCount(newState);
            return { ...newState, activeFiltersCount: newActiveFiltersCount };
        }
        case "RESET_CONSIGNEE_LOCATION": {
            const newState = {
                ...state,
                consignee_gov: null,
                consignee_state: null,
                consignee_place: null,
                currentPage: 1,
            };
            const newActiveFiltersCount = calculateActiveFiltersCount(newState);
            return { ...newState, activeFiltersCount: newActiveFiltersCount };
        }
        case "RESET_SENDER_LOCATION": {
            const newState = {
                ...state,
                sender_gov: null,
                sender_state: null,
                sender_place: null,
                currentPage: 1,
            };
            const newActiveFiltersCount = calculateActiveFiltersCount(newState);
            return { ...newState, activeFiltersCount: newActiveFiltersCount };
        }
        case "SET_CURRENT_PAGE":
            return {
                ...state,
                currentPage: action.payload,
            };
        default:
            return state;
    }
};

export const FiltersProvider = ({ children }) => {
    const [filters, dispatch] = useReducer(filtersReducer, initialFilters);

    const setCurrentPage = (page) => {
        dispatch({ type: "SET_CURRENT_PAGE", payload: page });
    };

    return (
        <FiltersContext.Provider value={{ filters, dispatch, setCurrentPage }}>
            {children}
        </FiltersContext.Provider>
    );
};

export const useFilters = () => {
    const context = useContext(FiltersContext);
    if (!context) {
        throw new Error("useFilters must be used within a FiltersProvider");
    }
    return context;
};