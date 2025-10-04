// Centralized API client for Expense Management backend
// Uses fetch; can be swapped for axios if desired.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface ApiError extends Error {
  status?: number;
  payload?: any;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data: any = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const err: ApiError = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data as T;
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
  signup: (payload: SignupPayload) => request<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: LoginPayload) => request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
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
  create: (payload: CreateUserPayload) => request("/users", { method: "POST", body: JSON.stringify(payload) }),
};

// Expenses
export interface ExpensePayload {
  amount: number;
  currency_code: string;
  description: string;
  receipt_path?: string;
}
export const expensesApi = {
  create: (p: ExpensePayload) => request("/expenses", { method: "POST", body: JSON.stringify(p) }),
  list: (params?: { status?: string; user_id?: number }) => {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).filter(([_,v]) => v !== undefined) as any)}` : "";
    return request<{ expenses: any[] }>(`/expenses${qs}`);
  },
  approve: (id: number, decision: "approved" | "rejected", comments?: string) =>
    request(`/expenses/${id}/approve`, { method: "POST", body: JSON.stringify({ decision, comments }) }),
};

// Approval Flows
export const flowsApi = {
  get: () => request<{ flow: any }>("/flows"),
  upsert: (config: any) => request("/flows", { method: "POST", body: JSON.stringify({ config }) }),
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
