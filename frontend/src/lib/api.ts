// Centralized API client for Expense Management backend
import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface ApiError extends Error {
  status?: number;
  payload?: any;
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    if (config.headers) {
      // If headers is an AxiosHeaders instance, use set; otherwise, assign property
      if (typeof (config.headers as any).set === "function") {
        (config.headers as any).set("Authorization", `Bearer ${token}`);
      } else {
        Object.assign(config.headers, { Authorization: `Bearer ${token}` });
      }
    } else {
      config.headers = { Authorization: `Bearer ${token}` };
    }
  }
  return config;
});



async function request<T>(path: string, options: any = {}): Promise<T> {
  try {
    const res = await axiosInstance({
      url: path,
      ...options,
    });
    return res.data as T;
  } catch (error) {
    let err: ApiError;
  if ((axios as any).isAxiosError && (axios as any).isAxiosError(error)) {
      err = new Error(error.response?.data?.message || error.response?.data?.error || error.message) as ApiError;
      err.status = error.response?.status;
      err.payload = error.response?.data;
    } else {
      err = new Error("Unknown error") as ApiError;
    }
    throw err;
  }
}

// Auth
export interface SignupPayload {
  email: string;
  password: string;
  full_name: string;
  company_name: string;
  country_code: string; // 2-letter code
}
export interface LoginPayload { email: string; password: string; }

export interface AuthResponse {
  access_token: string;
  user: { id: number; email: string; full_name: string; role: string; company_id: number };
  message?: string;
}

export const authApi = {
  signup: (payload: SignupPayload) => request<AuthResponse>("/auth/signup", { method: "POST", data: payload }),
  login: (payload: LoginPayload) => request<AuthResponse>("/auth/login", { method: "POST", data: payload }),
};

// Users
export interface CreateUserPayload {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "manager" | "employee";
  manager_id?: number;
}
export const usersApi = {
  list: () => request<{ users: any[] }>("/users"),
  create: (payload: CreateUserPayload) => request("/users", { method: "POST", data: payload }),
};

// Expenses
export interface ExpensePayload {
  amount: number;
  currency_code: string;
  description: string;
  receipt_path?: string;
}
export const expensesApi = {
  create: (p: ExpensePayload) => request("/expenses", { method: "POST", data: p }),
  list: (params?: { status?: string; user_id?: number }) => {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).filter(([_,v]) => v !== undefined) as any)}` : "";
    return request<{ expenses: any[] }>(`/expenses${qs}`);
  },
  approve: (id: number, decision: "approved" | "rejected", comments?: string) =>
    request(`/expenses/${id}/approve`, { method: "POST", data: { decision, comments } }),
};

// Approval Flows
export const flowsApi = {
  get: () => request<{ flow: any }>("/flows"),
  upsert: (payload: any) => request("/flows", { method: "POST", data: payload }),
};

// Audit
export const auditApi = {
  getExpenseLogs: (expenseId: number) => request<{ audit_logs: any[] }>(`/audit/${expenseId}`),
};

// Helper to set token
export function setAuthToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("access_token");
}
