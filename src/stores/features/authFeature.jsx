import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosMerchant from "../../axios";
import toast from "react-hot-toast";
import router from "@/router";
import { resetTabs } from "./tabsFeature";

export const login = createAsyncThunk("login", async (formData, { rejectWithValue }) => {
  try {
    const res = await axiosMerchant.post(
      `${import.meta.env.VITE_API_URL}login`,
      formData
    );
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Login failed");
  }
}
);

export const getUser = createAsyncThunk("getUser", async () => {
  const res = await axiosMerchant.get("user");
  return res.data;
});

export const logout = createAsyncThunk(
  "Logout",
  async (authContext, { rejectWithValue, dispatch }) => {
    try {
      console.log("Logout started - dispatching resetTabs");
      dispatch(resetTabs());
      console.log("resetTabs dispatched");
      
      const res = await axiosMerchant.post(
        `${import.meta.env.VITE_API_URL}logout`
      );
      toast.success("Logged out.");

      authContext.setToken(null);
      authContext.setUser(null);
      authContext.setWorkSpace(null);

      // Add a small delay to ensure Redux state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("Redirecting to login page");
      // router.push({ name: "Login" });
      window.location.href = "/login";

      return res.data;
    } catch (error) {
      console.error("Logout error:", error);
      return rejectWithValue(error.response?.data?.message || "Logout failed");
    }
  }
);

const authFeature = createSlice({
  name: "Auth",
  initialState: {
    user: null,
    data: null,
    loading: false,
    error: false,
  },
  extraReducers: (builder) => {
    // login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false
      state.data = action.payload
      state.user = action.payload.user
    });

    builder.addCase(login.rejected, (state, action) => {
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

    // getUser
    builder.addCase(getUser.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(getUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    });

    builder.addCase(getUser.rejected, (state, action) => {
      state.loading = false;
    });
  },
});

export default authFeature.reducer;
