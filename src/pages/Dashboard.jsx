import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getTasks, assignTask, submitTask, approveTask, rejectTask } from "../api/taskApi";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔥 LOAD TASKS FROM BACKEND
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getTasks(user.username); 
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user.username]);

  const refreshTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  const handleAssign = async (data) => {
    try {
      await assignTask(data);
      await refreshTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (id) => {
    try {
      await submitTask(id, user.username);
      await refreshTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveTask(id, user.username);
      await refreshTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectTask(id, user.username);
      await refreshTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Tasks</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-apple-sub">{user.username}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-apple-border px-4 py-2 text-sm hover:bg-gray-100"
          >
            Log out
          </button>
        </div>
      </header>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {loading && <p className="text-sm text-apple-sub">Loading tasks…</p>}

      <TaskForm user={user} onAssign={handleAssign} />

      <TaskList
        tasks={tasks}
        currentUser={user}
        onSubmit={handleSubmit}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default Dashboard;
