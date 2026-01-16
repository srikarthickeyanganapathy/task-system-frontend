import { useState, useEffect } from "react";
import { getComments, addComment, addChecklistItem, toggleChecklistItem } from "../api/taskApi";

const TaskModal = ({ task, currentUser, onClose, onSubmit, onApprove, onReject }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [checklists, setChecklists] = useState(task?.checklists || []);
  const [checklistInput, setChecklistInput] = useState("");

  // ✨ FIX: Added optional chaining (?.) to prevent crashes if user/assignee is null
  const isOwner = task?.assignedTo?.username === currentUser?.username;
  
  // Logic to determine what buttons to show
  const canSubmit = isOwner && ["ASSIGNED", "REJECTED"].includes(task?.currentStatus);
  const canReview = ["MANAGER", "DIRECTOR"].includes(currentUser?.role?.name) && task?.currentStatus === "SUBMITTED";

  useEffect(() => {
    if (task?.id) {
      getComments(task.id).then(setComments).catch(() => {});
    }
  }, [task?.id]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser?.username) return;
    
    // Optimistic Update
    const optimisticComment = {
      id: Date.now(),
      comment: newComment,
      createdAt: new Date().toISOString(),
      user: { username: currentUser.username }
    };
    setComments([...comments, optimisticComment]);
    setNewComment("");

    try {
      await addComment(task.id, currentUser.username, newComment);
    } catch (err) {
      // Revert if failed (optional)
      console.error("Failed to send comment");
    }
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!checklistInput.trim()) return;
    
    const optimistic = { id: Date.now(), text: checklistInput, isCompleted: false };
    setChecklists([...checklists, optimistic]);
    setChecklistInput("");
    
    try {
      await addChecklistItem(task.id, checklistInput);
    } catch (err) {
      console.error("Failed to add checklist item");
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-4xl bg-[#161922] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#1A1D26]">
          <div className="flex items-center gap-3">
            <span className="bg-white/5 px-2 py-1 rounded text-xs text-slate-400 font-mono">#{task.id}</span>
            <span className="text-white font-bold text-lg">{task.title}</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column (Details & Activity) */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Description */}
            {task.description && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Description</h4>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Checklist */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                Checklist 
                <span className="bg-white/5 px-1.5 rounded text-[10px] text-slate-400">{checklists.filter(c => c.isCompleted).length}/{checklists.length}</span>
              </h4>
              <div className="space-y-2">
                {checklists.map(item => (
                  <div key={item.id} className="flex gap-3 group items-start">
                    <button 
                      onClick={() => {
                        setChecklists(checklists.map(c => c.id === item.id ? {...c, isCompleted: !c.isCompleted} : c));
                        toggleChecklistItem(item.id);
                      }}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${item.isCompleted ? 'bg-violet-600 border-violet-600' : 'border-slate-600 hover:border-violet-500'}`}
                    >
                      {item.isCompleted && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    </button>
                    <span className={`text-sm transition-colors ${item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{item.text}</span>
                  </div>
                ))}
                <form onSubmit={handleAddChecklist} className="mt-3">
                  <input 
                    className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none w-full hover:bg-white/5 p-2 rounded transition-colors" 
                    placeholder="+ Add item" 
                    value={checklistInput} 
                    onChange={e => setChecklistInput(e.target.value)} 
                  />
                </form>
              </div>
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Activity</h4>
              
              <div className="space-y-6 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 && <p className="text-slate-600 text-sm italic">No comments yet.</p>}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/5">
                      {c.user?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-white">{c.user?.username || "Unknown"}</span>
                        <span className="text-[10px] text-slate-500">{c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}</span>
                      </div>
                      <div className="text-sm text-slate-300 mt-1 bg-[#1A1D26] p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-white/5">
                        {c.comment}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendComment} className="flex gap-2 items-center bg-[#0F1117] border border-white/10 rounded-xl p-1.5 focus-within:border-violet-500/50 transition-colors">
                <input 
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none placeholder:text-slate-600" 
                  placeholder="Write a comment..." 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                />
                <button type="submit" disabled={!newComment.trim()} className="bg-violet-600 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            <div className="bg-[#1A1D26] p-5 rounded-xl border border-white/5 space-y-5">
              
              {/* Status */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Status</label>
                <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-bold ${
                  task.currentStatus === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  task.currentStatus === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                     task.currentStatus === 'APPROVED' ? 'bg-emerald-400' :
                     task.currentStatus === 'REJECTED' ? 'bg-red-400' : 'bg-blue-400'
                  }`}></span>
                  {task.currentStatus}
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Assignee</label>
                <div className="flex items-center gap-2 text-sm text-white bg-[#0F1117] p-2 rounded-lg border border-white/5">
                  <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold">
                    {task.assignedTo?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  {task.assignedTo?.username || "Unassigned"}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Priority</label>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  {task.priority === 'URGENT' && <span className="text-red-400">🔴 Urgent</span>}
                  {task.priority === 'HIGH' && <span className="text-amber-400">🟠 High</span>}
                  {task.priority === 'NORMAL' && <span className="text-blue-400">🔵 Normal</span>}
                </div>
              </div>

              {/* Dates */}
              {task.dueDate && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Due Date</label>
                  <div className="text-sm text-slate-300 font-mono bg-[#0F1117] p-2 rounded-lg border border-white/5 inline-block">
                    {new Date(task.dueDate).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              {canSubmit && (
                <button 
                  onClick={() => onSubmit(task.id)} 
                  className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-500 shadow-lg shadow-violet-900/20 transition-all"
                >
                  Submit for Review
                </button>
              )}
              
              {canReview && (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onApprove(task.id)} 
                    className="py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => {
                      const reason = prompt("Enter rejection reason:");
                      if (reason) onReject(task.id, reason);
                    }} 
                    className="py-3 bg-[#1A1D26] border border-red-500/30 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/10 transition-all"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;