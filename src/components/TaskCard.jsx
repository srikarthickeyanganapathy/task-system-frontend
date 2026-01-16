const TaskCard = ({ task, onClick }) => {
  
  // Helper for checklist progress (mocked here if backend doesn't send it populated)
  // Assuming task.checklists is a list of items
  const completedCount = task.checklists ? task.checklists.filter(c => c.isCompleted).length : 0;
  const totalCount = task.checklists ? task.checklists.length : 0;
  const hasChecklist = totalCount > 0;

  const getStatusBadge = (status) => {
    const styles = {
      'ASSIGNED': 'border-neutral-700 bg-neutral-900 text-gray-300',
      'SUBMITTED': 'border-blue-900 bg-blue-900/30 text-blue-400',
      'APPROVED': 'border-green-900 bg-green-900/30 text-green-400',
      'REJECTED': 'border-red-900 bg-red-900/30 text-red-400',
    };
    return styles[status] || styles['ASSIGNED'];
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'ASSIGNED': return 'To Do';
      case 'SUBMITTED': return 'In Review';
      case 'APPROVED': return 'Done';
      case 'REJECTED': return 'Revisions';
      default: return status;
    }
  }

  const getPriorityFlag = (p) => {
    if (p === 'URGENT') return <span className="text-red-500 text-sm ml-1">⚑</span>;
    if (p === 'HIGH') return <span className="text-orange-400 text-sm ml-1">⚑</span>;
    return null;
  };

  const formattedDate = task.dueDate 
    ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
    : null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div 
      onClick={() => onClick(task)}
      className="group grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 hover:bg-neutral-900/50 cursor-pointer transition-all items-center relative overflow-hidden"
    >
      {/* COVER IMAGE STRIP (ClickUp Style) */}
      {task.coverImageUrl && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 z-10">
          <div className="w-full h-full bg-cover bg-center rounded-r-sm opacity-80 group-hover:opacity-100 transition-opacity" 
               style={{ backgroundImage: `url(${task.coverImageUrl})` }}>
          </div>
        </div>
      )}

      {/* 1. Checkbox */}
      <div className="col-span-1 flex items-center justify-center pl-1">
         <div className="w-4 h-4 rounded border border-white/20 bg-transparent group-hover:border-purple-500 transition-colors"></div>
      </div>

      {/* 2. Task Name + Tags + Checklist */}
      <div className="col-span-6 flex items-center gap-3 overflow-hidden pl-1">
         <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
            {task.title}
            {getPriorityFlag(task.priority)}
         </span>
         
         {/* Checklist Progress Indicator */}
         {hasChecklist && (
           <div className="flex items-center gap-1.5 shrink-0">
             <div className="h-1.5 w-12 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500" 
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                ></div>
             </div>
             <span className="text-[10px] text-gray-500 font-mono">{completedCount}/{totalCount}</span>
           </div>
         )}
      </div>

      {/* 3. Assignee */}
      <div className="col-span-2 flex items-center gap-2 overflow-hidden">
         <div className="h-6 w-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-gray-300 border border-white/10 shrink-0">
           {task.assignedTo?.username?.charAt(0).toUpperCase()}
         </div>
         <span className="text-xs text-gray-500 truncate font-medium">
            {task.assignedTo?.username || 'Unassigned'}
         </span>
      </div>
      
      {/* 4. Due Date */}
      <div className="col-span-2 flex items-center overflow-hidden">
         {formattedDate && (
           <span className={`text-xs font-medium ${
             isOverdue ? 'text-red-400' : 'text-gray-500'
           }`}>
             {formattedDate}
           </span>
         )}
      </div>

      {/* 5. Status */}
      <div className="col-span-1 text-right">
         <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getStatusBadge(task.currentStatus)}`}>
           {getStatusText(task.currentStatus)}
         </span>
      </div>
    </div>
  );
};

export default TaskCard;