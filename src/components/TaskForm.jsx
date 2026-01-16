import { useState } from "react";

const TaskForm = ({ user, onAssign }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;
    
    setLoading(true);
    try {
      await onAssign({
        title,
        description: "",
        assigneeUsername: assignee || user.username, // Default to self if empty
        creatorUsername: user.username,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        tags: ""
      });
      setTitle("");
      setAssignee("");
      setPriority("NORMAL");
      setDueDate("");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="group px-6 py-3 flex items-center gap-4 bg-slate-50 hover:bg-white transition-colors border-b border-slate-100 last:border-0">
      {/* 1. Checkbox Visual */}
      <div className="col-span-1 w-4 h-4 rounded border border-slate-300 bg-white group-hover:border-violet-400"></div>

      {/* 2. Title Input */}
      <div className="col-span-6 flex-1">
        <input
          type="text"
          placeholder="+ New list item"
          className="w-full bg-transparent text-sm font-medium text-slate-600 placeholder-slate-400 focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* 3. Secondary Inputs (Visible on hover or when typing title) */}
      <div className={`col-span-5 flex items-center gap-3 transition-opacity ${title ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Assignee */}
        <input
          type="text"
          placeholder="Assignee"
          className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-600 focus:border-violet-500 focus:outline-none w-24"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        />

        {/* Priority Badge */}
        <select 
          value={priority} 
          onChange={e => setPriority(e.target.value)}
          className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-600 focus:border-violet-500 focus:outline-none cursor-pointer"
        >
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        {/* Date */}
        <input
          type="date"
          className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-600 focus:border-violet-500 focus:outline-none"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        {/* Save Button */}
        <button 
          type="submit"
          disabled={loading}
          className="bg-violet-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? "..." : "Add"}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;