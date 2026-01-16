import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getTasks, assignTask, submitTask, approveTask, rejectTask } from "../api/taskApi";
import FloatingNavbar from "../components/FloatingNavbar";
import QuickTaskModal from "../components/QuickTaskModal";
import ProfileModal from "../components/ProfileModal";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  
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

  // Logic
  const columns = useMemo(() => {
    return {
      "TO DO": tasks.filter(t => t.currentStatus === "ASSIGNED"),
      "IN REVIEW": tasks.filter(t => t.currentStatus === "SUBMITTED"),
      "DONE": tasks.filter(t => t.currentStatus === "APPROVED"),
      "REVISIONS": tasks.filter(t => t.currentStatus === "REJECTED"),
    };
  }, [tasks]);

  const canAssign = user?.role?.name === "MANAGER" || user?.role?.name === "DIRECTOR";

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      
      {/* 1. FLOATING DOCK NAVBAR */}
      <FloatingNavbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onProfileClick={() => setIsProfileOpen(true)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <main className="pt-6 md:pt-24 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
           <div>
             <h1 className="text-3xl font-bold text-white tracking-tight capitalize">
               {activeTab === 'team' ? 'Team Overview' : activeTab}
             </h1>
             <p className="text-sm text-slate-400 mt-1">Welcome back, <span className="text-purple-400 font-semibold">{user.username}</span></p>
           </div>
           
           <div className="flex gap-3">
             {/* Added Logout here explicitly for visibility */}
             <button 
               onClick={logout}
               className="px-4 py-2 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
             >
                Sign Out
             </button>
             
             <button 
               onClick={() => setIsQuickAddOpen(true)}
               className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all transform hover:-translate-y-0.5"
             >
               + New Task
             </button>
           </div>
        </header>

        {/* VIEW: HOME (Stats) */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in-up">
             {/* Stats Grid */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-lg">
                   <div className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">Total Tasks</div>
                   <div className="text-4xl font-bold text-white">{tasks.length}</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-lg">
                   <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Pending Review</div>
                   <div className="text-4xl font-bold text-white">{columns["IN REVIEW"].length}</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-lg">
                   <div className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Done</div>
                   <div className="text-4xl font-bold text-white">{columns["DONE"].length}</div>
                </div>
             </div>

             {/* Urgent List */}
             <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                   <h3 className="font-bold text-white">Urgent Actions</h3>
                </div>
                <div className="divide-y divide-slate-800">
                  {tasks.filter(t => t.priority === 'URGENT').slice(0, 3).map(task => (
                     <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                  ))}
                  {tasks.filter(t => t.priority === 'URGENT').length === 0 && (
                    <div className="p-8 text-center text-slate-500">All clear. No urgent tasks.</div>
                  )}
                </div>
             </div>
          </div>
        )}

        {/* VIEW: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
             <div className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-purple-600 to-blue-600 relative">
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                   <div className="absolute bottom-4 left-4 text-white font-bold text-2xl">Website Redesign</div>
                </div>
                <div className="p-6">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-bold text-slate-400 uppercase bg-slate-800 px-2 py-1 rounded">Marketing</span>
                     <span className="text-sm font-bold text-white">4 Tasks</span>
                   </div>
                   <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                     <div className="bg-purple-500 h-2 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{width: '75%'}}></div>
                   </div>
                   <div className="text-xs text-slate-400 text-right">75% Complete</div>
                </div>
             </div>

             <div className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-emerald-600 to-teal-600 relative">
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                   <div className="absolute bottom-4 left-4 text-white font-bold text-2xl">Q4 Campaign</div>
                </div>
                <div className="p-6">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-bold text-slate-400 uppercase bg-slate-800 px-2 py-1 rounded">Sales</span>
                     <span className="text-sm font-bold text-white">12 Tasks</span>
                   </div>
                   <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                     <div className="bg-emerald-500 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{width: '30%'}}></div>
                   </div>
                   <div className="text-xs text-slate-400 text-right">30% Complete</div>
                </div>
             </div>
          </div>
        )}

        {/* VIEW: LISTS */}
        {activeTab === 'lists' && (
           <div className="space-y-8 animate-fade-in-up">
             {/* TO DO */}
             <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                   <h3 className="font-bold text-white text-sm uppercase">To Do</h3>
                   <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {columns["TO DO"].length}
                   </span>
                </div>
                <div className="divide-y divide-slate-800">
                   {canAssign && <TaskForm user={user} onAssign={handleAssign} />}
                   {columns["TO DO"].map(task => (
                     <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                   ))}
                   {columns["TO DO"].length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No tasks</div>}
                </div>
             </div>
             
             {/* IN REVIEW */}
             <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                   <h3 className="font-bold text-white text-sm uppercase">In Review</h3>
                   <span className="bg-blue-900/30 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {columns["IN REVIEW"].length}
                   </span>
                </div>
                <div className="divide-y divide-slate-800">
                   {columns["IN REVIEW"].map(task => (
                     <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                   ))}
                   {columns["IN REVIEW"].length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No tasks</div>}
                </div>
             </div>
             
             {/* DONE */}
             <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                   <h3 className="font-bold text-white text-sm uppercase">Done</h3>
                   <span className="bg-green-900/30 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {columns["DONE"].length}
                   </span>
                </div>
                <div className="divide-y divide-slate-800">
                   {columns["DONE"].map(task => (
                     <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                   ))}
                   {columns["DONE"].length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No tasks</div>}
                </div>
             </div>
           </div>
        )}

        {/* VIEW: TEAM (High Contrast Version) */}
        {activeTab === 'team' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
              
              {/* Member 1 */}
              <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-lg transition-all hover:border-purple-500/50 hover:shadow-purple-900/20">
                 <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-600/20 blur-3xl group-hover:bg-purple-600/30 transition-all"></div>
                 <div className="relative flex flex-col items-center text-center z-10">
                    <div className="relative mb-6">
                       <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-1 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-3xl font-bold text-white">
                             A
                          </div>
                       </div>
                       <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-slate-900 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    </div>
                    <h3 className="text-xl font-bold text-white">Alice Manager</h3>
                    <p className="mb-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Product Lead</p>
                    <div className="grid w-full grid-cols-2 gap-4">
                       <div className="rounded-xl bg-slate-800/50 p-3 border border-slate-700/50">
                          <div className="text-xs font-bold text-slate-400 uppercase">Load</div>
                          <div className="text-xl font-bold text-white">High</div>
                       </div>
                       <div className="rounded-xl bg-slate-800/50 p-3 border border-slate-700/50">
                          <div className="text-xs font-bold text-slate-400 uppercase">Done</div>
                          <div className="text-xl font-bold text-green-400">12</div>
                       </div>
                    </div>
                    <div className="mt-6 w-full">
                       <div className="mb-2 flex justify-between text-xs font-bold text-slate-300">
                          <span>Weekly Goal</span>
                          <span>85%</span>
                       </div>
                       <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Member 2 */}
              <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-lg transition-all hover:border-purple-500/50 hover:shadow-purple-900/20">
                 <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-600/20 blur-3xl group-hover:bg-indigo-600/30 transition-all"></div>
                 <div className="relative flex flex-col items-center text-center z-10">
                    <div className="relative mb-6">
                       <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 p-1 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-3xl font-bold text-white">
                             B
                          </div>
                       </div>
                       <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-slate-900 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                    </div>
                    <h3 className="text-xl font-bold text-white">Bob Dev</h3>
                    <p className="mb-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Frontend Eng</p>
                    <div className="grid w-full grid-cols-2 gap-4">
                       <div className="rounded-xl bg-slate-800/50 p-3 border border-slate-700/50">
                          <div className="text-xs font-bold text-slate-400 uppercase">Load</div>
                          <div className="text-xl font-bold text-white">Med</div>
                       </div>
                       <div className="rounded-xl bg-slate-800/50 p-3 border border-slate-700/50">
                          <div className="text-xs font-bold text-slate-400 uppercase">Done</div>
                          <div className="text-xl font-bold text-green-400">8</div>
                       </div>
                    </div>
                    <div className="mt-6 w-full">
                       <div className="mb-2 flex justify-between text-xs font-bold text-slate-300">
                          <span>Weekly Goal</span>
                          <span>60%</span>
                       </div>
                       <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Member 3 */}
              <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-lg transition-all hover:border-purple-500/50 hover:shadow-purple-900/20">
                 <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-pink-600/20 blur-3xl group-hover:bg-pink-600/30 transition-all"></div>
                 <div className="relative flex flex-col items-center text-center z-10">
                    <div className="relative mb-6">
                       <div className="h-24 w-24 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 p-1 shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-3xl font-bold text-white">
                             C
                          </div>
                       </div>
                       <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-slate-900 bg-gray-500"></div>
                    </div>
                    <h3 className="text-xl font-bold text-white">Charlie UX</h3>
                    <p className="mb-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Designer</p>
                    <div className="grid w-full grid-cols-2 gap-4">
                       <div className="rounded-xl bg-slate-800/50 p-3 border border-slate-700/50">
                          <div className="text-xs font-bold text-slate-400 uppercase">Load</div>
                          <div className="text-xl font-bold text-white">Low</div>
                       </div>
                       <div className="rounded-xl bg-slate-800/50 p-3 border border-slate-700/50">
                          <div className="text-xs font-bold text-slate-400 uppercase">Done</div>
                          <div className="text-xl font-bold text-green-400">5</div>
                       </div>
                    </div>
                    <div className="mt-6 w-full">
                       <div className="mb-2 flex justify-between text-xs font-bold text-slate-300">
                          <span>Weekly Goal</span>
                          <span>40%</span>
                       </div>
                       <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full w-[40%] rounded-full bg-gradient-to-r from-pink-500 to-orange-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        )}

      </main>

      {/* MODALS */}
      <QuickTaskModal 
        isOpen={isQuickAddOpen} 
        onClose={() => setIsQuickAddOpen(false)} 
        onAssign={handleAssign}
        user={user}
      />
      
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onLogout={logout}
      />
      
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