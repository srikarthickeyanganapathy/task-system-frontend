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
    <div className="mb-10 rounded-2xl border border-apple-border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-medium">Assign new task</h2>

      <form className="grid grid-cols-1 gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
        <input
          className="rounded-lg border border-apple-border px-4 py-3 text-sm"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="rounded-lg border border-apple-border px-4 py-3 text-sm"
          placeholder="Assignee username"
          value={assigneeUsername}
          onChange={(e) => setAssigneeUsername(e.target.value)}
        />
        <input
          className="rounded-lg border border-apple-border px-4 py-3 text-sm"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="rounded-lg bg-apple-blue px-6 py-3 text-sm font-medium text-white">
          Assign
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default TaskForm;
