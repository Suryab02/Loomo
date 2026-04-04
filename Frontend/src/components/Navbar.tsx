import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Trello, LineChart, LogOut, Orbit, LucideIcon } from 'lucide-react';

interface NavLink {
  path: string;
  label: string;
  icon: LucideIcon;
}

const links: NavLink[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/kanban', label: 'Kanban', icon: Trello },
  { path: '/insights', label: 'Insights', icon: LineChart },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-[#ededed]">
      <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-2 text-[17px] font-bold text-[#111111] tracking-tight">
          <Orbit className="w-5 h-5 text-[#6d28d9]" />
          Loomo
        </div>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map(link => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive ? 'text-[#111111]' : 'text-[#737373] hover:text-[#111111]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 bg-[#f7f7f7] rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4" />
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-full text-[#a3a3a3] hover:text-[#111111] hover:bg-[#f7f7f7] transition-all flex items-center gap-2 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
        </button>

      </div>
    </nav>
  );
}

export default Navbar;
