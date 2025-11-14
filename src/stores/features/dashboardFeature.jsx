import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosMerchant from "@/axios";

export const getQuickStats = createAsyncThunk(
    "dashboard/getQuickStats",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosMerchant.get(`quick-stats`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch quick stats");
        }
    }
);

export const getDashboard = createAsyncThunk(
    "dashboard/getDashboard",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosMerchant.get(`overview`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch dashboard");
        }
    }
);

export const getDailySummary = createAsyncThunk(
    "dashboard/getDailySummary",
    async (date, { rejectWithValue }) => {
        try {
            const params = date ? { date } : {};
            const response = await axiosMerchant.get(`daily-summary`, { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch daily summary");
        }
    }
);

const dashboardFeature = createSlice({
    name: "dashboard",
    initialState: {
        dashboard: [],
        quickStats: null,
        dailySummary: null,
        loading: false,
        error: null,
    },
    extraReducers: (builder) => {
        builder.addCase(getDashboard.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        builder.addCase(getDashboard.fulfilled, (state, action) => {
            state.loading = false;
            state.dashboard = action.payload.data;
        });

        builder.addCase(getDashboard.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        builder.addCase(getQuickStats.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        builder.addCase(getQuickStats.fulfilled, (state, action) => {
            state.loading = false;
            state.quickStats = action.payload.data;
        });

        builder.addCase(getQuickStats.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        builder.addCase(getDailySummary.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        builder.addCase(getDailySummary.fulfilled, (state, action) => {
            state.loading = false;
            state.dailySummary = action.payload.data;
        });

        builder.addCase(getDailySummary.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export default dashboardFeature.reducer;
