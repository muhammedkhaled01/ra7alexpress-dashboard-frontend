import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosMerchant from '../../axios';

export const updateSetting = createAsyncThunk("updateSetting", async (form) => {
    const res = await axiosMerchant.post('api/admin/profile/update', form);
    return res.data;
});

export const getSetting = createAsyncThunk("getSetting", async () => {
    const res = await axiosMerchant.get('api/admin/settings');
    return res.data;
});

export const getDefaultSettings = createAsyncThunk(
    'settings/getDefaultSettings',
    async () => {
        const response = await axiosMerchant.get('/settings/get-default-settings');
        // Return the full default settings object
        return response.data.data?.default_settings || {};
    }
);

export const logout = createAsyncThunk("api/logout", async (auth) => {
    const authContext = auth;
    authContext.setToken(null);
    authContext.setUser(null);
    const res = await axiosMerchant.post('api/logout');
    return res.data;
});

const settingFeature = createSlice({
    name: 'setting',
    initialState: {
        data: null,
        loading: false,
        error: false,
        decimalPrecision: undefined,
        decimalPrecisionLoading: false,
        decimalPrecisionError: null,
        currencyEnglishName: "EGP",
        currencyArabicName: "ر.ع",
    },
    extraReducers: (builder) => {
        // login
        builder.addCase(updateSetting.pending, (state) => {
            state.loading = true;
        });

        builder.addCase(updateSetting.fulfilled, (state, action) => {
            state.loading = false;
            state.data = action.payload;
        });

        builder.addCase(updateSetting.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // logout
        builder.addCase(logout.pending, (state) => {
            state.loading = true;
        });

        builder.addCase(logout.fulfilled, (state, action) => {
            state.loading = false;
            state.data = null;
            state.user = null;
        });

        builder.addCase(logout.rejected, (state, action) => {
            state.loading = false;
        });

        // getSetting
        builder.addCase(getSetting.pending, (state) => {
            state.loading = true;
        });

        builder.addCase(getSetting.fulfilled, (state, action) => {
            state.loading = false;
            state.data = action.payload.data;
        });

        builder.addCase(getSetting.rejected, (state, action) => {
            state.loading = false;
        });

        // getDefaultSettings
        builder.addCase(getDefaultSettings.pending, (state) => {
            state.decimalPrecisionLoading = true;
        });

        builder.addCase(getDefaultSettings.fulfilled, (state, action) => {
            state.decimalPrecisionLoading = false;
            state.decimalPrecision = action.payload?.decimal_precision?.value || '3';
            state.currencyEnglishName = action.payload?.currency?.value ? JSON.parse(action.payload.currency.value).en : undefined;
            state.currencyArabicName = action.payload?.currency?.value ? JSON.parse(action.payload.currency.value).ar : undefined;
        });

        builder.addCase(getDefaultSettings.rejected, (state, action) => {
            state.decimalPrecisionLoading = false;
        });
    }
});

export default settingFeature.reducer;
