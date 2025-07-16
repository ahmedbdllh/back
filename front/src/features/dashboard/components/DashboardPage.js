import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../../../core/layout/Navbar';
import Sidebar from '../../../core/layout/Sidebar';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Track sidebar collapse state
  const location = useLocation();

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path.includes('/company-management')) {
      return 'Company Management';
    } else if (path.includes('/manager-management')) {
      return 'Manager Management';
    } else if (path.includes('/player-management')) {
      return 'Player Management';
    } else if (path.includes('/user-management')) {
      return 'User Management';
    } else if (path.includes('/equipment-management')) {
      return 'Equipment Management';
    } else if (path.includes('/booking-management')) {
      return 'Booking Management';
    } else if (path.includes('/tournament-management')) {
      return 'Tournament Management';
    } else if (path.includes('/court-schedules')) {
      return 'Court Schedules';
    } else if (path.includes('/court-management')) {
      return 'Court Management';
    } else if (path.includes('/team-management')) {
      return 'Team Management';
    } else if (path.includes('/complaint-management')) {
      return 'Complaint Management';
    } else if (path.includes('/payment-management')) {
      return 'Payment Management';
    }
    
    return 'Dashboard';
  };

  // Handle sidebar collapse state changes
  const handleSidebarCollapse = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  };

  // Better responsive handling for different device sizes
  useEffect(() => {
    const handleResize = () => {
      // Mobile: Collapsed and closed by default
      if (window.innerWidth < 640) {
        setSidebarCollapsed(true);
        setSidebarOpen(false);
      } 
      // Tablet: Collapsed but visible
      else if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
        setSidebarOpen(true);
      } 
      // Desktop: Expanded and visible
      else {
        setSidebarCollapsed(false);
        setSidebarOpen(true);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#020817]">
      {/* Navbar with responsive padding */}
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Layout container with improved flex handling */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Pass both open and collapsed states to Sidebar */}
        <Sidebar 
          mobileOpen={sidebarOpen} 
          initialCollapsed={sidebarCollapsed}
          onMobileToggle={setSidebarOpen}
          onCollapseChange={handleSidebarCollapse} 
        />
        
        {/* Main content with smoother transitions and better spacing */}
        <main 
          className={`
            flex-1 
            overflow-y-auto 
            transition-all duration-300 ease-in-out
            p-4 sm:p-6 md:p-8
            ${sidebarCollapsed 
              ? 'sm:ml-20' 
              : 'sm:ml-80'
            }
          `}
          style={{
            scrollBehavior: 'smooth',
          }}
        >
          <div className="max-w-7xl mx-auto">            {/* Content card with improved responsive padding */}
            <div className="bg-[#020817] backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-6 animate-fadeIn">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-8">
                {getPageTitle()}
              </h1>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;



