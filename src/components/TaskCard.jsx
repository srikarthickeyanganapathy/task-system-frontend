const TaskCard = ({ task, onClick }) => {
  const getPriorityColor = (status) => {
    const colors = {
      'REJECTED': 'border-l-red-500',
      'SUBMITTED': 'border-l-blue-500',
      'APPROVED': 'border-l-green-500',
      'ASSIGNED': 'border-l-gray-400'
    };
    return colors[status] || 'border-l-gray-400';
  };

  return (
    <div 
      onClick={() => onClick(task)}
      className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-all mb-3 border-l-4 ${getPriorityColor(task.currentStatus)}`}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 leading-snug flex-1 pr-2">
          {task.title}
        </h4>
        {task.currentStatus === 'REJECTED' && (
          <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-medium whitespace-nowrap">
            Revisions
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white font-medium" title={task.assignedTo?.username}>
            {task.assignedTo?.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {task.assignedTo?.username}
          </span>
        </div>
        
        <span className="text-xs text-gray-400">
          #{task.id}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;