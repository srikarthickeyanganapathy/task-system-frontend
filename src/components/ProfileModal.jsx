import { useAuth } from "../context/AuthContext";

const ProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header with Banner */}
        <div className="h-24 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
        
        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="-mt-12 mb-4">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
              <div className="w-full h-full rounded-full bg-violet-100 text-violet-700 font-bold text-3xl flex items-center justify-center border border-slate-100">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">{user.username}</h2>
            <div className="inline-block mt-2 px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-bold uppercase tracking-wide">
              {user.role?.name}
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">User ID</span>
              <span className="font-medium text-slate-900">#{user.id || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Active
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Member Since</span>
              <span className="font-medium text-slate-900">Oct 2023</span> {/* Static placeholder or dynamic if DB had date */}
            </div>
          </div>

          {/* Action */}
          <button 
            onClick={onClose} 
            className="mt-6 w-full py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;