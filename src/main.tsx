import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NavBar from "./pages/NavBar";
import Services from "./pages/Services";
import Events from "./pages/Events";
import EventsPage from "./pages/EventsPage/EventsPage";
import Contact from "./pages/Contact";
import Footer from "./pages/Footer";
import "./main.scss";
import Hero from "./pages/Hero";
import Pricing from "./pages/Pricing";
import Guidelines from "./pages/Guidlines";
import Register from "./pages/Register";
import SignIn from "./pages/SignIn";
import WelcomePage from "./pages/welcomepage";
import Success from "./pages/Success";
import ComingSoon from "./pages/ComingSoon";
import ServicesComingSoon from "./pages/ServicesComingSoon";
import NewsFeed from "./pages/NewsFeed/NewsFeed";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminProfile from "./pages/AdminProfile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import Accessibility from "./pages/Accessibility";
import About from "./pages/About";
import ContactPage from "./pages/ContactPage";
import Request from "./components/Request";
import SentRequest from "./components/SentRequest";
import UserProfile from "./pages/UserProfile";
import { ThemeProvider } from "./contexts/ThemeContext";
import NavbarThemeToggle from "./components/NavbarThemeToggle";
// import { preventInspect } from "./utils/preventInspect";
import Maintenance from "./pages/Maintenance";
// import RoutingDisabled from "./pages/RoutingDisabled";
import ComingSoonSection from "./pages/NewsFeed/ComingSoonSection";
import PWAProvider from "./components/PWAProvider";
import Business from "./pages/NewsFeed/Business";
import ProtectedRoute from "./components/ProtectedRoute";

// Prevent browser inspection/devtools
// preventInspect();
// preventInspect(); // Commented out to allow browser dev tools

// Landing page component (without WelcomePage or Register)
export function LandingPage() {
  return (
    <>
      <NavBar />
      <Hero />
      <Services />
      <Events />
      <Pricing />
      <Guidelines />
      <Contact />
      <Footer />
    </>
  );
}

// Theme toggle only on landing (/) and user profile (/profile/:username).
// On landing + small screens: toggle is inside hamburger; don't show fixed icon.
// On landing + big screens, and on profile: show fixed icon in current position.
function ThemeToggleGate() {
  const location = useLocation();
  const [isSmallScreen, setIsSmallScreen] = React.useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  );
  React.useEffect(() => {
    const m = window.matchMedia("(max-width: 768px)");
    const listener = () => setIsSmallScreen(m.matches);
    m.addEventListener("change", listener);
    return () => m.removeEventListener("change", listener);
  }, []);
  const isLanding = location.pathname === "/";
  const isUserProfile = /^\/profile\/[^/]+$/.test(location.pathname);
  if (!isLanding && !isUserProfile) return null;
  if (isLanding && isSmallScreen) return null; // landing mobile: toggle in hamburger
  return <NavbarThemeToggle />;
}

// Check if maintenance mode is enabled
const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === "true";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <PWAProvider>
          <BrowserRouter>
            {isMaintenanceMode ? (
              // Show maintenance page for all routes when maintenance mode is enabled
              <Routes>
                <Route path="*" element={<Maintenance />} />
              </Routes>
            ) : (
              // Normal app routes when maintenance mode is disabled
              <>
                <ThemeToggleGate />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/registernow" element={<Register />} />
                  <Route path="/business-form" element={<Register />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/coming-soon" element={<ComingSoon />} />
                  <Route
                    path="/services-coming-soon"
                    element={<ServicesComingSoon />}
                  />
                  <Route path="/success" element={<Success />} />
                  <Route
                    path="/newsfeed"
                    element={
                      <ProtectedRoute requireAdmin={false} redirectTo="/signin">
                        <NewsFeed />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/profile" element={<AdminProfile />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/cookie-policy" element={<CookiePolicy />} />
                  <Route path="/accessibility" element={<Accessibility />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/people" element={<ComingSoonSection />} />
                  <Route path="/forums" element={<ComingSoonSection />} />
                  <Route path="/news" element={<ComingSoonSection />} />
                  <Route path="/reels" element={<ComingSoonSection />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events-old" element={<Events />} />
                  <Route path="/request" element={<Request />} />
                  <Route path="/sent-requests" element={<SentRequest />} />
                  <Route path="/profile/:username" element={<UserProfile />} />
                  <Route path="/marketplace" element={<ComingSoonSection />} />
                  <Route path="/movies" element={<ComingSoonSection />} />
                  <Route path="/offers" element={<ComingSoonSection />} />
                  <Route path="/jobs" element={<ComingSoonSection />} />
                  <Route path="/scheduled" element={<ComingSoonSection />} />
                  <Route path="/saved" element={<ComingSoonSection />} />
                  <Route path="/business" element={<Business />} />
                </Routes>
              </>
            )}
          </BrowserRouter>
        </PWAProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}
