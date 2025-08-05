"use client"

import { useState, useEffect , useCallback, lazy, Suspense} from "react"
import { useNavigate } from "react-router-dom"
import { NavLink } from "../../shared/ui/components/NavLink"
import { AuthModal } from "../../shared/ui/components/AuthModal"
import { Logo } from "../../shared/ui/components/Logo"
import { Avatar } from "../../shared/ui/components/Avatar"
import NotificationBell from "../../components/NotificationBell"
import { getImageUrl, handleImageError } from "../../shared/utils/imageUtils"

// Lazy load auth components to prevent reCAPTCHA from loading globally
const ManagerSignIn = lazy(() => import("../../features/auth/components/ManagerSignIn").then(module => ({ default: module.ManagerSignIn })))
const PlayerSignIn = lazy(() => import("../../features/auth/components/PlayerSignIn").then(module => ({ default: module.PlayerSignIn })))
const ManagerSignUp = lazy(() => import("../../features/auth/components/ManagerSignUp").then(module => ({ default: module.ManagerSignUp })))
const PlayerSignUp = lazy(() => import("../../features/auth/components/PlayerSignUp").then(module => ({ default: module.PlayerSignUp })))
const PlayerPasswordReset = lazy(() => import("../../features/auth/components/PlayerPasswordReset").then(module => ({ default: module.PlayerPasswordReset })))
const ManagerPasswordReset = lazy(() => import("../../features/auth/components/ManagerPasswordReset").then(module => ({ default: module.ManagerPasswordReset })))
const TwoFactorModal = lazy(() => import("../../features/auth/components/TwoFactorModal"))

