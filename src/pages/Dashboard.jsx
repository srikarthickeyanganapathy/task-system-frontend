import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getTasks, assignTask, submitTask, approveTask, rejectTask } from "../api/taskApi";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Refresh Logic
  const fetchTasks = async () => {
    try {
      const data = await getTasks(user.username);
      setTasks(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTasks(); }, [user.username]);

  // Actions
  const handleAssign = async (data) => {
    await assignTask(data);
    fetchTasks();
  };
  const handleSubmit = async (id) => {
    await submitTask(id, user.username);
    fetchTasks();
  };
  const handleApprove = async (id) => {
    await approveTask(id, user.username);
    fetchTasks();
  };
  const handleReject = async (id, reason) => {
    await rejectTask(id, user.username, reason);
    fetchTasks();
  };

  // Group Tasks for Kanban Columns
  const columns = useMemo(() => {
    return {
      "To Do": tasks.filter(t => t.currentStatus === "ASSIGNED"),
      "In Review": tasks.filter(t => t.currentStatus === "SUBMITTED"),
      "Done": tasks.filter(t => t.currentStatus === "APPROVED"),
      "Revisions": tasks.filter(t => t.currentStatus === "REJECTED"),
    };
  }, [tasks]);

  const canAssign = user?.role?.name === "MANAGER" || user?.role?.name === "DIRECTOR";

  return (
    <div className="flex h-screen bg-gray-50 flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between bg-white px-6 py-3 border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-purple-600 rounded-lg flex items-center justify-center">
            <div className="h-5 w-5 bg-white rounded"></div>
          </div>
          <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user.username}</div>
              <div className="text-xs text-gray-500">{user.role?.name}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-purple-500 flex items-center justify-center text-sm font-medium text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        
        {canAssign && (
          <div className="mb-6 max-w-3xl">
            <TaskForm user={user} onAssign={handleAssign} />
          </div>
        )}

        {/* KANBAN BOARD */}
        <div className="flex h-full gap-4 min-w-max pb-6">
          {Object.entries(columns).map(([title, columnTasks]) => (
            <div key={title} className="flex flex-col w-80">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
                  {title}
                </h3>
                <span className="bg-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg p-3 border border-gray-200 overflow-y-auto">
                {columnTasks.length === 0 && (
                  <div className="h-32 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                    No tasks
                  </div>
                )}
                {columnTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={(t) => setSelectedTask(t)} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TASK MODAL */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          currentUser={user}
          onClose={() => setSelectedTask(null)}
          onSubmit={handleSubmit}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default Dashboard;