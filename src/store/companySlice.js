import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getApiErrorMessage } from "../services/api";
import { API_URLS } from "../services/apiUrls";

const initialState = {
  companies: [],
  selectedCompany: null,
  companiesLoading: false,
  detailLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  assignAdminLoading: false,
  error: "",
  detailError: "",
  createError: "",
  updateError: "",
  deleteError: "",
  assignAdminError: "",
  message: "",
  detailMessage: "",
  createMessage: "",
  updateMessage: "",
  deleteMessage: "",
  assignAdminMessage: "",
  assignedAdmin: null,
  uploadLoading: false,
  uploadStatus: null,
  uploadError: "",
  uploadResponseData: null,
};

const pickArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeCompany = (item, index = 0) => ({
  id: String(item?.id || item?.company_id || index),
  company_name:
    item?.company_name || item?.name || item?.title || "Unnamed Company",
  industry: item?.industry || "",
  size_bucket: item?.size_bucket || "",
  email: item?.email || "",
  phone: String(item?.phone ?? ""),
  location_id:
    item?.location_id != null
      ? String(item.location_id)
      : item?.location?.id != null
        ? String(item.location.id)
        : "",
  location_name:
    item?.location_name ||
    item?.location?.name ||
    (typeof item?.location === "string" ? item.location : "") ||
    "",
  no_of_employees: item?.no_of_employees ?? "",
  is_active: Boolean(item?.is_active),
  created_at: item?.created_at || "",
  updated_at: item?.updated_at || "",
  admin: item?.admin ? normalizeAdmin(item.admin) : null,
});

const normalizeAdmin = (item) => ({
  id: String(item?.id || ""),
  emp_id: item?.emp_id || "",
  username: item?.username || "",
  password: item?.password || "",
  age_band: item?.age_band || "",
  full_name: item?.full_name || "",
  department: item?.department || "",
  location: item?.location || "",
  gender: item?.gender || "",
  phone: String(item?.phone ?? ""),
  email: item?.email || "",
  company_id: item?.company_id || "",
  is_active: Boolean(item?.is_active),
  created_at: item?.created_at || "",
  updated_at: item?.updated_at || "",
});

export const fetchCompanies = createAsyncThunk(
  "company/fetchCompanies",
  async ({ search = "", isActive } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.companies, {
        params: {
          ...(search ? { search } : {}),
          ...(typeof isActive === "boolean" ? { is_active: isActive } : {}),
        },
      });
      const payload = response?.data || {};

      if (!payload?.success) {
        return rejectWithValue(
          payload?.message || "Failed to fetch companies.",
        );
      }

      return {
        companies: pickArray(payload).map(normalizeCompany),
        message: payload?.message || "Companies fetched successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch companies due to server/network error.",
        ),
      );
    }
  },
);

export const fetchCompanyById = createAsyncThunk(
  "company/fetchCompanyById",
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URLS.companyById(companyId));
      const payload = response?.data || {};

      if (!payload?.success || !payload?.data) {
        return rejectWithValue(payload?.message || "Failed to fetch company.");
      }

      return {
        company: normalizeCompany(payload.data),
        message: payload?.message || "Company fetched successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to fetch company due to server/network error.",
        ),
      );
    }
  },
);

export const createCompany = createAsyncThunk(
  "company/createCompany",
  async ({ company, admin = null }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_URLS.companies, { company, admin });
      const payload = response?.data || {};

      if (!payload?.success || !payload?.data) {
        return rejectWithValue(payload?.message || "Failed to create company.");
      }

      const createdCompany = payload.data.company || payload.data;
      return {
        company: normalizeCompany(createdCompany),
        admin: payload.data.admin ? normalizeAdmin(payload.data.admin) : null,
        message: payload?.message || "Company created successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to create company due to server/network error.",
        ),
      );
    }
  },
);

export const updateCompany = createAsyncThunk(
  "company/updateCompany",
  async ({ companyId, company }, { rejectWithValue }) => {
    try {
      const response = await api.put(API_URLS.companyById(companyId), company);
      const payload = response?.data || {};

      if (!payload?.success || !payload?.data) {
        return rejectWithValue(payload?.message || "Failed to update company.");
      }

      const updatedCompany = payload.data.company || payload.data;
      return {
        company: normalizeCompany(updatedCompany),
        admin: payload.data.admin ? normalizeAdmin(payload.data.admin) : null,
        message: payload?.message || "Company updated successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to update company due to server/network error.",
        ),
      );
    }
  },
);

export const deleteCompany = createAsyncThunk(
  "company/deleteCompany",
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_URLS.companyById(companyId));
      const payload = response?.data || {};

      if (!payload?.success || !payload?.data) {
        return rejectWithValue(payload?.message || "Failed to delete company.");
      }

      return {
        company: normalizeCompany(payload.data),
        message: payload?.message || "Company deleted successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to delete company due to server/network error.",
        ),
      );
    }
  },
);

export const assignCompanyAdmin = createAsyncThunk(
  "company/assignCompanyAdmin",
  async ({ companyId, admin }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_URLS.companyAdmin(companyId), admin);
      const payload = response?.data || {};

      if (!payload?.success || !payload?.data) {
        return rejectWithValue(
          payload?.message || "Failed to assign company admin.",
        );
      }

      return {
        admin: normalizeAdmin(payload.data),
        message: payload?.message || "Company admin assigned successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Failed to assign company admin due to server/network error.",
        ),
      );
    }
  },
);