export const Navbar = () => {
  const navigate = useNavigate();
  const navLinks = [
    { label: "Courts", href: "/courts" },
    { label: "Teams", href: "/teams" },
    { label: "Padel", href: "#padel" },
    { label: "Football", href: "#football" },
    { label: "Basketball", href: "#basketball" },
    { label: "Tennis", href: "#tennis" },
  ]
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isSignInDropdownOpen, setIsSignInDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showManagerSignIn, setShowManagerSignIn] = useState(false)
  const [showPlayerSignIn, setShowPlayerSignIn] = useState(false)
  const [isSignUpDropdownOpen, setIsSignUpDropdownOpen] = useState(false)
  const [showManagerSignUp, setShowManagerSignUp] = useState(false)
  const [showPlayerSignUp, setShowPlayerSignUp] = useState(false)
  const [showPlayerPasswordReset, setShowPlayerPasswordReset] = useState(false)
  const [showManagerPasswordReset, setShowManagerPasswordReset] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // 2FA related state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAData, setTwoFAData] = useState({
    email: '',
    tempToken: '',
    onSuccess: null
  });

 // Added handleLogout as a dependency, will define handleLogout with useCallback later
  
 // Added fetchUserDetails, will wrap with useCallback

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUserName("");
    setUserProfileImage(null);
    setUserRole(null);
    // Redirect to home page after logout
    window.location.href = "/";
  }, []);

  // Handle 2FA requirement
  const handle2FARequired = useCallback((email, tempToken, onSuccess) => {
    setTwoFAData({
      email,
      tempToken,
      onSuccess
    });
    setShow2FAModal(true);
    // Close any open auth modals
    setShowManagerSignIn(false);
    setShowPlayerSignIn(false);
  }, []);

  const fetchUserDetails = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await fetch("http://localhost:5000/api/auth/profile", {
          headers: {
            "x-auth-token": token, // Ensure this matches your backend middleware
          },
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.user) {
            // Process profile image path to extract just the filename if it's a complex path
            let profileImage = userData.user.profileImage || null;
            
            // Extract just the filename for profile images with complex paths
            if (profileImage && typeof profileImage === 'string' && 
               (profileImage.includes('\\') || profileImage.includes('C:') || 
                profileImage.includes('/uploads/'))) {
              
              // Extract the filename using regex pattern matching for profileImage files
              const matches = profileImage.match(/profileImage-[^\\/]+\.\w+/);
              if (matches && matches[0]) {
                profileImage = '/uploads/' + matches[0];
                console.log('Extracted and simplified profile image path:', profileImage);
              }
            }
            
            setUserName(userData.user.fullName || "User");
            setUserProfileImage(profileImage);
            setUserRole(userData.user.role || null);
            setIsAuthenticated(true);
            // Store/update user details in localStorage INCLUDING the user ID
            localStorage.setItem("user", JSON.stringify({
              id: userData.user.id,
              _id: userData.user.id, // Include both for compatibility
              fullName: userData.user.fullName,
              email: userData.user.email,
              role: userData.user.role,
              profileImage: profileImage // Store the simplified path
            }));
          } else {
            // Token might be invalid or expired, or user not found
            handleLogout(); // Clear local storage and state
          }
        } else {
          // Handle non-OK responses (e.g., 401, 403)
          console.error("Failed to fetch user details, status:", response.status);
          handleLogout(); // Clear local storage if token is invalid
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        setIsAuthenticated(false); // Assume not authenticated on error
        setUserName("");
        setUserProfileImage(null);
        setUserRole(null);
        // Optionally clear localStorage if fetch fails due to network or server error
        // localStorage.removeItem("token");
        // localStorage.removeItem("user");
      }
    } else {
      setIsAuthenticated(false);
      setUserName("");
      setUserProfileImage(null);
      setUserRole(null);
    }
  }, [handleLogout]);

  const loadUser = useCallback(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token) {
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUserName(userData.fullName || "User");
          
          // Ensure profile image is processed correctly
          let profileImage = userData.profileImage || null;
          
          // Extract just the filename for profile images with complex paths
          if (profileImage && typeof profileImage === 'string' && 
             (profileImage.includes('\\') || profileImage.includes('C:') || 
              profileImage.includes('/uploads/'))) {
            
            // Extract the filename using regex pattern matching for profileImage files
            const matches = profileImage.match(/profileImage-[^\\/]+\.\w+/);
            if (matches && matches[0]) {
              profileImage = '/uploads/' + matches[0];
              console.log('Fixed complex profile image path in loadUser:', profileImage);
            }
          }
          
          // Make sure profile image starts with / if it's a relative path
          if (profileImage && 
              typeof profileImage === 'string' && 
              !profileImage.startsWith('http') && 
              !profileImage.startsWith('/')) {
            profileImage = '/' + profileImage;
            console.log('Added leading slash to profile image path:', profileImage);
          }
          
          setUserProfileImage(profileImage);
          setUserRole(userData.role || null);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error);
          fetchUserDetails();
        }
      } else {
        fetchUserDetails();
      }
    } else {
      setIsAuthenticated(false);
      setUserName("");
      setUserProfileImage(null);
      setUserRole(null);
    }
  }, [fetchUserDetails]);

  useEffect(() => {
    loadUser(); // Initial load

    // Listen for custom event
    window.addEventListener("authChange", loadUser);

    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setIsUserDropdownOpen(false);
        setIsSignInDropdownOpen(false);
        setIsSignUpDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup listener
    return () => {
      window.removeEventListener("authChange", loadUser);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [loadUser]);

  return (
    <nav className="bg-gradient-to-r from-neutral-900 to-neutral-800 shadow-lg sticky top-0 z-50 py-3">
      <div className="w-full px-2 sm:px-4">
        <div className="flex justify-between items-center h-full max-w-none">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 min-w-0">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 xl:space-x-6 flex-1 justify-center min-w-0 mx-4">
            {navLinks.map((link, index) => {
              // Only show auth-required links if user is authenticated
              if (link.authRequired && !isAuthenticated) return null;
              
              return (
                <NavLink
                  key={index}
                  href={link.href}
                  className="relative text-white hover:text-sky-300 transition-colors duration-300 text-xs sm:text-sm font-medium py-2 px-1 lg:px-2 flex-shrink-0
                  after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-sky-400 after:left-0
                  after:bottom-0 after:transition-all after:duration-300 hover:after:w-full whitespace-nowrap"
                >
                  {link.label}
                </NavLink>
              );
            })}
          </div>

          {/* Auth Buttons */} 
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 xl:space-x-3 flex-shrink-0 min-w-0">
            {isAuthenticated ? (
              <div className="flex items-center space-x-1 lg:space-x-2">
                {/* Notification Bell */}
                <NotificationBell user={{
                  fullName: userName,
                  email: (JSON.parse(localStorage.getItem("user") || '{}')).email || '',
                  role: userRole,
                  profileImage: userProfileImage // This will be handled with getImageUrl in NotificationBell or where it's used
                }} />
                
                {/* Look for a team button - only for Players */}
                {userRole === 'Player' && (
                  <button
                    onClick={() => navigate('/browse-teams')}
                    className="text-white hover:text-sky-300 transition-colors duration-300 font-medium text-xs sm:text-sm px-2 lg:px-3 py-2 rounded-md hover:bg-neutral-700/50 whitespace-nowrap bg-sky-600 hover:bg-sky-700"
                    title="Look for a team to join"
                  >
                    <svg className="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="hidden lg:inline">Look for a Team</span>
                    <span className="lg:hidden">Teams</span>
                  </button>
                )}
                
                <div className="relative dropdown-container" style={{ zIndex: 60 }}>
                  <button
                    onClick={() => {
                      console.log('User dropdown clicked, current state:', isUserDropdownOpen);
                      setIsUserDropdownOpen(!isUserDropdownOpen);
                      setIsSignInDropdownOpen(false);
                      setIsSignUpDropdownOpen(false);
                    }}
                    className="text-white hover:text-sky-300 transition-colors duration-300 font-medium text-xs sm:text-sm px-2 lg:px-3 py-2 rounded-md hover:bg-neutral-700/50 flex items-center space-x-1 lg:space-x-2 whitespace-nowrap min-w-0"
                  >
                    <Avatar 
                      src={userProfileImage ? getImageUrl(userProfileImage, 'user') : null}
                      alt={userName}
                      size="sm"
                      className="flex-shrink-0"
                      onError={(e) => {
                        console.log('Error loading desktop avatar image, using fallback', userProfileImage);
                        console.log('Attempted URL was:', e.target.src);
                        handleImageError(e, 'user', userName);
                      }}
                    />
                    <span className="hidden xl:inline truncate">Welcome, {userName}</span>
                    <span className="xl:hidden truncate max-w-[80px]">{userName}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
      {isUserDropdownOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-[60] border border-neutral-700"
          style={{ 
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 60,
            backgroundColor: '#262626',
            border: '1px solid #404040',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
                      {(userRole === 'Admin' || userRole === 'Manager') && (
                        <>
                          <button
                            onClick={() => {
                              window.location.href = '/dashboard';
                              setIsUserDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                          >
                            Dashboard
                          </button>
                        </>
                      )}
                      {userRole === 'Player' && (
                        <>
                          <button
                            onClick={() => {
                              window.location.href = '/profile';
                              setIsUserDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => {
                              window.location.href = '/my-team';
                              setIsUserDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                          >
                            My Team
                          </button>
                          <button
                            onClick={() => {
                              window.location.href = '/my-bookings';
                              setIsUserDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                          >
                            My Bookings
                          </button>
                          <button
                            onClick={() => {
                              window.location.href = '/my-complaints';
                              setIsUserDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                          >
                            My Complaints
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          window.location.href = '/account-settings';
                          setIsUserDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                      >
                        Account Settings
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsUserDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Sign In Dropdown */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => {
                          setIsSignInDropdownOpen(!isSignInDropdownOpen);
                          setIsSignUpDropdownOpen(false);
                          setIsUserDropdownOpen(false);
                        }}
                    className="text-white hover:text-sky-300 transition-colors duration-300 font-medium text-xs sm:text-sm px-2 lg:px-3 py-2 rounded-md hover:bg-neutral-700/50 whitespace-nowrap"
                  >
                    Sign In
                  </button>
      {isSignInDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-[60] border border-neutral-700 animate-fadeIn">
                      <button
                        onClick={() => {
                          setShowManagerSignIn(true)
                          setIsSignInDropdownOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                      >
                        Sign In as Manager
                      </button>
                      <button
                        onClick={() => {
                          setShowPlayerSignIn(true)
                          setIsSignInDropdownOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                      >
                        Sign In as Player
                      </button>
                    </div>
                  )}
                </div>

                {/* Sign Up Dropdown */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => {
  setIsSignUpDropdownOpen(!isSignUpDropdownOpen);
  setIsSignInDropdownOpen(false);
  setIsUserDropdownOpen(false);
}}
                    className="bg-sky-500 hover:bg-sky-600 text-white transition-colors duration-300 rounded-md px-2 lg:px-3 py-2 text-xs sm:text-sm font-medium shadow-lg hover:shadow-sky-500/20 whitespace-nowrap"
                  >
                    Sign Up
                  </button>
                  {isSignUpDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-[60] border border-neutral-700 animate-fadeIn">
                      <button
                        onClick={() => {
                          setShowManagerSignUp(true)
                          setIsSignUpDropdownOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                      >
                        Sign Up as Manager
                      </button>
                      <button
                        onClick={() => {
                          setShowPlayerSignUp(true)
                          setIsSignUpDropdownOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                      >
                        Sign Up as Player
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex-shrink-0">
            <button
              onClick={() => {
  setIsMobileMenuOpen(!isMobileMenuOpen);
  setIsSignUpDropdownOpen(false);
  setIsSignInDropdownOpen(false);
  setIsUserDropdownOpen(false);
}}
              className="flex items-center p-2 rounded-md hover:bg-neutral-700 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <div className="w-6 flex flex-col items-end space-y-1.5">
                <span
                  className={`block h-0.5 bg-white transition-transform duration-300 ${isMobileMenuOpen ? "w-6 rotate-45 translate-y-2" : "w-6"}`}
                ></span>
                <span
                  className={`block h-0.5 bg-white transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-0" : "w-5"}`}
                ></span>
                <span
                  className={`block h-0.5 bg-white transition-transform duration-300 ${isMobileMenuOpen ? "w-6 -rotate-45 -translate-y-2" : "w-4"}`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */} 
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 animate-slideDown max-w-full">
            <div className="flex flex-col space-y-2 pb-3 border-b border-neutral-700">
              {navLinks.map((link, index) => {
                // Only show auth-required links if user is authenticated
                if (link.authRequired && !isAuthenticated) return null;
                
                return (
                  <NavLink
                    key={index}
                    href={link.href}
                    className="block px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)} // Close dropdown on link click
                  >
                    {link.label}
                  </NavLink>
                );
              })}
            </div>
            <div className="flex flex-col space-y-3 pt-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <Avatar 
                      src={userProfileImage ? getImageUrl(userProfileImage, 'user') : null}
                      alt={userName}
                      size="sm"
                      className="flex-shrink-0"
                      onError={(e) => {
                        console.log('Error loading mobile avatar image, using fallback', userProfileImage);
                        console.log('Attempted URL was:', e.target.src);
                        handleImageError(e, 'user', userName);
                      }}
                    />
                    <span className="text-white font-medium text-sm truncate">Welcome, {userName}</span>
                  </div>
                  {(userRole === 'Admin' || userRole === 'Manager') && (
                    <>
                      <button
                        onClick={() => {
                          window.location.href = '/dashboard';
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                      >
                        Dashboard
                      </button>
                    </>
                  )}
                  {userRole === 'Player' && (
                    <>
                      <button
                        onClick={() => {
                          window.location.href = '/profile';
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          window.location.href = '/my-team';
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                      >
                        My Team
                      </button>
                      <button
                        onClick={() => {
                          window.location.href = '/my-bookings';
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                      >
                        My Bookings
                      </button>
                      <button
                        onClick={() => {
                          window.location.href = '/my-complaints';
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                      >
                        My Complaints
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      window.location.href = '/account-settings';
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                  >
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowManagerSignIn(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                  >
                    Sign In as Manager
                  </button>
                  <button
                    onClick={() => {
                      setShowPlayerSignIn(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                  >
                    Sign In as Player
                  </button>
                  <button
                    onClick={() => {
                      setShowManagerSignUp(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white transition-colors duration-300"
                  >
                    Sign Up as Manager
                  </button>
                  <button
                    onClick={() => {
                      setShowPlayerSignUp(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white transition-colors duration-300 mt-1"
                  >
                    Sign Up as Player
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modals */}
      <AuthModal isOpen={showManagerSignIn} onClose={() => setShowManagerSignIn(false)}>
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <ManagerSignIn
            onClose={() => setShowManagerSignIn(false)}
            onSwitchToPlayer={() => {
              setShowManagerSignIn(false)
              setShowPlayerSignIn(true)
            }}
            onSwitchToManagerSignUp={() => {
              setShowManagerSignIn(false)
              setShowManagerSignUp(true)
            }}
            onSwitchToForgotPassword={() => {
              setShowManagerSignIn(false)
              setShowManagerPasswordReset(true)
            }}
            on2FARequired={handle2FARequired}
          />
        </Suspense>
      </AuthModal>

      <AuthModal isOpen={showPlayerSignIn} onClose={() => setShowPlayerSignIn(false)}>
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <PlayerSignIn
            onClose={() => setShowPlayerSignIn(false)}
            onSwitchToManager={() => {
              setShowPlayerSignIn(false)
              setShowManagerSignIn(true)
            }}
            onSwitchToPlayerSignUp={() => {
              setShowPlayerSignIn(false)
              setShowPlayerSignUp(true)
            }}
            onSwitchToPasswordReset={() => {
              setShowPlayerSignIn(false)
              setShowPlayerPasswordReset(true)
            }}
            on2FARequired={handle2FARequired}
          />
        </Suspense>
      </AuthModal>

      <AuthModal isOpen={showManagerSignUp} onClose={() => setShowManagerSignUp(false)} maxWidth="max-w-lg">
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <ManagerSignUp
            onClose={() => setShowManagerSignUp(false)}
            onSwitchToManagerSignIn={() => {
              setShowManagerSignUp(false)
              setShowManagerSignIn(true)
            }}
          />
        </Suspense>
      </AuthModal>

      <AuthModal isOpen={showPlayerSignUp} onClose={() => setShowPlayerSignUp(false)} maxWidth="max-w-lg">
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <PlayerSignUp
            onClose={() => setShowPlayerSignUp(false)}
            onSwitchToPlayerSignIn={() => {
              setShowPlayerSignUp(false)
              setShowPlayerSignIn(true)
            }}
          />
        </Suspense>
      </AuthModal>

      <AuthModal isOpen={showPlayerPasswordReset} onClose={() => setShowPlayerPasswordReset(false)}>
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <PlayerPasswordReset
            onClose={() => setShowPlayerPasswordReset(false)}
            onSwitchToSignIn={() => {
              setShowPlayerPasswordReset(false)
              setShowPlayerSignIn(true)
            }}
          />
        </Suspense>
      </AuthModal>

      <AuthModal isOpen={showManagerPasswordReset} onClose={() => setShowManagerPasswordReset(false)}>
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <ManagerPasswordReset
            onClose={() => setShowManagerPasswordReset(false)}
            onSwitchToSignIn={() => {
              setShowManagerPasswordReset(false)
              setShowManagerSignIn(true)
            }}
          />
        </Suspense>
      </AuthModal>

      {/* 2FA Modal */}
      <AuthModal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)}>
        <Suspense fallback={<div className="flex justify-center items-center p-8">Loading...</div>}>
          <TwoFactorModal
            isVisible={show2FAModal}
            onClose={() => setShow2FAModal(false)}
            email={twoFAData.email}
            tempToken={twoFAData.tempToken}
            onVerifySuccess={(data) => {
              // Close the 2FA modal first
              setShow2FAModal(false);
              // Then call the original success handler
              if (twoFAData.onSuccess) {
                twoFAData.onSuccess(data);
              }
            }}
          />
        </Suspense>
      </AuthModal>

    </nav>
  )
}

export default Navbar
