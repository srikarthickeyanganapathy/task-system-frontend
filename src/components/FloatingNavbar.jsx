import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const FloatingNavbar = ({ activeTab, setActiveTab, onProfileClick }) => {
  const { user } = useAuth();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY < lastScrollY.current || currentY < 50);
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "home", label: "Home", icon: <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { id: "projects", label: "Projects", icon: <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
    { id: "lists", label: "Lists", icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
    { id: "team", label: "Team", icon: <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
  ];

  return (
    <div className={`fixed z-50 transition-all duration-500 ease-out left-1/2 -translate-x-1/2 ${visible ? 'bottom-8 opacity-100' : '-bottom-24 opacity-0'}`}>
      <div className="flex items-center bg-[#1A1D26]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-4 py-3 gap-3">
        {navLinks.map((link, index) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`relative group flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isActive ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{link.icon}</svg>
              {hoveredIndex === index && (
                <span className="absolute -top-10 bg-black text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 whitespace-nowrap">
                  {link.label}
                </span>
              )}
            </button>
          );
        })}
        
        <div className="w-px h-6 bg-white/10 mx-1"></div>

        <button onClick={onProfileClick} className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 hover:border-violet-500 transition-colors">
          <div className="w-full h-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </button>
      </div>
    </div>
  );
};

export default FloatingNavbar;