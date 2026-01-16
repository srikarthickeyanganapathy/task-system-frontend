const TaskItem = ({ task, currentUser, onSubmit, onApprove, onReject }) => {
  const isOwner = task.assignedTo?.username === currentUser.username;

  return (
    <div className="rounded-2xl border border-apple-border bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{task.title}</h3>
        <span className="text-xs text-apple-sub">{task.currentStatus}</span>
      </div>

      {task.description && (
        <p className="mb-3 text-sm text-apple-sub">{task.description}</p>
      )}

      <div className="mb-4 text-xs text-apple-sub">
        Assigned to: {task.assignedTo?.username}
      </div>

      <div className="flex gap-2">
        {isOwner && task.currentStatus === "ASSIGNED" && (
          <button
            onClick={() => onSubmit(task.id)}
            className="rounded-lg border border-apple-border px-3 py-1.5 text-xs hover:bg-gray-100"
          >
            Submit
          </button>
        )}

        {task.currentStatus === "SUBMITTED" && (
          <>
            <button
              onClick={() => onApprove(task.id)}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white"
            >
              Approve
            </button>
            <button
              onClick={() => onReject(task.id)}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
