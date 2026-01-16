import { useAuth } from "../context/AuthContext";

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#161922] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
        
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
        
        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="-mt-12 mb-4 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-[#161922] p-1.5">
              <div className="w-full h-full rounded-full bg-slate-800 text-white text-3xl font-bold flex items-center justify-center border border-white/10">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">{user.username}</h2>
            <span className="inline-block mt-1 px-3 py-0.5 bg-violet-500/10 text-violet-400 rounded-full text-[10px] font-bold uppercase tracking-wide border border-violet-500/20">
              {user.role?.name}
            </span>
          </div>

          <div className="space-y-3 bg-[#1A1D26] rounded-xl p-4 border border-white/5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">User ID</span>
              <span className="font-mono text-slate-300">#{user.id || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Online
              </span>
            </div>
          </div>

          {/* Logout Button (Restored!) */}
          <button 
            onClick={() => { logout(); onClose(); }} 
            className="mt-6 w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;