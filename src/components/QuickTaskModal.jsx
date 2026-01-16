import { useState, useEffect } from "react";

const QuickTaskModal = ({ isOpen, onClose, onAssign, user }) => {
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // ✨ FIX: Safe access to user.username using optional chaining (?.)
  const [assignee, setAssignee] = useState(""); 
  const [priority, setPriority] = useState("NORMAL");
  const [dueDateTime, setDueDateTime] = useState("");
  const [tags, setTags] = useState("");

  // Update assignee when user prop loads
  useEffect(() => {
    if (user?.username) {
      setAssignee(user.username);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    try {
      await onAssign({
        title, 
        description, 
        assigneeUsername: assignee, 
        creatorUsername: user?.username, // Safe access
        priority, 
        dueDate: dueDateTime ? new Date(dueDateTime).toISOString() : null, 
        tags
      });
      // Reset
      setTitle(""); setDescription(""); setPriority("NORMAL"); setDueDateTime(""); setTags("");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#161922] border border-white/10 rounded-xl shadow-2xl overflow-hidden scale-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1A1D26]">
           <h3 className="font-bold text-white text-lg">Create New Task</h3>
           <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           {/* Title */}
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
             <input autoFocus type="text" className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors" value={title} onChange={(e) => setTitle(e.target.value)} />
           </div>
           
           {/* Description */}
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
             <textarea rows="3" className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none resize-none transition-colors" value={description} onChange={(e) => setDescription(e.target.value)} />
           </div>

           {/* Grid Layout */}
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assignee</label>
               <input type="text" className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
               <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors">
                 <option value="NORMAL">Normal</option>
                 <option value="HIGH">High</option>
                 <option value="URGENT">Urgent</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
               <input type="datetime-local" className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors" value={dueDateTime} onChange={(e) => setDueDateTime(e.target.value)} />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tags</label>
               <input type="text" placeholder="dev, ui" className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition-colors" value={tags} onChange={(e) => setTags(e.target.value)} />
             </div>
           </div>

           {/* Footer */}
           <div className="pt-4 flex justify-end gap-2 border-t border-white/5">
             <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
             <button type="submit" disabled={loading} className="px-6 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 disabled:opacity-50 transition-all shadow-lg shadow-violet-900/20">{loading ? "Creating..." : "Create Task"}</button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default QuickTaskModal;