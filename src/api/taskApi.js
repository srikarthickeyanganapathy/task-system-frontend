const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("jwt_token");
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Generic response handler for JSON and Text responses
const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(errorText || "Request failed");
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
};

// --- Auth Endpoints ---

export const login = async (username, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
};

// --- Task Endpoints ---

export const getTasks = async () => {
  const res = await fetch(`${API_BASE_URL}/tasks`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const assignTask = async (taskData) => {
  const res = await fetch(`${API_BASE_URL}/tasks/assign`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });
  return handleResponse(res);
};

export const submitTask = async (taskId) => {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/submit`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

export const approveTask = async (taskId) => {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/approve`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

export const rejectTask = async (taskId, reason) => {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/reject`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "text/plain" },
    body: reason
  });
  return handleResponse(res);
};

// --- Comments & Checklist ---

export const getComments = async (taskId) => {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const addComment = async (taskId, username, commentText) => {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "text/plain" },
    body: commentText,
  });
  return handleResponse(res);
};

export const addChecklistItem = async (taskId, text) => {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/checklists`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
  return handleResponse(res);
};

export const toggleChecklistItem = async (itemId) => {
  const res = await fetch(`${API_BASE_URL}/tasks/checklists/${itemId}/toggle`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};