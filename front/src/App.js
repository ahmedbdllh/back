import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HeroSection } from "./features/home/components/HeroSection";
import { FeaturesSection } from "./features/home/components/FeaturesSection";
import { CategoriesSection } from "./features/home/components/CategoriesSection";
import AccountSettingsPage from "./features/profile/components/AccountSettingsPage";
import DashboardPage from "./features/dashboard/components/DashboardPage";
import PasswordResetPage from "./features/auth/components/PasswordResetPage";
import { ProfilePage } from "./features/profile/components/ProfilePage";
import UserManagement from "./features/admin/components/management/UserManagement";
import ManagerManagement from "./features/admin/components/management/ManagerManagement";
import PlayerManagement from "./features/admin/components/management/PlayerManagement";
import CompanyManagement from "./features/admin/components/company/CompanyManagement";
import AdminSignInPage from "./features/admin/components/AdminSignInPage";
import { CourtsPage, CourtDetailsPage } from "./features/home/components/court";
import { Navbar } from "./core/layout/Navbar";
import { Footer } from "./core/layout/Footer";
import './App.css';
import CourtManagementPage from "./features/dashboard/components/CourtManagementPage";

// A simple HomePage component for the main route
const HomePage = () => (
  <>
    <HeroSection />
    <CategoriesSection />
    <FeaturesSection />
  </>
);

function App() {
  return (
      <Router>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          {/* Render Navbar and Footer conditionally or let pages handle them */}
          <Routes>
          <Route path="/" element={<>
            <Navbar />
            <main className="flex-grow">
              <HomePage />
            </main>
            <Footer />
          </>} />
          <Route path="/account-settings" element={<AccountSettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/reset-password/:token" element={<PasswordResetPage />} />
          <Route path="/dashboard" element={<DashboardPage />}>
            <Route path="user-management" element={<UserManagement />} />
            <Route path="manager-management" element={<ManagerManagement />} />
            <Route path="player-management" element={<PlayerManagement />} />
            <Route path="company-management" element={<CompanyManagement />} />
            <Route path="court-management" element={<CourtManagementPage />} />
          </Route>
          <Route path="/courts" element={<>
            <Navbar />
            <main className="flex-grow">
              <CourtsPage />
            </main>
            <Footer />
          </>} />
          <Route path="/courts/:id" element={<>
            <Navbar />
            <main className="flex-grow">
              <CourtDetailsPage />
            </main>
            <Footer />
          </>} />
          <Route path="/sportify-admin" element={<AdminSignInPage />} />
          {/* Add other routes here */}          
        </Routes>
      </div>
    </Router>
  );
}

export default App;
