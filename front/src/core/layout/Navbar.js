"use client"

import { useState, useEffect , useCallback, lazy, Suspense} from "react"
import { NavLink } from "../../shared/ui/components/NavLink"
import { AuthModal } from "../../shared/ui/components/AuthModal"
import { Logo } from "../../shared/ui/components/Logo"
import { Avatar } from "../../shared/ui/components/Avatar"

// Lazy load auth components to prevent reCAPTCHA from loading globally
const ManagerSignIn = lazy(() => import("../../features/auth/components/ManagerSignIn").then(module => ({ default: module.ManagerSignIn })))
const PlayerSignIn = lazy(() => import("../../features/auth/components/PlayerSignIn").then(module => ({ default: module.PlayerSignIn })))
const ManagerSignUp = lazy(() => import("../../features/auth/components/ManagerSignUp").then(module => ({ default: module.ManagerSignUp })))
const PlayerSignUp = lazy(() => import("../../features/auth/components/PlayerSignUp").then(module => ({ default: module.PlayerSignUp })))
const PlayerPasswordReset = lazy(() => import("../../features/auth/components/PlayerPasswordReset").then(module => ({ default: module.PlayerPasswordReset })))
const ManagerPasswordReset = lazy(() => import("../../features/auth/components/ManagerPasswordReset").then(module => ({ default: module.ManagerPasswordReset })))
const TwoFactorModal = lazy(() => import("../../features/auth/components/TwoFactorModal"))

export const Navbar = () => {
  const navLinks = [
    { label: "Courts", href: "/courts" },
    { label: "Padel", href: "#padel" },
    { label: "Football", href: "#football" },
    { label: "Basketball", href: "#basketball" },
    { label: "Tennis", href: "#tennis" },
  ]
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
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
        const response = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            "x-auth-token": token, // Ensure this matches your backend middleware
          },
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.success) {
            setUserName(userData.fullName || "User");
            setUserProfileImage(userData.profileImage || null);
            setUserRole(userData.role || null);
            setIsAuthenticated(true);
            // Store/update user details in localStorage
            localStorage.setItem("user", JSON.stringify({
              fullName: userData.fullName,
              email: userData.email,
              role: userData.role,
              profileImage: userData.profileImage
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
          setUserProfileImage(userData.profileImage || null);
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

    // Cleanup listener
    return () => {
      window.removeEventListener("authChange", loadUser);
    };
  }, [loadUser]);

  return (
    <nav className="bg-gradient-to-r from-neutral-900 to-neutral-800 shadow-lg sticky top-0 z-50 py-3">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link, index) => (
              <NavLink
                key={index}
                href={link.href}
                className="relative text-white hover:text-sky-300 transition-colors duration-300 text-sm font-medium py-2
                after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-sky-400 after:left-0
                after:bottom-0 after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Auth Buttons */} 
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="text-white hover:text-sky-300 transition-colors duration-300 font-medium text-sm px-4 py-2 rounded-md hover:bg-neutral-700/50 flex items-center space-x-2"
                  >
                    <Avatar 
                      src={userProfileImage ? `http://localhost:5000${userProfileImage}` : null}
                      alt={userName}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <span>Welcome, {userName}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-10 border border-neutral-700 animate-fadeIn">
                      {(userRole === 'Admin' || userRole === 'Manager') && (
                        <button
                          onClick={() => {
                            window.location.href = '/dashboard';
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                        >
                          Dashboard
                        </button>
                      )}
                      {userRole === 'Player' && (
                        <button
                          onClick={() => {
                            window.location.href = '/profile';
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                        >
                          Profile
                        </button>
                      )}
                      <button
                        onClick={() => {
                          window.location.href = '/account-settings';
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                      >
                        Account Settings
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsDropdownOpen(false);
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
                <div className="relative">
                  <button
                    onClick={() => {
                          setIsDropdownOpen(!isDropdownOpen);
                          setIsSignUpDropdownOpen(false);
                        }}
                    className="text-white hover:text-sky-300 transition-colors duration-300 font-medium text-sm px-4 py-2 rounded-md hover:bg-neutral-700/50"
                  >
                    Sign In
                  </button>
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-10 border border-neutral-700 animate-fadeIn">
                      <button
                        onClick={() => {
                          setShowManagerSignIn(true)
                          setIsDropdownOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                      >
                        Sign In as Manager
                      </button>
                      <button
                        onClick={() => {
                          setShowPlayerSignIn(true)
                          setIsDropdownOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors duration-200"
                      >
                        Sign In as Player
                      </button>
                    </div>
                  )}
                </div>

                {/* Sign Up Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
  setIsSignUpDropdownOpen(!isSignUpDropdownOpen);
  setIsDropdownOpen(false);
}}
                    className="bg-sky-500 hover:bg-sky-600 text-white transition-colors duration-300 rounded-md px-4 py-2 text-sm font-medium shadow-lg hover:shadow-sky-500/20"
                  >
                    Sign Up
                  </button>
                  {isSignUpDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg py-1 z-10 border border-neutral-700 animate-fadeIn">
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
          <div className="md:hidden">
            <button
              onClick={() => {
  setIsDropdownOpen(!isDropdownOpen);
  setIsSignUpDropdownOpen(false);
}}
              className="flex items-center p-2 rounded-md hover:bg-neutral-700 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <div className="w-6 flex flex-col items-end space-y-1.5">
                <span
                  className={`block h-0.5 bg-white transition-transform duration-300 ${isDropdownOpen ? "w-6 rotate-45 translate-y-2" : "w-6"}`}
                ></span>
                <span
                  className={`block h-0.5 bg-white transition-opacity duration-300 ${isDropdownOpen ? "opacity-0" : "w-5"}`}
                ></span>
                <span
                  className={`block h-0.5 bg-white transition-transform duration-300 ${isDropdownOpen ? "w-6 -rotate-45 -translate-y-2" : "w-4"}`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */} 
        {isDropdownOpen && (
          <div className="md:hidden mt-4 animate-slideDown">
            <div className="flex flex-col space-y-2 pb-3 border-b border-neutral-700">
              {navLinks.map((link, index) => (
                <NavLink
                  key={index}
                  href={link.href}
                  className="block px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                  onClick={() => setIsDropdownOpen(false)} // Close dropdown on link click
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="flex flex-col space-y-3 pt-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <Avatar 
                      src={userProfileImage ? `http://localhost:5000${userProfileImage}` : null}
                      alt={userName}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <span className="text-white font-medium text-sm">Welcome, {userName}</span>
                  </div>
                  {(userRole === 'Admin' || userRole === 'Manager') && (
                    <button
                      onClick={() => {
                        window.location.href = '/dashboard';
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                    >
                      Dashboard
                    </button>
                  )}
                  {userRole === 'Player' && (
                    <button
                      onClick={() => {
                        window.location.href = '/profile';
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                    >
                      Profile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      window.location.href = '/account-settings';
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                  >
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsDropdownOpen(false);
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
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                  >
                    Sign In as Manager
                  </button>
                  <button
                    onClick={() => {
                      setShowPlayerSignIn(true);
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md hover:bg-neutral-700 text-white transition-colors duration-200"
                  >
                    Sign In as Player
                  </button>
                  <button
                    onClick={() => {
                      setShowManagerSignUp(true);
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white transition-colors duration-300"
                  >
                    Sign Up as Manager
                  </button>
                  <button
                    onClick={() => {
                      setShowPlayerSignUp(true);
                      setIsDropdownOpen(false);
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
