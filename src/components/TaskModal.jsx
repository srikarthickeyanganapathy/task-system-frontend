import { useState, useEffect } from "react";
import { getComments, addComment } from "../api/taskApi";

const TaskModal = ({ task, currentUser, onClose, onSubmit, onApprove, onReject }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const isOwner = task.assignedTo?.username === currentUser.username;
  const userRole = currentUser.role?.name;
  
  const canSubmit = isOwner && (task.currentStatus === "ASSIGNED" || task.currentStatus === "REJECTED");
  const canReview = (userRole === "MANAGER" || userRole === "DIRECTOR") && task.currentStatus === "SUBMITTED";

  useEffect(() => {
    getComments(task.id).then(setComments).catch(console.error);
  }, [task.id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const added = await addComment(task.id, currentUser.username, newComment);
      setComments([...comments, added]);
      setNewComment("");
    } catch (err) {
      alert("Failed to post comment");
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectReason) return alert("Reason required");
    onReject(task.id, rejectReason);
    onClose();
  };

  const getStatusStyles = (status) => {
    const styles = {
      'APPROVED': 'bg-green-100 text-green-700 border-green-200',
      'REJECTED': 'bg-red-100 text-red-700 border-red-200',
      'SUBMITTED': 'bg-blue-100 text-blue-700 border-blue-200',
      'ASSIGNED': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-md text-xs font-medium border ${getStatusStyles(task.currentStatus)}`}>
              {task.currentStatus}
            </span>
            <span className="text-sm text-gray-400">Task #{task.id}</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Main Content */}
          <div className="p-6">
            {/* Title */}
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">{task.title}</h1>

            {/* Two Column Layout */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Main Info */}
              <div className="col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Description</h3>
                  <div className="rounded-md bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 min-h-[120px]">
                    {task.description || "No description provided."}
                  </div>
                </div>

                {/* Activity */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Activity</h3>
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center text-sm font-medium text-white">
                          {c.user?.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">{c.user?.username}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 bg-white border border-gray-200 rounded-md p-3">
                            {c.comment}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comment Input */}
                  <div className="mt-4 flex gap-2">
                    <input
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handlePostComment(e);
                        }
                      }}
                    />
                    <button 
                      onClick={handlePostComment}
                      className="bg-purple-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Metadata */}
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                      Assignee
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-purple-500 flex items-center justify-center text-sm font-medium text-white">
                        {task.assignedTo?.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {task.assignedTo?.username}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                      Created By
                    </label>
                    <span className="text-sm text-gray-900">{task.createdBy?.username}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                      Status
                    </label>
                    <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium border ${getStatusStyles(task.currentStatus)}`}>
                      {task.currentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          {!isRejecting ? (
            <div className="flex justify-end gap-2">
              {canSubmit && (
                <button 
                  onClick={() => { onSubmit(task.id); onClose(); }} 
                  className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                >
                  {task.currentStatus === 'REJECTED' ? 'Resubmit for Review' : 'Submit for Review'}
                </button>
              )}

              {canReview && (
                <>
                  <button 
                    onClick={() => { onApprove(task.id); onClose(); }} 
                    className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => setIsRejecting(true)} 
                    className="px-5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input 
                placeholder="Enter rejection reason..." 
                className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <button 
                onClick={handleRejectConfirm} 
                className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                Confirm Rejection
              </button>
              <button 
                onClick={() => setIsRejecting(false)} 
                className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;