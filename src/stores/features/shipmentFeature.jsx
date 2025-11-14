// src/stores/features/shipmentFeature.jsx
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosMerchant from "@/axios";
import { handleError } from "@/utils/helpers";
import toast from "react-hot-toast";

export const getShipments = createAsyncThunk(
    "shipments/getShipments",
    async ({ pageNumber = 1, query = "" }, { rejectWithValue }) => {
        try {
            const response = await axiosMerchant.get(`shipments?page=${pageNumber}&query=${query}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch shipments");
        }
    }
);

export const updateShipment = createAsyncThunk(
    "shipments/updateShipment",
    async ({ form, id }, { rejectWithValue }) => {
        try {
            form.append("id", id);
            const response = await axiosMerchant.post("shipments/update", form);
            toast.success(response.data.message);
            return response.data.data;
        } catch (error) {
            handleError(error);
            return rejectWithValue(error.response?.data?.message || "Failed to update shipment");
        }
    }
);

const shipmentFeature = createSlice({
    name: "shipments",
    initialState: {
        shipments: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getShipments.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        builder.addCase(getShipments.fulfilled, (state, action) => {
            state.loading = false;
            const payload = action.payload?.data;
            if (Array.isArray(payload)) {
                state.shipments = [];
            } else if (payload?.shipments?.data) {
                state.shipments = payload.shipments.data;
            } else {
                state.shipments = [];
            }
        });

        builder.addCase(getShipments.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        builder.addCase(updateShipment.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        builder.addCase(updateShipment.fulfilled, (state, action) => {
            state.loading = false;
            const updatedShipment = action.payload;
            state.shipments = state.shipments.map((shipment) =>
                shipment.id === updatedShipment.id ? updatedShipment : shipment
            );
        });

        builder.addCase(updateShipment.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export default shipmentFeature.reducer;