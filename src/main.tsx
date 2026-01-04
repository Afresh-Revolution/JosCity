import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import People from "./components/People";
import Forums from "./pages/NewsFeed/Forums";
import News from "./pages/NewsFeed/News";
import Reels from "./pages/NewsFeed/Reels";
import Request from "./components/Request";
import SentRequest from "./components/SentRequest";
import UserProfile from "./pages/UserProfile";
import { ThemeProvider } from "./contexts/ThemeContext";
import DarkModeToggle from "./components/DarkModeToggle"; 
// import { preventInspect } from "./utils/preventInspect";
import Maintenance from "./pages/Maintenance";
// import RoutingDisabled from "./pages/RoutingDisabled";
import MarketPlace from "./pages/NewsFeed/MarketPlace";
import Movies from "./pages/NewsFeed/Movies";
import Offers from "./pages/NewsFeed/Offers";
import Jobs from "./pages/NewsFeed/Jobs";
import Scheduled from "./pages/NewsFeed/Scheduled";
import Saved from "./pages/NewsFeed/Saved";
import Business from "./pages/NewsFeed/Business";

// Prevent browser inspection/devtools
// preventInspect();

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

// Check if maintenance mode is enabled
const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === "true";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <BrowserRouter>
          {isMaintenanceMode ? (
            // Show maintenance page for all routes when maintenance mode is enabled
            <Routes>
              <Route path="*" element={<Maintenance />} />
            </Routes>
          ) : (
            // Normal app routes when maintenance mode is disabled
            <>
              <DarkModeToggle />
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
                <Route path="/newsfeed" element={<NewsFeed />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/accessibility" element={<Accessibility />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/people" element={<People />} />
                <Route path="/forums" element={<Forums />} />
                <Route path="/news" element={<News />} />
                <Route path="/reels" element={<Reels />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events-old" element={<Events />} />
                <Route path="/request" element={<Request />} />
                <Route path="/sent-requests" element={<SentRequest />} />
                <Route path="/profile/:username" element={<UserProfile />} />
                <Route path="/marketplace" element={<MarketPlace />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/scheduled" element={<Scheduled />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/business" element={<Business />} />
              </Routes>
            </>
          )}
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}
