import { createSlice } from '@reduxjs/toolkit';

const shipmentFiltersSlice = createSlice({
  name: 'shipmentFilters',
  initialState: {
    status: null,
    facility: null,
    page: 1,
    todayOnly: false,
    from: null,
    to: null,
    from_time: "00:00",
    to_time: "23:59",
  },
  reducers: {
    setShipmentFilters: (state, action) => {
      return {
        ...state,
        status: action.payload.status || null,
        facility: action.payload.facility || null,
        todayOnly: action.payload.todayOnly || false,
        from: action.payload.from || null,
        to: action.payload.to || null,
        from_time: action.payload.from_time || "00:00",
        to_time: action.payload.to_time || "23:59",
        page: 1,
      };
    },
    setShipmentPage: (state, action) => {
      state.page = action.payload;
    },
    clearShipmentFilters: (state) => {
      return {
        status: null,
        facility: null,
        page: 1,
        todayOnly: false,
        from: null,
        to: null,
        from_time: "00:00",
        to_time: "23:59",
      };
    },
  },
});

export const { setShipmentFilters, setShipmentPage, clearShipmentFilters } = shipmentFiltersSlice.actions;
export default shipmentFiltersSlice.reducer;