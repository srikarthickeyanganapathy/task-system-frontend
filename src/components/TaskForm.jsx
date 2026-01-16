import { useState, useRef, useEffect } from "react";

const TaskForm = ({ user, onAssign }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  // Form State
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(user?.username || "");
  const [priority, setPriority] = useState("NORMAL");
  const [dueDate, setDueDate] = useState("");

  // Close form when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target) && !title) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [title]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      await onAssign({
        title,
        description: "",
        assigneeUsername: assignee || user.username,
        creatorUsername: user.username,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        tags: ""
      });
      
      // Reset & Collapse
      setTitle("");
      setPriority("NORMAL");
      setDueDate("");
      setIsExpanded(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={formRef} className={`mb-3 transition-all duration-300 ease-in-out ${isExpanded ? 'bg-[#1F222B] border-violet-500/30 shadow-xl' : 'bg-[#0F1117] border-white/10 hover:border-white/20'} border rounded-xl overflow-hidden`}>
      <form onSubmit={handleSubmit}>
        {/* Top: Input Area */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className={`w-4 h-4 rounded border transition-colors ${isExpanded ? 'border-violet-500' : 'border-white/20'}`}></div>
          <input 
            type="text" 
            placeholder="+ Add a new task" 
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            value={title}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Bottom: Expanded Options (Animated) */}
        {isExpanded && (
          <div className="px-4 pb-3 pt-1 flex items-center justify-between animate-fade-in border-t border-white/5 bg-[#161922]">
            <div className="flex items-center gap-2">
              
              {/* Assignee Input */}
              <div className="relative group">
                <div className="flex items-center gap-1 bg-[#0F1117] border border-white/10 px-2 py-1 rounded text-xs text-slate-300 hover:border-violet-500 transition-colors">
                  <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <input 
                    className="bg-transparent w-20 outline-none text-white placeholder-slate-500" 
                    placeholder="Assignee" 
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                  />
                </div>
              </div>

              {/* Date Input */}
              <div className="relative">
                <input 
                  type="datetime-local" 
                  className="bg-[#0F1117] border border-white/10 px-2 py-1 rounded text-xs text-slate-300 outline-none hover:border-violet-500 transition-colors w-32"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Priority Selector */}
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                className={`bg-[#0F1117] border border-white/10 px-2 py-1 rounded text-xs outline-none hover:border-violet-500 transition-colors cursor-pointer ${
                  priority === 'URGENT' ? 'text-red-400' : priority === 'HIGH' ? 'text-amber-400' : 'text-slate-300'
                }`}
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded text-xs font-bold transition-all shadow-lg shadow-violet-900/20 disabled:opacity-50"
            >
              {loading ? "..." : "Save"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default TaskForm;