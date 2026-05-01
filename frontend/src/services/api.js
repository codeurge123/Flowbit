const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const TOKEN_KEY = "flowbit_token";
const LEGACY_TOKEN_KEY = "taskflow_token";

const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;

  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacyToken) {
    localStorage.setItem(TOKEN_KEY, legacyToken);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }

  return legacyToken;
};
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

export const apiRequest = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload.data;
};

export const authApi = {
  signup: async (form) => {
    const data = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(form)
    });
    setToken(data.token);
    return data;
  },
  signin: async (form) => {
    const data = await apiRequest("/auth/signin", {
      method: "POST",
      body: JSON.stringify(form)
    });
    setToken(data.token);
    return data;
  },
  me: () => apiRequest("/auth/me"),
  users: () => apiRequest("/auth/users"),
  changePassword: (form) =>
    apiRequest("/auth/password", {
      method: "PATCH",
      body: JSON.stringify(form)
    }),
  logout: async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      clearToken();
    }
  }
};

export const projectApi = {
  list: () => apiRequest("/projects"),
  invitations: () => apiRequest("/projects/invitations"),
  invitationStreamUrl: () => `${API_BASE_URL}/projects/invitations/stream?token=${encodeURIComponent(getToken() || "")}`,
  create: (form) => apiRequest("/projects", { method: "POST", body: JSON.stringify(form) }),
  update: (id, form) => apiRequest(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(form) }),
  addMember: (projectId, form) =>
    apiRequest(`/projects/${projectId}/members`, { method: "POST", body: JSON.stringify(form) }),
  respondInvitation: (projectId, action) =>
    apiRequest(`/projects/${projectId}/invitations`, { method: "PATCH", body: JSON.stringify({ action }) }),
  removeMember: (projectId, userId) =>
    apiRequest(`/projects/${projectId}/members/${userId}`, { method: "DELETE" })
};

export const taskApi = {
  list: (projectId) => apiRequest(`/tasks${projectId ? `?projectId=${projectId}` : ""}`),
  create: (form) => apiRequest("/tasks", { method: "POST", body: JSON.stringify(form) }),
  update: (id, form) => apiRequest(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(form) }),
  remove: (id) => apiRequest(`/tasks/${id}`, { method: "DELETE" })
};

export const dashboardApi = {
  get: () => apiRequest("/dashboard")
};

export { clearToken, getToken };
