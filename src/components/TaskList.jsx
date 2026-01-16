import TaskItem from "./TaskItem";

const TaskList = ({ tasks, currentUser, onSubmit, onApprove, onReject }) => {
  if (!tasks.length) {
    return <p className="text-sm text-apple-sub">No tasks found.</p>;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          currentUser={currentUser}
          onSubmit={onSubmit}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
};

export default TaskList;
