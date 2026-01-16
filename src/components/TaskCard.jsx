const TaskCard = ({ task, onClick }) => {
  const completedCount = task.checklists ? task.checklists.filter(c => c.isCompleted).length : 0;
  const totalCount = task.checklists ? task.checklists.length : 0;

  const formattedDate = task.dueDate 
    ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
    : null;

  return (
    <div 
      onClick={() => onClick(task)}
      className="group bg-[#1F222B] hover:bg-[#252832] border border-white/5 hover:border-violet-500/30 rounded-lg p-3 cursor-pointer transition-all duration-200 shadow-sm relative overflow-hidden"
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <span className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug group-hover:text-white">
          {task.title}
        </span>
        {task.priority === 'URGENT' && <span className="text-red-400 text-xs">⚑</span>}
        {task.priority === 'HIGH' && <span className="text-amber-400 text-xs">⚑</span>}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
           <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-[#1F222B]">
             {task.assignedTo?.username?.[0]?.toUpperCase()}
           </div>
           {task.reviewedBy && (
             <div className="w-5 h-5 -ml-3 rounded-full bg-emerald-600 flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[#1F222B]" title={`Reviewed by ${task.reviewedBy.username}`}>
               {task.reviewedBy.username[0].toUpperCase()}
             </div>
           )}
        </div>

        <div className="flex items-center gap-3">
           {totalCount > 0 && (
             <div className="flex items-center gap-1 text-[10px] text-slate-500">
               <span>{completedCount}/{totalCount}</span>
             </div>
           )}
           {formattedDate && (
             <div className="text-[10px] font-medium text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
               {formattedDate}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;