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
import Scheduled from "./pages/NewsFeed/Scheduled";
import Saved from "./pages/NewsFeed/Saved";
import People from "./components/People";
import PWAProvider from "./components/PWAProvider";
import Business from "./pages/NewsFeed/Business";
import ProtectedRoute from "./components/ProtectedRoute";
import News from "./pages/NewsFeed/News";
import Reels from "./pages/NewsFeed/Reels";

/** Logged-in user areas (sidebar / feed); redirects to sign-in if no session. */
function UserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={false} redirectTo="/signin">
      {children}
    </ProtectedRoute>
  );
}

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
                      <UserRoute>
                        <NewsFeed />
                      </UserRoute>
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
                  <Route
                    path="/people"
                    element={
                      <UserRoute>
                        <People />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/forums"
                    element={
                      <UserRoute>
                        <ComingSoonSection />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/news"
                    element={
                      <UserRoute>
                        <News />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/reels"
                    element={
                      <UserRoute>
                        <Reels />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/events"
                    element={
                      <UserRoute>
                        <EventsPage />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/events-old"
                    element={
                      <UserRoute>
                        <Events />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/request"
                    element={
                      <UserRoute>
                        <Request />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/sent-requests"
                    element={
                      <UserRoute>
                        <SentRequest />
                      </UserRoute>
                    }
                  />
                  <Route path="/profile/:username" element={<UserProfile />} />
                  <Route
                    path="/marketplace"
                    element={
                      <UserRoute>
                        <ComingSoonSection />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/movies"
                    element={
                      <UserRoute>
                        <ComingSoonSection />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/offers"
                    element={
                      <UserRoute>
                        <ComingSoonSection />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/jobs"
                    element={
                      <UserRoute>
                        <ComingSoonSection />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/scheduled"
                    element={
                      <UserRoute>
                        <Scheduled />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/saved"
                    element={
                      <UserRoute>
                        <Saved />
                      </UserRoute>
                    }
                  />
                  <Route
                    path="/business"
                    element={
                      <UserRoute>
                        <Business />
                      </UserRoute>
                    }
                  />
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