export const uploadCompanyFile = createAsyncThunk(
  "company/uploadCompanyFile",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(API_URLS.companyUpload, formData);
      const payload = response?.data || {};
      if (!payload?.success) {
        return rejectWithValue(payload?.message || "Upload failed.");
      }

      return payload?.data || null;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Upload failed due to server/network error."),
      );
    }
  },
);

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    clearCompanyError(state) {
      state.error = "";
      state.createError = "";
      state.updateError = "";
      state.deleteError = "";
      state.assignAdminError = "";
    },
    clearCompanyDetailState(state) {
      state.selectedCompany = null;
      state.detailLoading = false;
      state.detailError = "";
      state.detailMessage = "";
      state.assignedAdmin = null;
      state.assignAdminMessage = "";
      state.assignAdminError = "";
    },
    clearCompanyCreateState(state) {
      state.createLoading = false;
      state.createError = "";
      state.createMessage = "";
    },
    clearCompanyUpdateState(state) {
      state.updateLoading = false;
      state.updateError = "";
      state.updateMessage = "";
    },
    clearCompanyDeleteState(state) {
      state.deleteLoading = false;
      state.deleteError = "";
      state.deleteMessage = "";
    },
    clearAssignedAdminState(state) {
      state.assignedAdmin = null;
      state.assignAdminLoading = false;
      state.assignAdminError = "";
      state.assignAdminMessage = "";
    },
    resetCompanyUpload(state) {
      state.uploadLoading = false;
      state.uploadStatus = null;
      state.uploadError = "";
      state.uploadResponseData = null;
    },
    clearCompanyUploadError(state) {
      state.uploadError = "";
      if (state.uploadStatus === "error") {
        state.uploadStatus = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.companiesLoading = true;
        state.error = "";
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.companiesLoading = false;
        state.companies = action.payload.companies;
        state.message = action.payload.message;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.companiesLoading = false;
        state.error = action.payload || "Failed to fetch companies.";
      })
      .addCase(fetchCompanyById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = "";
        state.detailMessage = "";
      })
      .addCase(fetchCompanyById.fulfilled, (state, action) => {
        state.detailLoading = false;
        console.log("action.payload", action.payload.company);

        state.selectedCompany = action.payload.company;
        state.detailMessage = action.payload.message;
      })
      .addCase(fetchCompanyById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload || "Failed to fetch company.";
      })
      .addCase(createCompany.pending, (state) => {
        state.createLoading = true;
        state.createError = "";
        state.createMessage = "";
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createMessage = action.payload.message;
        state.assignedAdmin = action.payload.admin;
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || "Failed to create company.";
      })
      .addCase(updateCompany.pending, (state) => {
        state.updateLoading = true;
        state.updateError = "";
        state.updateMessage = "";
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateMessage = action.payload.message;
        state.selectedCompany = action.payload.company;
        if (action.payload.admin) {
          state.selectedCompany.admin = action.payload.admin;
        }
        state.companies = state.companies.map((item) =>
          item.id === action.payload.company.id ? action.payload.company : item,
        );
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || "Failed to update company.";
      })
      .addCase(deleteCompany.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = "";
        state.deleteMessage = "";
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteMessage = action.payload.message;
        state.companies = state.companies.filter(
          (item) => item.id !== action.payload.company.id,
        );
        if (state.selectedCompany?.id === action.payload.company.id) {
          state.selectedCompany = null;
        }
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload || "Failed to delete company.";
      })
      .addCase(assignCompanyAdmin.pending, (state) => {
        state.assignAdminLoading = true;
        state.assignAdminError = "";
        state.assignAdminMessage = "";
      })
      .addCase(assignCompanyAdmin.fulfilled, (state, action) => {
        state.assignAdminLoading = false;
        state.assignedAdmin = action.payload.admin;
        state.assignAdminMessage = action.payload.message;
        if (state.selectedCompany) {
          state.selectedCompany.admin = action.payload.admin;
        }
      })
      .addCase(assignCompanyAdmin.rejected, (state, action) => {
        state.assignAdminLoading = false;
        state.assignAdminError =
          action.payload || "Failed to assign company admin.";
      })
      .addCase(uploadCompanyFile.pending, (state) => {
        state.uploadLoading = true;
        state.uploadStatus = null;
        state.uploadError = "";
        state.uploadResponseData = null;
      })
      .addCase(uploadCompanyFile.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.uploadStatus = "success";
        state.uploadResponseData = action.payload;
      })
      .addCase(uploadCompanyFile.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadStatus = "error";
        state.uploadError = action.payload || "Upload failed.";
      });
  },
});

export const {
  clearCompanyError,
  clearCompanyDetailState,
  clearCompanyCreateState,
  clearCompanyUpdateState,
  clearCompanyDeleteState,
  clearAssignedAdminState,
  resetCompanyUpload,
  clearCompanyUploadError,
} = companySlice.actions;

export default companySlice.reducer;
