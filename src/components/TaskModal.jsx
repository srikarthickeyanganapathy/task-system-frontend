import { useState, useEffect } from "react";
import { getComments, addComment, addChecklistItem, toggleChecklistItem } from "../api/taskApi";

const TaskModal = ({ task, currentUser, onClose, onSubmit, onApprove, onReject }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  
  // Checklist State
  const [checklistInput, setChecklistInput] = useState("");
  const [checklists, setChecklists] = useState(task.checklists || []);

  const isOwner = task.assignedTo?.username === currentUser.username;
  const userRole = currentUser.role?.name;
  
  const canSubmit = isOwner && (task.currentStatus === "ASSIGNED" || task.currentStatus === "REJECTED");
  const canReview = (userRole === "MANAGER" || userRole === "DIRECTOR") && task.currentStatus === "SUBMITTED";

  // Initial Data Load
  useEffect(() => {
    getComments(task.id).then(setComments).catch(console.error);
    // In real app, you'd fetch checklists here if not provided in task object
  }, [task.id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const added = await addComment(task.id, currentUser.username, newComment);
      setComments([...comments, added]);
      setNewComment("");
    } catch (err) { alert("Failed"); }
  };

  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!checklistInput.trim()) return;
    // Optimistic UI Update
    const newItem = { id: Date.now(), text: checklistInput, isCompleted: false };
    setChecklists([...checklists, newItem]);
    setChecklistInput("");
    try {
       await addChecklistItem(task.id, checklistInput);
       // Then re-fetch real data
    } catch(err) {
       alert("Failed to add checklist");
       setChecklists(checklists); // Revert
    }
  };

  const handleToggleChecklist = async (id) => {
    const updated = checklists.map(c => c.id === id ? {...c, isCompleted: !c.isCompleted} : c);
    setChecklists(updated);
    try {
      await toggleChecklistItem(id);
    } catch(err) { alert("Failed"); }
  };

  const handleRejectConfirm = () => {
    if (!rejectReason) return alert("Reason required");
    onReject(task.id, rejectReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#171717] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#171717]">
          <div className="flex items-center gap-3">
            <span className="bg-neutral-800 text-gray-400 px-2 py-1 rounded text-[10px] font-mono font-bold">#{task.id}</span>
            <span className="text-sm font-bold text-white">{task.title}</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-white transition-colors bg-neutral-900 hover:bg-neutral-800 rounded-full p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="grid grid-cols-3 gap-12">
              {/* Left: Main Content */}
              <div className="col-span-2 space-y-8">
                
                {/* CHECKLIST SECTION */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                     Checklist
                  </h4>
                  <div className="space-y-2 mb-4">
                     {checklists.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-white/5 group">
                           <div 
                             onClick={() => handleToggleChecklist(item.id)}
                             className={`
                                w-5 h-5 rounded border cursor-pointer flex items-center justify-center transition-all
                                ${item.isCompleted ? 'bg-purple-600 border-purple-600' : 'border-gray-600 hover:border-purple-400'}
                             `}
                           >
                             {item.isCompleted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                           </div>
                           <span className={`text-sm ${item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                             {item.text}
                           </span>
                        </div>
                     ))}
                  </div>
                  {/* Add Checklist Input */}
                  <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                     <input 
                       className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                       placeholder="Add an item..."
                       value={checklistInput}
                       onChange={e => setChecklistInput(e.target.value)}
                     />
                     <button 
                       type="submit"
                       className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm font-bold border border-white/10"
                     >
                       Add
                     </button>
                  </form>
                </div>

                {/* Comments */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Comments</h4>
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-900 flex-shrink-0 flex items-center justify-center text-xs font-bold text-purple-300 border border-purple-700">
                          {c.user?.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{c.user?.username}</span>
                            <span className="text-[10px] text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="text-sm text-gray-300 bg-neutral-900/50 p-3 rounded-xl border border-white/5">
                            {c.comment}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handlePostComment} className="mt-6 bg-neutral-900 p-1 rounded-xl border border-white/5 flex items-center shadow-sm">
                    <input
                      className="flex-1 bg-transparent px-4 py-2 text-sm text-gray-200 focus:outline-none placeholder:text-gray-600"
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
                      className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-700 shadow-[0_0_10px_rgba(147,51,234,0.4)] transition-shadow"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: Properties */}
              <div className="space-y-6">
                <div className="bg-neutral-900 rounded-xl border border-white/5 p-5">
                   <div className="space-y-4">
                     <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Assignee</label>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            {task.assignedTo?.username.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-white">{task.assignedTo?.username}</span>
                        </div>
                     </div>
                     <div className="border-t border-white/5 pt-4">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Status</label>
                        <span className="inline-block px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-bold text-gray-300">
                          {task.currentStatus}
                        </span>
                     </div>
                     <div className="border-t border-white/5 pt-4">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Priority</label>
                        <span className={`text-sm font-bold ${task.priority === 'URGENT' ? 'text-red-400' : 'text-gray-300'}`}>
                          {task.priority}
                        </span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/5 bg-neutral-900 px-8 py-4 flex justify-end gap-3">
           {!isRejecting ? (
             <>
               {canSubmit && (
                 <button 
                   onClick={() => { onSubmit(task.id); onClose(); }} 
                   className="bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all"
                 >
                   {task.currentStatus === 'REJECTED' ? 'Resubmit' : 'Submit for Review'}
                 </button>
               )}
               {canReview && (
                 <div className="flex gap-2 ml-auto">
                   <button 
                     onClick={() => { onApprove(task.id); onClose(); }} 
                     className="bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-green-700"
                   >
                     Approve
                   </button>
                   <button 
                     onClick={() => setIsRejecting(true)} 
                     className="bg-neutral-800 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-neutral-700 border border-white/10"
                   >
                     Reject
                   </button>
                 </div>
               )}
             </>
           ) : (
             <div className="flex items-center gap-3 w-full max-w-md">
                <input 
                  placeholder="Why are you rejecting this?" 
                  className="flex-1 bg-neutral-800 border border-red-900/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
                <button 
                  onClick={handleRejectConfirm} 
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700"
                >
                  Reject
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;