// --- localStorage Snapshot Utilities ---

export const getHistoryKey = (orgId) => `ryokai_workload_history_${orgId}`;
export const getThresholdKey = (orgId) => `ryokai_workload_threshold_${orgId}`;

export const loadHistory = (orgId) => {
  try {
    const raw = localStorage.getItem(getHistoryKey(orgId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveHistory = (orgId, history) => {
  try {
    localStorage.setItem(getHistoryKey(orgId), JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save workload history', e);
  }
};

// History is now provided by the backend API — see WorkloadDTOs.DailySnapshot
