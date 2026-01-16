import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getTasks, assignTask, submitTask, approveTask, rejectTask } from "../api/taskApi";
import FloatingNavbar from "../components/FloatingNavbar";
import QuickTaskModal from "../components/QuickTaskModal";
import ProfileModal from "../components/ProfileModal";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  
  const canAssign = ["MANAGER", "DIRECTOR"].includes(user?.role?.name);

  // Fetch Logic
  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      toast("Failed to load tasks", "error");
    }
  };

  useEffect(() => { if(user) fetchTasks(); }, [user]);

  // Generic Action Handler for DRY code
  const handleAction = async (actionFn, ...args) => {
    try {
      await actionFn(...args);
      toast("Updated successfully", "success");
      fetchTasks();
      if(selectedTask) setSelectedTask(null);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const columns = useMemo(() => ({
    "TO DO": tasks.filter(t => t.currentStatus === "ASSIGNED"),
    "IN REVIEW": tasks.filter(t => t.currentStatus === "SUBMITTED"),
    "DONE": tasks.filter(t => t.currentStatus === "APPROVED"),
    "REVISIONS": tasks.filter(t => t.currentStatus === "REJECTED"),
  }), [tasks]);

  return (
    <div className="min-h-screen bg-[#0F1117] font-sans text-slate-200 pb-32">
      <FloatingNavbar activeTab={activeTab} setActiveTab={setActiveTab} onProfileClick={() => setIsProfileOpen(true)} />

      <main className="pt-8 px-4 md:px-8 max-w-[1400px] mx-auto">
        <header className="mb-8 flex justify-between items-end">
           <div>
             <h1 className="text-2xl font-bold text-white tracking-tight capitalize">{activeTab}</h1>
             <p className="text-sm text-slate-500 mt-1">Workspace of <span className="text-violet-400 font-medium">{user.username}</span></p>
           </div>
           {canAssign && (
             <button onClick={() => setIsQuickAddOpen(true)} className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-violet-900/20 flex items-center gap-2">
               + New Task
             </button>
           )}
        </header>

        {activeTab === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
             {[{l:"Total", v:tasks.length}, {l:"Pending", v:columns["IN REVIEW"].length}, {l:"Done", v:columns["DONE"].length}, {l:"Issues", v:columns["REVISIONS"].length}].map((s,i) => (
               <div key={i} className="bg-[#161922] border border-white/5 p-5 rounded-xl">
                 <div className="text-xs font-bold text-slate-500 uppercase mb-1">{s.l}</div>
                 <div className="text-2xl font-bold text-white">{s.v}</div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'lists' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
             {Object.entries(columns).slice(0,3).map(([title, colTasks]) => (
                <div key={title} className="bg-[#161922] border border-white/5 rounded-xl flex flex-col h-fit max-h-[80vh]">
                   <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-[#1A1D26] rounded-t-xl sticky top-0 z-10">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
                      <span className="bg-white/10 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">{colTasks.length}</span>
                   </div>
                   <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {title === "TO DO" && canAssign && <TaskForm user={user} onAssign={(d) => handleAction(assignTask, d)} />}
                      {colTasks.map(task => <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />)}
                      {colTasks.length === 0 && <div className="py-8 text-center text-slate-600 text-xs italic">No tasks here</div>}
                   </div>
                </div>
             ))}
           </div>
        )}
      </main>

      <QuickTaskModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} onAssign={(d) => handleAction(assignTask, d)} user={user} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      {selectedTask && <TaskModal task={selectedTask} currentUser={user} onClose={() => setSelectedTask(null)} onSubmit={(id) => handleAction(submitTask, id)} onApprove={(id) => handleAction(approveTask, id)} onReject={(id, r) => handleAction(rejectTask, id, r)} />}
    </div>
  );
};

export default Dashboard;