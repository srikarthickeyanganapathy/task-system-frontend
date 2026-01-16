import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const FloatingNavbar = ({ activeTab, setActiveTab, onProfileClick }) => {
  const { user } = useAuth();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Scroll Logic (Hide on down, Show on up)
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "home", label: "Home", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )},
    { id: "projects", label: "Projects", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
    )},
    { id: "lists", label: "Lists", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
    )},
    { id: "team", label: "Team", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
  ];

  return (
    <>
      {/* Mobile Blur Background (Black/Transparent) */}
      <div className={`fixed inset-x-0 bottom-0 h-16 bg-black/80 backdrop-blur-xl md:hidden transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}></div>

      {/* The Dock (Floating Navbar) */}
      <div className={`
        fixed z-50 transition-all duration-500 ease-out
        md:top-6 md:h-16
        bottom-6 left-1/2 -translate-x-1/2
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}
      `}>
        <div className="relative flex items-center bg-neutral-900/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-3 py-3 gap-2">
          
          {/* Nav Items */}
          {navLinks.map((link, index) => {
            const isHovered = hoveredIndex === index;
            const isActive = activeTab === link.id;
            
            return (
              <div
                key={link.id}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setActiveTab(link.id)}
                className="relative group cursor-pointer"
              >
                {/* BUTTON */}
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-out
                  ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}
                  ${isHovered ? 'bg-neutral-800 scale-110' : 'bg-transparent'}
                `}>
                  {link.icon}
                </div>
                
                {/* PURPLE GLOW / BLUR EFFECT (Always Purple on Active/Hover) */}
                {(isActive || isHovered) && (
                  <span className="absolute inset-0 rounded-full bg-purple-600 opacity-20 blur-md animate-pulse -z-10"></span>
                )}
                
                {/* Active Indicator Dot */}
                {isActive && (
                   <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
                )}

                {/* Tooltip */}
                {isHovered && (
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                    {link.label}
                  </span>
                )}
              </div>
            );
          })}

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1"></div>

          {/* Profile Trigger */}
          <div 
            onClick={onProfileClick}
            onMouseEnter={() => setHoveredIndex(99)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="relative group cursor-pointer"
          >
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-out overflow-hidden border border-white/20
              ${hoveredIndex === 99 ? 'scale-110 border-purple-500' : 'hover:scale-105'}
            `}>
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
             {/* Glow for Profile */}
             {hoveredIndex === 99 && (
               <span className="absolute inset-0 rounded-full bg-purple-500 opacity-30 blur-md -z-10"></span>
             )}
          </div>

        </div>
      </div>
    </>
  );
};

export default FloatingNavbar;