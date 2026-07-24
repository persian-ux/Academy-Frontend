import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { login as loginApi, signup as signupApi, persistAuth, clearAuth, getStoredUser, getStoredToken, type AuthUser, type LoginRequest, type SignupRequest } from "@/services/authService";

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: getStoredUser(),
  token: getStoredToken(),
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await loginApi(data);
      if (!response.success || !response.token || !response.user) {
        return rejectWithValue(response.message || "Login failed");
      }
      persistAuth(response.token, response.user);
      return { token: response.token, user: response.user };
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        "Network error. Please try again.";
      return rejectWithValue(message);
    }
  }
);

export const signupUser = createAsyncThunk(
  "auth/signup",
  async (data: SignupRequest, { rejectWithValue }) => {
    try {
      const response = await signupApi(data);
      if (!response.success || !response.token || !response.user) {
        return rejectWithValue(response.message || "Signup failed");
      }
      persistAuth(response.token, response.user);
      return { token: response.token, user: response.user };
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        "Network error. Please try again.";
      return rejectWithValue(message);
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      clearAuth();
      state.user = null;
      state.token = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
      state.isLoading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    // Signup
    builder.addCase(signupUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signupUser.fulfilled, (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
      state.isLoading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
    });
    builder.addCase(signupUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

