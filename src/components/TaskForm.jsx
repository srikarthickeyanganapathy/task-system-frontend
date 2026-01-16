import { useState } from "react";

const TaskForm = ({ user, onAssign }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeUsername, setAssigneeUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !assigneeUsername.trim()) {
      return setError("Title and Assignee are required");
    }

    onAssign({
      title,
      description,
      assigneeUsername,
      creatorUsername: user.username,
    });

    setTitle("");
    setDescription("");
    setAssigneeUsername("");
  };

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">Create New Task</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task name
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter task name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignee
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter username"
              value={assigneeUsername}
              onChange={(e) => setAssigneeUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Add a description (optional)"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button 
            type="submit"
            className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            Create Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;