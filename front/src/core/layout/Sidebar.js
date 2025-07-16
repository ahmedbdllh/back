import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
// npm install lucide-react framer-motion

import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCog, User, Wrench, Calendar, Trophy, Building2, Dumbbell, UsersRound, MessageSquare, CreditCard, ChevronDown, Menu, X, Home } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ onCollapseChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState('');  // Search functionality removed
  const [userRole, setUserRole] = useState(null); // Added to store user role
  const location = useLocation();
  const sidebarRef = useRef(null);

  // Get user role from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserRole(userData.role);
      } catch (error) {
        console.error("Failed to parse user data from localStorage:", error);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, []);

  // Handle clicks outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        const mobileToggleBtn = document.getElementById('mobile-toggle');
        if (mobileToggleBtn && !mobileToggleBtn.contains(event.target)) {
          setMobileOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);
  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        // Mobile - always collapsed
        setCollapsed(true);
      } else if (window.innerWidth < 1024) {
        // Tablet - semi-collapsed with icons
        setCollapsed(true);
      } else {
        // Desktop - can be expanded or collapsed based on user preference
        // Don't auto-change on desktop to preserve user choice
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    if (onCollapseChange) {
      onCollapseChange(newCollapsed);
    }
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDropdownToggle = (linkName) => {
    setOpenDropdown(openDropdown === linkName ? '' : linkName);
  };
  // Search functionality removed

  const allSidebarLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={20} strokeWidth={1.5} /> },
    {
      name: 'User Management',
      icon: <Users size={20} strokeWidth={1.5} />,
      subLinks: [
        { name: 'Manager Management', path: '/dashboard/manager-management', icon: <UserCog size={18} strokeWidth={1.5} /> },
        { name: 'Player Management', path: '/dashboard/player-management', icon: <User size={18} strokeWidth={1.5} /> },
      ],
    },
    { name: 'Equipment Management', path: '/dashboard/equipment-management', icon: <Wrench size={20} strokeWidth={1.5} /> },
    { name: 'Booking Management', path: '/dashboard/booking-management', icon: <Calendar size={20} strokeWidth={1.5} /> },
    { name: 'Tournament Management', path: '/dashboard/tournament-management', icon: <Trophy size={20} strokeWidth={1.5} /> },
    { name: 'Company Management', path: '/dashboard/company-management', icon: <Building2 size={20} strokeWidth={1.5} /> },
    {
      name: 'Court Management',
      icon: <Dumbbell size={20} strokeWidth={1.5} />,
      subLinks: [
        { name: 'Manage Courts', path: '/dashboard/court-management', icon: <Dumbbell size={18} strokeWidth={1.5} /> },
        { name: 'Court Schedules', path: '/dashboard/court-schedules', icon: <Calendar size={18} strokeWidth={1.5} /> },
      ],
    },
    { name: 'Team Management', path: '/dashboard/team-management', icon: <UsersRound size={20} strokeWidth={1.5} /> },
    { name: 'Complaint Management', path: '/dashboard/complaint-management', icon: <MessageSquare size={20} strokeWidth={1.5} /> },
    { name: 'Payment Management', path: '/dashboard/payment-management', icon: <CreditCard size={20} strokeWidth={1.5} /> },
  ];

  const managerSpecificLinks = [
    'Booking Management',
    'Tournament Management', 
    'Payment Management',
    'Company Management',
    'Court Management',
    'Equipment Management'
  ];

  const sidebarLinks = userRole === 'Manager'
    ? allSidebarLinks.filter(link => managerSpecificLinks.includes(link.name))
    : allSidebarLinks;
  // Search functionality removed - Just use the sidebarLinks directly
  const filteredLinks = sidebarLinks;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden"
            onClick={toggleMobileSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile toggle button */}
      <motion.button 
        id="mobile-toggle"
        onClick={toggleMobileSidebar}
        className="fixed bottom-6 right-6 z-[60] sm:hidden w-14 h-14 flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(33,79,207,0.5)] hover:shadow-[0_0_25px_rgba(33,79,207,0.8)] transition-all duration-300 ease-in-out"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: 'linear-gradient(135deg, #F59E0B, #10B981)', // amber-500 to emerald-500
        }}
      >
        {mobileOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <Menu size={24} className="text-white" />
        )}
      </motion.button>      {/* Sidebar */}      <motion.aside 
        ref={sidebarRef}        className={`
          fixed top-16 h-[calc(100vh-64px)] z-[49]
          ${collapsed ? 'w-16 sm:w-20' : 'w-72 sm:w-80'} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
        `}
        style={{
          transition: 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}      >        {/* Glass effect background */}
        <div className="absolute inset-0 backdrop-blur-sm border-r border-white/5 shadow-[5px_0_30px_rgba(0,0,0,0.3)] transition-all duration-300" style={{ 
          backgroundColor: '#0C1D35',
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.1) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 40%)'
        }}></div>
        
        {/* Decorative elements - hide some on smaller screens for performance */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500/20 to-lime-600/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-teal-500/20 to-sky-400/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          
          {/* Animated circles - only show on larger screens */}
          <div className="hidden md:block absolute top-1/4 right-0 w-2 h-2 bg-lime-400 rounded-full"></div>
          <div className="hidden md:block absolute top-1/3 right-4 w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
          <div className="hidden md:block absolute top-2/3 right-8 w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping"></div>
          
          {/* Grid lines - lighter on mobile for performance */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDYwaDYwVjBoLTYweiIvPjxwYXRoIGQ9Ik02MCA2MFYwSDB2NjB6IiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2U9IiNmZmYiLz48L2c+PC9zdmc+')] opacity-10"></div>
        </div>
        
        {/* Content */}
        <div className="relative flex flex-col h-full z-10">          {/* Header */}
          <div className={`p-4 sm:p-5 flex items-center h-20 sm:h-24 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <div className="flex items-center justify-start">
                <img 
                  src="/assets/icons/logo.png" 
                  alt="Sportify Logo" 
                  className="h-12 max-h-12 sm:h-14 sm:max-h-14 transition-all duration-300 ease-in-out object-contain"
                />
              </div>
            )}
            
            <motion.button 
              onClick={toggleSidebar}
              className="p-2 sm:p-2.5 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {collapsed ? (
                <ChevronDown size={18} className="rotate-[-90deg]" />
              ) : (
                <ChevronDown size={18} className="rotate-90" />
              )}
            </motion.button>
          </div>
            {/* Search functionality removed */}
          
          {/* Navigation */}
          <nav className="flex-grow overflow-y-auto py-2 sm:py-3 px-2 sm:px-3 space-y-1 sm:space-y-1.5 hide-scrollbar">
            {filteredLinks.map((link, index) => (
              <motion.div 
                key={link.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                {link.subLinks ? (
                  // Dropdown
                  <div className="mb-1">
                    <motion.button
                      onClick={() => handleDropdownToggle(link.name)}
                      className={`
                        group w-full flex items-center rounded-xl p-2.5 sm:p-3
                        transition-all duration-200 ease-out
                        hover:bg-white/10
                        ${collapsed ? 'justify-center' : 'justify-between'}
                        ${openDropdown === link.name ? 'bg-gradient-to-r from-pink-500/20 to-[#214FCF]/20 text-white' : 'text-white/70'}
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center">
                        <div className={`
                          flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg
                          transition-all duration-300 ease-out
                          ${openDropdown === link.name 
                            ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                            : 'bg-slate-700/50 text-sky-200 group-hover:text-white group-hover:bg-gradient-to-br group-hover:from-sky-500 group-hover:to-indigo-600'
                          }
                          ${collapsed ? 'mx-auto' : 'mr-3'}
                        `}>
                          {link.icon}
                        </div>
                        {!collapsed && (
                          <span className="text-sm font-medium">
                            {link.name}
                          </span>
                        )}
                      </div>
                      {!collapsed && (
                        <ChevronDown 
                          size={16} 
                          className={`transition-transform duration-300 ${openDropdown === link.name ? 'rotate-180' : 'rotate-0'}`}
                        />
                      )}
                    </motion.button>
                    
                    {/* Dropdown content */}
                    <AnimatePresence>
                      {link.subLinks && openDropdown === link.name && !collapsed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 sm:mt-2 ml-4 sm:ml-5 pl-3 sm:pl-4 border-l border-white/10 space-y-1">
                            {link.subLinks.map((subLink) => (
                              <motion.div
                                key={subLink.name}
                                whileHover={{ x: 4 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                              >
                                <NavLink
                                  to={subLink.path}
                                  className={({ isActive }) => `
                                    group flex items-center rounded-lg py-2 sm:py-2.5 px-2.5 sm:px-3
                                    text-sm transition-all duration-200
                                    ${isActive 
                                      ? 'text-white bg-gradient-to-r from-pink-500/20 to-[#214FCF]/20'
                                      : 'text-white/60 hover:text-white'
                                    }
                                  `}
                                >
                                  <div className={`
                                    mr-2.5 sm:mr-3 w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center
                                    ${location.pathname === subLink.path 
                                      ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-blue-500/30' 
                                      : 'bg-slate-700/50 text-sky-200 group-hover:text-white group-hover:bg-gradient-to-br group-hover:from-sky-500 group-hover:to-indigo-600'
                                    }
                                  `}>
                                    {subLink.icon}
                                  </div>
                                  <span className="text-xs sm:text-sm">{subLink.name}</span>
                                </NavLink>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  // Regular link
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <NavLink
                      to={link.path}
                      className={({ isActive }) => `
                        group flex items-center rounded-xl p-2.5 sm:p-3
                        transition-all duration-200 ease-out
                        ${isActive 
                          ? 'bg-gradient-to-r from-pink-500/20 to-[#214FCF]/20 text-white'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }
                        ${collapsed ? 'justify-center' : 'justify-start'}
                      `}
                    >
                      <div className={`
                        flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg
                        transition-all duration-300 ease-out
                        ${location.pathname === link.path 
                          ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'bg-slate-700/50 text-sky-200 group-hover:text-white group-hover:bg-gradient-to-br group-hover:from-sky-500 group-hover:to-indigo-600'
                        }
                        ${collapsed ? 'mx-auto' : 'mr-3'}
                      `}>
                        {link.icon}
                      </div>
                      {!collapsed && (
                        <span className="text-sm font-medium">
                          {link.name}
                        </span>
                      )}
                    </NavLink>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </nav>
        </div>      </motion.aside>

      {/* Content area adjustment - remove this section as it's not needed */}
    </>
  );
};

export default Sidebar;