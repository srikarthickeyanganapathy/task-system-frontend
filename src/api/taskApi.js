const API_BASE_URL = "http://localhost:8080/api";

// ---------------- AUTH ----------------
export const login = async (username) => {
  const res = await fetch(`${API_BASE_URL}/auth/login?username=${username}`);
  if (!res.ok) throw new Error("Login failed");
  return res.json();
};

// ---------------- TASKS ----------------
export const getTasks = async (username) => {
  const res = await fetch(`${API_BASE_URL}/tasks?username=${username}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to load tasks");
  }
  return res.json();
};

export const assignTask = async (taskData) => {
  const res = await fetch(`${API_BASE_URL}/tasks/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to assign task");
  }
  return res.json();
};

export const submitTask = async (taskId, username) => {
  const res = await fetch(
    `${API_BASE_URL}/tasks/${taskId}/submit?&username=${username}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Submit failed");
  return res.json();
};

export const approveTask = async (taskId, username) => {
  const res = await fetch(
    `${API_BASE_URL}/tasks/${taskId}/approve?username=${username}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Approve failed");
  return res.json();
};

export const rejectTask = async (taskId, username) => {
  const res = await fetch(
    `${API_BASE_URL}/tasks/${taskId}/reject?username=${username}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Reject failed");
  return res.json();
};
