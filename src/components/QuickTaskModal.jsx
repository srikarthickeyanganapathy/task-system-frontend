import { useState } from "react";

const QuickTaskModal = ({ isOpen, onClose, onAssign, user }) => {
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState(user.username); // Default to self
  const [priority, setPriority] = useState("NORMAL");
  const [dueDateTime, setDueDateTime] = useState(""); // New state for datetime-local
  const [tags, setTags] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return alert("Task name is required");
    
    setLoading(true);
    try {
      await onAssign({
        title,
        description,
        assigneeUsername: assignee,
        creatorUsername: user.username,
        priority,
        dueDate: dueDateTime ? new Date(dueDateTime).toISOString() : null, // Handles the time
        tags
      });
      
      // Reset and Close
      setTitle("");
      setDescription("");
      setAssignee(user.username);
      setPriority("NORMAL");
      setDueDateTime("");
      setTags("");
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
           <h3 className="font-bold text-slate-800 text-lg">Create New Task</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           {/* Title */}
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Name</label>
             <input
               type="text"
               autoFocus
               className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
               placeholder="e.g. Q4 Website Redesign"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
             />
           </div>

           {/* Description */}
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
             <textarea
               rows="3"
               className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
               placeholder="Add details..."
               value={description}
               onChange={(e) => setDescription(e.target.value)}
             />
           </div>

           {/* Grid for Metadata */}
           <div className="grid grid-cols-2 gap-4">
             
             {/* Assignee */}
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assignee</label>
               <input
                 type="text"
                 className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                 placeholder="Username"
                 value={assignee}
                 onChange={(e) => setAssignee(e.target.value)}
               />
             </div>

             {/* Priority */}
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
               <select
                 value={priority}
                 onChange={(e) => setPriority(e.target.value)}
                 className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
               >
                 <option value="NORMAL">Normal</option>
                 <option value="HIGH">High</option>
                 <option value="URGENT">Urgent</option>
               </select>
             </div>

             {/* Date + Time */}
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date & Time</label>
               <input
                 type="datetime-local"
                 className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                 value={dueDateTime}
                 onChange={(e) => setDueDateTime(e.target.value)}
               />
             </div>

             {/* Tags */}
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tags</label>
               <input
                 type="text"
                 className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                 placeholder="comma, separated"
                 value={tags}
                 onChange={(e) => setTags(e.target.value)}
               />
             </div>
           </div>

           {/* Actions */}
           <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-4">
             <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
               Cancel
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className="px-6 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 shadow-sm"
             >
               {loading ? "Creating..." : "Create Task"}
             </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default QuickTaskModal;