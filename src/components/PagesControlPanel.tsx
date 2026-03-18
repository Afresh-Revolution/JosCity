import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Calendar,
  Settings,
  DollarSign,
  BookOpen,
  Image,
  Link as LinkIcon,
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  Navigation,
} from "lucide-react";
// Type definitions (no API imports)
interface NavbarMenuItem {
  id?: string;
  label: string;
  link_type: "scroll" | "route" | "external";
  link_target?: string;
  scroll_target_id?: string;
  display_order: number;
  is_active: boolean;
  requires_auth: boolean;
  icon_name?: string;
}

interface NavbarSettings {
  id?: string;
  logo_url?: string;
  logo_alt?: string;
  get_started_button_text?: string;
  get_started_button_route?: string;
  is_active: boolean;
}

interface ContactPageSettings {
  id?: string;
  badge_text?: string;
  heading: string;
  subheading?: string;
}

interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status?: "pending" | "read" | "replied" | "archived";
  reply_message?: string;
}

interface ContactInformation {
  id?: string;
  contact_type: "phone" | "email" | "location";
  title: string;
  primary_value: string;
  secondary_value?: string;
  icon_color?: string;
  icon_background?: string;
  is_active: boolean;
  display_order: number;
}

interface EventsPageSettings {
  id?: string;
  badge_text?: string;
  heading?: string;
  subheading?: string;
  default_image_url?: string;
}

interface Event {
  id?: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  venue?: string;
  image_url?: string;
  event_type?: string;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
  max_attendees?: number;
  current_attendees?: number;
  ticket_price?: number;
  ticket_currency?: string;
  registration_required?: boolean;
  registration_deadline?: string;
  tags?: string[];
}

interface EventRegistration {
  id?: string;
  event_id: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  status?: "pending" | "confirmed" | "cancelled" | "attended";
  payment_status?: "pending" | "paid" | "refunded";
  payment_amount?: number;
  payment_reference?: string;
}

interface ServicesPageSettings {
  id?: string;
  badge_text?: string;
  heading: string;
  subheading?: string;
  view_all_button_text?: string;
}

interface Service {
  id?: string;
  service_key: string;
  title: string;
  description: string;
  icon_color: string;
  icon_svg?: string;
  category?: string;
  is_active: boolean;
  display_order: number;
  service_url?: string;
  requires_authentication?: boolean;
}

interface ServiceRequest {
  id?: string;
  service_id: string;
  user_id?: string;
  request_type?: string;
  description: string;
  status?: "pending" | "in_progress" | "completed" | "rejected" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  assigned_to?: string;
  response?: string;
}

interface PricingPageSettings {
  id?: string;
  badge_text?: string;
  heading: string;
  subheading?: string;
  subscribe_button_text?: string;
}

interface PricingPlan {
  id?: string;
  plan_key: string;
  name: string;
  price: number;
  currency?: string;
  billing_period?: "monthly" | "yearly" | "one-time";
  is_popular?: boolean;
  is_active: boolean;
  display_order: number;
  description?: string;
}

interface PricingPlanFeature {
  id?: string;
  plan_id: string;
  feature_name: string;
  is_included: boolean;
  display_order: number;
}

interface GuidelinesPageSettings {
  id?: string;
  badge_text?: string;
  heading?: string;
}

interface Guideline {
  id?: string;
  quote: string;
  author_name: string;
  author_role?: string;
  rating?: number;
  author_image_url?: string;
  display_order: number;
  is_active: boolean;
}

interface HeroPageSettings {
  id?: string;
  slide_duration_seconds?: number;
  auto_advance?: boolean;
  show_navigation_dots?: boolean;
  show_prev_next_arrows?: boolean;
  default_badge_text?: string;
  primary_button_text?: string;
  primary_button_route?: string;
  secondary_button_text?: string;
  secondary_button_route?: string;
}

interface HeroSlide {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  image_alt?: string;
  slide_order: number;
  is_active: boolean;
  link_url?: string;
  link_text?: string;
  button_text?: string;
}

interface FooterLink {
  id?: string;
  link_text: string;
  link_url: string;
  section: "quick_links" | "services" | "legal" | "social";
  display_order: number;
  is_active: boolean;
  opens_in_new_tab?: boolean;
}

interface FooterSettings {
  id?: string;
  logo_url?: string;
  tagline?: string;
  copyright_text?: string;
  social_media?: Record<string, string>;
}

interface ControlPanelProps {
  onClose: () => void;
}

const PagesControlPanel: React.FC<ControlPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("navbar");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Navbar state
  const [navbarMenuItems, setNavbarMenuItems] = useState<NavbarMenuItem[]>([]);
  const [navbarSettings, setNavbarSettings] = useState<NavbarSettings | null>(
    null
  );
  const [editingNavbarItem, setEditingNavbarItem] =
    useState<NavbarMenuItem | null>(null);

  // Contact state
  const [contactSettings, setContactSettings] =
    useState<ContactPageSettings | null>(null);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [contactInformation, setContactInformation] = useState<
    ContactInformation[]
  >([]);
  const [editingContactInfo, setEditingContactInfo] =
    useState<ContactInformation | null>(null);

  // Events state
  const [eventsSettings, setEventsSettings] =
    useState<EventsPageSettings | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<
    EventRegistration[]
  >([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Services state
  const [servicesSettings, setServicesSettings] =
    useState<ServicesPageSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Pricing state
  const [pricingSettings, setPricingSettings] =
    useState<PricingPageSettings | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [planFeatures, setPlanFeatures] = useState<
    Record<string, PricingPlanFeature[]>
  >({});
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);

  // Guidelines state
  const [guidelinesSettings, setGuidelinesSettings] =
    useState<GuidelinesPageSettings | null>(null);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [editingGuideline, setEditingGuideline] = useState<Guideline | null>(
    null
  );

  // Hero state
  const [heroSettings, setHeroSettings] = useState<HeroPageSettings | null>(
    null
  );
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  // Footer state
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(
    null
  );
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [editingFooterLink, setEditingFooterLink] = useState<FooterLink | null>(
    null
  );

  // Settings editing state
  const [editingNavbarSettings, setEditingNavbarSettings] =
    useState<NavbarSettings | null>(null);
  const [editingHeroSettings, setEditingHeroSettings] =
    useState<HeroPageSettings | null>(null);
  const [editingContactSettings, setEditingContactSettings] =
    useState<ContactPageSettings | null>(null);
  const [editingEventsSettings, setEditingEventsSettings] =
    useState<EventsPageSettings | null>(null);
  const [editingServicesSettings, setEditingServicesSettings] =
    useState<ServicesPageSettings | null>(null);
  const [editingPricingSettings, setEditingPricingSettings] =
    useState<PricingPageSettings | null>(null);
  const [editingGuidelinesSettings, setEditingGuidelinesSettings] =
    useState<GuidelinesPageSettings | null>(null);
  const [editingFooterSettings, setEditingFooterSettings] =
    useState<FooterSettings | null>(null);

  // Helper function to extract error message from any error type
  const getErrorMessage = (err: unknown, defaultMessage: string): string => {
    if (err instanceof Error) {
      return err.message || defaultMessage;
    }
    if (typeof err === "string") {
      return err;
    }
    if (typeof err === "boolean") {
      return defaultMessage;
    }
    if (err && typeof err === "object") {
      const errorObj = err as { message?: unknown; error?: unknown };
      if (errorObj.message && typeof errorObj.message === "string") {
        return errorObj.message;
      }
      if (errorObj.error && typeof errorObj.error === "string") {
        return errorObj.error;
      }
    }
    return defaultMessage;
  };

  const tabs = [
    { id: "navbar", label: "Navbar", icon: Navigation },
    { id: "contact", label: "Contact", icon: Mail },
    { id: "events", label: "Events", icon: Calendar },
    { id: "services", label: "Services", icon: Settings },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "guidelines", label: "Guidelines", icon: BookOpen },
    { id: "hero", label: "Hero", icon: Image },
    { id: "footer", label: "Footer", icon: LinkIcon },
  ];

  // Load data when tab changes
  useEffect(() => {
    loadTabData(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadTabData = async (tab: string) => {
    setLoading(true);
    setError(null);
    try {
      switch (tab) {
        case "navbar":
          await loadNavbarData();
          break;
        case "contact":
          await loadContactData();
          break;
        case "events":
          await loadEventsData();
          break;
        case "services":
          await loadServicesData();
          break;
        case "pricing":
          await loadPricingData();
          break;
        case "guidelines":
          await loadGuidelinesData();
          break;
        case "hero":
          await loadHeroData();
          break;
        case "footer":
          await loadFooterData();
          break;
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, "Failed to load data");
      setError(errorMessage);
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNavbarData = async () => {
    // No API calls - use empty data
    setNavbarMenuItems([]);
    setNavbarSettings(null);
  };

  const loadContactData = async () => {
    // No API calls - use empty data
    setContactSettings(null);
    setContactMessages([]);
    setContactInformation([]);
  };

  const loadEventsData = async () => {
    // No API calls - use empty data
    setEventsSettings(null);
    setEvents([]);
    setEventRegistrations([]);
  };

  const loadServicesData = async () => {
    // No API calls - use empty data
    setServicesSettings(null);
    setServices([]);
    setServiceRequests([]);
  };

  const loadPricingData = async () => {
    // No API calls - use empty data
    setPricingSettings(null);
    setPricingPlans([]);
    setPlanFeatures({});
  };

  const loadGuidelinesData = async () => {
    // No API calls - use empty data
    setGuidelinesSettings(null);
    setGuidelines([]);
  };

  const loadHeroData = async () => {
    // No API calls - use empty data
    setHeroSettings(null);
    setHeroSlides([]);
  };

  const loadFooterData = async () => {
    // No API calls - use empty data
    setFooterSettings(null);
    setFooterLinks([]);
  };

  // Render functions for each tab
  const renderNavbarTab = () => (
    <div className="control-panel__content">
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Navbar Menu Items</h3>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() =>
              setEditingNavbarItem({
                label: "",
                link_type: "scroll",
                display_order: 0,
                is_active: true,
                requires_auth: false,
              })
            }
          >
            <Plus size={16} />
            Add Menu Item
          </button>
        </div>
        <div className="control-panel__table-wrapper">
          <table className="control-panel__table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Type</th>
                <th>Target</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {navbarMenuItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="control-panel__empty">
                    No menu items yet
                  </td>
                </tr>
              ) : (
                navbarMenuItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.label}</td>
                    <td>{item.link_type}</td>
                    <td>{item.link_target || item.scroll_target_id || "-"}</td>
                    <td>{item.display_order}</td>
                    <td>
                      <span
                        className={`control-panel__badge ${
                          item.is_active
                            ? "control-panel__badge--active"
                            : "control-panel__badge--inactive"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="control-panel__card-actions">
                        <button
                          className="control-panel__icon-button"
                          onClick={() => setEditingNavbarItem(item)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="control-panel__icon-button"
                          onClick={() => handleDeleteNavbarItem(item.id!)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Navbar Settings</h3>
          {navbarSettings && (
            <button
              className="control-panel__icon-button"
              onClick={() => handleDeleteNavbarSettings()}
              title="Delete Settings"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {navbarSettings ? (
          <div style={{ marginTop: "16px" }}>
            <p>
              <strong>Logo URL:</strong> {navbarSettings.logo_url || "Not set"}
            </p>
            <p>
              <strong>Get Started Button:</strong>{" "}
              {navbarSettings.get_started_button_text || "Not set"}
            </p>
            <p>
              <strong>Get Started Route:</strong>{" "}
              {navbarSettings.get_started_button_route || "Not set"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`control-panel__badge ${
                  navbarSettings.is_active
                    ? "control-panel__badge--active"
                    : "control-panel__badge--inactive"
                }`}
              >
                {navbarSettings.is_active ? "Active" : "Inactive"}
              </span>
            </p>
            <button
              className="control-panel__button control-panel__button--secondary"
              style={{ marginTop: "12px" }}
              onClick={() => setEditingNavbarSettings(navbarSettings)}
            >
              <Edit size={16} />
              Edit Settings
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: "#666", marginBottom: "12px" }}>
              No settings configured
            </p>
            <button
              className="control-panel__button control-panel__button--primary"
              onClick={() =>
                setEditingNavbarSettings({
                  is_active: true,
                })
              }
            >
              <Plus size={16} />
              Create Settings
            </button>
          </div>
        )}
      </div>
      {editingNavbarSettings && (
        <NavbarSettingsModal
          settings={editingNavbarSettings}
          onClose={() => setEditingNavbarSettings(null)}
          onSave={handleSaveNavbarSettings}
        />
      )}
      {editingNavbarItem && (
        <NavbarItemModal
          item={editingNavbarItem}
          onClose={() => setEditingNavbarItem(null)}
          onSave={handleSaveNavbarItem}
        />
      )}
    </div>
  );

  const renderContactTab = () => (
    <div className="control-panel__content">
      {editingContactInfo && (
        <ContactInfoModal
          info={editingContactInfo}
          onClose={() => setEditingContactInfo(null)}
          onSave={handleSaveContactInfo}
        />
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Contact Page Settings</h3>
          {contactSettings && (
            <button
              className="control-panel__icon-button"
              onClick={() => handleDeleteContactSettings()}
              title="Delete Settings"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {contactSettings ? (
          <div style={{ marginTop: "16px" }}>
            <p>
              <strong>Badge Text:</strong>{" "}
              {contactSettings.badge_text || "Not set"}
            </p>
            <p>
              <strong>Heading:</strong> {contactSettings.heading || "Not set"}
            </p>
            <p>
              <strong>Subheading:</strong>{" "}
              {contactSettings.subheading || "Not set"}
            </p>
            <button
              className="control-panel__button control-panel__button--secondary"
              style={{ marginTop: "12px" }}
              onClick={() => setEditingContactSettings(contactSettings)}
            >
              <Edit size={16} />
              Edit Settings
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: "#666", marginBottom: "12px" }}>
              No settings configured
            </p>
            <button
              className="control-panel__button control-panel__button--primary"
              onClick={() =>
                setEditingContactSettings({
                  heading: "",
                })
              }
            >
              <Plus size={16} />
              Create Settings
            </button>
          </div>
        )}
      </div>
      {editingContactSettings && (
        <ContactSettingsModal
          settings={editingContactSettings}
          onClose={() => setEditingContactSettings(null)}
          onSave={handleSaveContactSettings}
        />
      )}
      <div className="control-panel__section">
        <h3 className="control-panel__section-title">Contact Messages</h3>
        <div className="control-panel__table-wrapper">
          <table className="control-panel__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contactMessages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="control-panel__empty">
                    No messages yet
                  </td>
                </tr>
              ) : (
                contactMessages.map((msg) => (
                  <tr key={msg.id}>
                    <td>{msg.name}</td>
                    <td>{msg.email}</td>
                    <td>{msg.subject || "-"}</td>
                    <td>
                      <span
                        className={`control-panel__badge control-panel__badge--${
                          msg.status || "pending"
                        }`}
                      >
                        {msg.status || "pending"}
                      </span>
                    </td>
                    <td>{msg.id ? "Recent" : "-"}</td>
                    <td>
                      <div className="control-panel__card-actions">
                        <button className="control-panel__icon-button">
                          <Eye size={16} />
                        </button>
                        <button
                          className="control-panel__icon-button"
                          onClick={() => handleDeleteContactMessage(msg.id!)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Contact Information</h3>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() =>
              setEditingContactInfo({
                contact_type: "phone",
                title: "",
                primary_value: "",
                is_active: true,
                display_order: 0,
              })
            }
          >
            <Plus size={16} />
            Add Contact Info
          </button>
        </div>
        <div className="control-panel__grid">
          {contactInformation.length === 0 ? (
            <div className="control-panel__empty">
              No contact information yet
            </div>
          ) : (
            contactInformation.map((info) => (
              <div key={info.id} className="control-panel__card">
                <div className="control-panel__card-header">
                  <h4>{info.title}</h4>
                  <div className="control-panel__card-actions">
                    <button
                      className="control-panel__icon-button"
                      onClick={() => setEditingContactInfo(info)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="control-panel__icon-button"
                      onClick={() => handleDeleteContactInfo(info.id!)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="control-panel__card-description">
                  {info.primary_value}
                </p>
                <span
                  className={`control-panel__badge ${
                    info.is_active
                      ? "control-panel__badge--active"
                      : "control-panel__badge--inactive"
                  }`}
                >
                  {info.contact_type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderEventsTab = () => (
    <div className="control-panel__content">
      {editingEvent && (
        <EventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={handleSaveEvent}
        />
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Events Page Settings</h3>
          {eventsSettings && (
            <button
              className="control-panel__icon-button"
              onClick={() => handleDeleteEventsSettings()}
              title="Delete Settings"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {eventsSettings ? (
          <div style={{ marginTop: "16px" }}>
            <p>
              <strong>Badge Text:</strong>{" "}
              {eventsSettings.badge_text || "Not set"}
            </p>
            <p>
              <strong>Heading:</strong> {eventsSettings.heading || "Not set"}
            </p>
            <p>
              <strong>Subheading:</strong>{" "}
              {eventsSettings.subheading || "Not set"}
            </p>
            <p>
              <strong>Default Image URL:</strong>{" "}
              {eventsSettings.default_image_url || "Not set"}
            </p>
            <button
              className="control-panel__button control-panel__button--secondary"
              style={{ marginTop: "12px" }}
              onClick={() => setEditingEventsSettings(eventsSettings)}
            >
              <Edit size={16} />
              Edit Settings
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: "#666", marginBottom: "12px" }}>
              No settings configured
            </p>
            <button
              className="control-panel__button control-panel__button--primary"
              onClick={() =>
                setEditingEventsSettings({
                  badge_text: "",
                  heading: "",
                })
              }
            >
              <Plus size={16} />
              Create Settings
            </button>
          </div>
        )}
      </div>
      {editingEventsSettings && (
        <EventsSettingsModal
          settings={editingEventsSettings}
          onClose={() => setEditingEventsSettings(null)}
          onSave={handleSaveEventsSettings}
        />
      )}
      {eventRegistrations.length > 0 && (
        <div className="control-panel__section">
          <h3 className="control-panel__section-title">
            Event Registrations ({eventRegistrations.length})
          </h3>
          <div className="control-panel__table-wrapper">
            <table className="control-panel__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Event ID</th>
                  <th>Status</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {eventRegistrations.map((reg) => (
                  <tr key={reg.id}>
                    <td>{reg.name}</td>
                    <td>{reg.email}</td>
                    <td>{reg.event_id}</td>
                    <td>
                      <span
                        className={`control-panel__badge control-panel__badge--${
                          reg.status || "pending"
                        }`}
                      >
                        {reg.status || "pending"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`control-panel__badge control-panel__badge--${
                          reg.payment_status || "pending"
                        }`}
                      >
                        {reg.payment_status || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Events</h3>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() =>
              setEditingEvent({
                title: "",
                event_date: new Date().toISOString().split("T")[0],
                status: "upcoming",
              })
            }
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>
        <div className="control-panel__table-wrapper">
          <table className="control-panel__table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                <th>Status</th>
                <th>Attendees</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="control-panel__empty">
                    No events yet
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.title}</td>
                    <td>{event.event_date}</td>
                    <td>{event.location || "-"}</td>
                    <td>
                      <span
                        className={`control-panel__badge control-panel__badge--${
                          event.status || "upcoming"
                        }`}
                      >
                        {event.status || "upcoming"}
                      </span>
                    </td>
                    <td>
                      {event.current_attendees || 0} /{" "}
                      {event.max_attendees || "∞"}
                    </td>
                    <td>
                      <div className="control-panel__card-actions">
                        <button
                          className="control-panel__icon-button"
                          onClick={() => setEditingEvent(event)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="control-panel__icon-button"
                          onClick={() => handleDeleteEvent(event.id!)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderServicesTab = () => (
    <div className="control-panel__content">
      {editingService && (
        <ServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSave={handleSaveService}
        />
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Services Page Settings</h3>
          {servicesSettings && (
            <button
              className="control-panel__icon-button"
              onClick={() => handleDeleteServicesSettings()}
              title="Delete Settings"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {servicesSettings ? (
          <div style={{ marginTop: "16px" }}>
            <p>
              <strong>Badge Text:</strong>{" "}
              {servicesSettings.badge_text || "Not set"}
            </p>
            <p>
              <strong>Heading:</strong> {servicesSettings.heading || "Not set"}
            </p>
            <p>
              <strong>Subheading:</strong>{" "}
              {servicesSettings.subheading || "Not set"}
            </p>
            <p>
              <strong>View All Button Text:</strong>{" "}
              {servicesSettings.view_all_button_text || "Not set"}
            </p>
            <button
              className="control-panel__button control-panel__button--secondary"
              style={{ marginTop: "12px" }}
              onClick={() => setEditingServicesSettings(servicesSettings)}
            >
              <Edit size={16} />
              Edit Settings
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: "#666", marginBottom: "12px" }}>
              No settings configured
            </p>
            <button
              className="control-panel__button control-panel__button--primary"
              onClick={() =>
                setEditingServicesSettings({
                  heading: "",
                })
              }
            >
              <Plus size={16} />
              Create Settings
            </button>
          </div>
        )}
      </div>
      {editingServicesSettings && (
        <ServicesSettingsModal
          settings={editingServicesSettings}
          onClose={() => setEditingServicesSettings(null)}
          onSave={handleSaveServicesSettings}
        />
      )}
      {serviceRequests.length > 0 && (
        <div className="control-panel__section">
          <h3 className="control-panel__section-title">
            Service Requests ({serviceRequests.length})
          </h3>
          <div className="control-panel__table-wrapper">
            <table className="control-panel__table">
              <thead>
                <tr>
                  <th>Service ID</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {serviceRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.service_id}</td>
                    <td
                      style={{
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {req.description}
                    </td>
                    <td>
                      <span
                        className={`control-panel__badge control-panel__badge--${
                          req.status || "pending"
                        }`}
                      >
                        {req.status || "pending"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`control-panel__badge control-panel__badge--${
                          req.priority || "medium"
                        }`}
                      >
                        {req.priority || "medium"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Services</h3>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() =>
              setEditingService({
                service_key: "",
                title: "",
                description: "",
                icon_color: "#1a5d3a",
                is_active: true,
                display_order: 0,
              })
            }
          >
            <Plus size={16} />
            Add Service
          </button>
        </div>
        <div className="control-panel__grid">
          {services.length === 0 ? (
            <div
              className="control-panel__empty"
              style={{ gridColumn: "1 / -1" }}
            >
              No services yet
            </div>
          ) : (
            services.map((service) => (
              <div key={service.id} className="control-panel__card">
                <div className="control-panel__card-header">
                  <h4>{service.title}</h4>
                  <div className="control-panel__card-actions">
                    <button
                      className="control-panel__icon-button"
                      onClick={() => setEditingService(service)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="control-panel__icon-button"
                      onClick={() => handleDeleteService(service.id!)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="control-panel__card-description">
                  {service.description}
                </p>
                <span
                  className={`control-panel__badge ${
                    service.is_active
                      ? "control-panel__badge--active"
                      : "control-panel__badge--inactive"
                  }`}
                >
                  {service.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderPricingTab = () => (
    <div className="control-panel__content">
      {editingPlan && (
        <PricingPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={handleSavePlan}
        />
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Pricing Page Settings</h3>
          {pricingSettings && (
            <button
              className="control-panel__icon-button"
              onClick={() => handleDeletePricingSettings()}
              title="Delete Settings"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {pricingSettings ? (
          <div style={{ marginTop: "16px" }}>
            <p>
              <strong>Badge Text:</strong>{" "}
              {pricingSettings.badge_text || "Not set"}
            </p>
            <p>
              <strong>Heading:</strong> {pricingSettings.heading || "Not set"}
            </p>
            <p>
              <strong>Subheading:</strong>{" "}
              {pricingSettings.subheading || "Not set"}
            </p>
            <p>
              <strong>Subscribe Button Text:</strong>{" "}
              {pricingSettings.subscribe_button_text || "Not set"}
            </p>
            <button
              className="control-panel__button control-panel__button--secondary"
              style={{ marginTop: "12px" }}
              onClick={() => setEditingPricingSettings(pricingSettings)}
            >
              <Edit size={16} />
              Edit Settings
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: "#666", marginBottom: "12px" }}>
              No settings configured
            </p>
            <button
              className="control-panel__button control-panel__button--primary"
              onClick={() =>
                setEditingPricingSettings({
                  heading: "",
                })
              }
            >
              <Plus size={16} />
              Create Settings
            </button>
          </div>
        )}
      </div>
      {editingPricingSettings && (
        <PricingSettingsModal
          settings={editingPricingSettings}
          onClose={() => setEditingPricingSettings(null)}
          onSave={handleSavePricingSettings}
        />
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Pricing Plans</h3>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() =>
              setEditingPlan({
                plan_key: "",
                name: "",
                price: 0,
                currency: "NGN",
                billing_period: "monthly",
                is_active: true,
                display_order: 0,
              })
            }
          >
            <Plus size={16} />
            Add Plan
          </button>
        </div>
        <div className="control-panel__grid">
          {pricingPlans.length === 0 ? (
            <div
              className="control-panel__empty"
              style={{ gridColumn: "1 / -1" }}
            >
              No pricing plans yet
            </div>
          ) : (
            pricingPlans.map((plan) => (
              <div key={plan.id} className="control-panel__card">
                <div className="control-panel__card-header">
                  <h4>{plan.name}</h4>
                  <div className="control-panel__card-actions">
                    <button
                      className="control-panel__icon-button"
                      onClick={() => setEditingPlan(plan)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="control-panel__icon-button"
                      onClick={() => handleDeletePlan(plan.id!)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="control-panel__card-price">
                  ₦{plan.price.toLocaleString()}
                </p>
                <p className="control-panel__card-description">
                  {plan.description || "No description"}
                </p>
                <button
                  className="control-panel__button control-panel__button--secondary"
                  style={{ marginTop: "8px" }}
                >
                  Manage Features ({planFeatures[plan.id || ""]?.length || 0})
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderGuidelinesTab = () => (
    <div className="control-panel__content">
      {editingGuideline && (
        <GuidelineModal
          guideline={editingGuideline}
          onClose={() => setEditingGuideline(null)}
          onSave={handleSaveGuideline}
        />
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">
            Guidelines Page Settings
          </h3>
          {guidelinesSettings && (
            <button
              className="control-panel__icon-button"
              onClick={() => handleDeleteGuidelinesSettings()}
              title="Delete Settings"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {guidelinesSettings ? (
          <div style={{ marginTop: "16px" }}>
            <p>
              <strong>Badge Text:</strong>{" "}
              {guidelinesSettings.badge_text || "Not set"}
            </p>
            <p>
              <strong>Heading:</strong>{" "}
              {guidelinesSettings.heading || "Not set"}
            </p>
            <button
              className="control-panel__button control-panel__button--secondary"
              style={{ marginTop: "12px" }}
              onClick={() => setEditingGuidelinesSettings(guidelinesSettings)}
            >
              <Edit size={16} />
              Edit Settings
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: "#666", marginBottom: "12px" }}>
              No settings configured
            </p>
            <button
              className="control-panel__button control-panel__button--primary"
              onClick={() =>
                setEditingGuidelinesSettings({
                  badge_text: "",
                  heading: "",
                })
              }
            >
              <Plus size={16} />
              Create Settings
            </button>
          </div>
        )}
      </div>
      {editingGuidelinesSettings && (
        <GuidelinesSettingsModal
          settings={editingGuidelinesSettings}
          onClose={() => setEditingGuidelinesSettings(null)}
          onSave={handleSaveGuidelinesSettings}
        />
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Guidelines</h3>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() =>
              setEditingGuideline({
                quote: "",
                author_name: "",
                rating: 5,
                display_order: 0,
                is_active: true,
              })
            }
          >
            <Plus size={16} />
            Add Guideline
          </button>
        </div>
        <div className="control-panel__table-wrapper">
          <table className="control-panel__table">
            <thead>
              <tr>
                <th>Quote</th>
                <th>Author</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {guidelines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="control-panel__empty">
                    No guidelines yet
                  </td>
                </tr>
              ) : (
                guidelines.map((guideline) => (
                  <tr key={guideline.id}>
                    <td
                      style={{
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {guideline.quote}
                    </td>
                    <td>{guideline.author_name}</td>
                    <td>{guideline.rating || 5} ⭐</td>
                    <td>
                      <span
                        className={`control-panel__badge ${
                          guideline.is_active
                            ? "control-panel__badge--active"
                            : "control-panel__badge--inactive"
                        }`}
                      >
                        {guideline.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="control-panel__card-actions">
                        <button
                          className="control-panel__icon-button"
                          onClick={() => setEditingGuideline(guideline)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="control-panel__icon-button"
                          onClick={() => handleDeleteGuideline(guideline.id!)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderHeroTab = () => (
    <div className="control-panel__content">
      {editingSlide && (
        <HeroSlideModal
          slide={editingSlide}
          onClose={() => setEditingSlide(null)}
          onSave={handleSaveSlide}
        />
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Hero Page Settings</h3>
          {heroSettings && (
            <button
              className="control-panel__icon-button"
              onClick={() => handleDeleteHeroSettings()}
              title="Delete Settings"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {heroSettings ? (
          <div style={{ marginTop: "16px" }}>
            <p>
              <strong>Slide Duration (seconds):</strong>{" "}
              {heroSettings.slide_duration_seconds || "Not set"}
            </p>
            <p>
              <strong>Auto Advance:</strong>{" "}
              {heroSettings.auto_advance ? "Yes" : "No"}
            </p>
            <p>
              <strong>Show Navigation Dots:</strong>{" "}
              {heroSettings.show_navigation_dots ? "Yes" : "No"}
            </p>
            <p>
              <strong>Show Prev/Next Arrows:</strong>{" "}
              {heroSettings.show_prev_next_arrows ? "Yes" : "No"}
            </p>
            <p>
              <strong>Default Badge Text:</strong>{" "}
              {heroSettings.default_badge_text || "Not set"}
            </p>
            <p>
              <strong>Primary Button Text:</strong>{" "}
              {heroSettings.primary_button_text || "Not set"}
            </p>
            <p>
              <strong>Primary Button Route:</strong>{" "}
              {heroSettings.primary_button_route || "Not set"}
            </p>
            <p>
              <strong>Secondary Button Text:</strong>{" "}
              {heroSettings.secondary_button_text || "Not set"}
            </p>
            <p>
              <strong>Secondary Button Route:</strong>{" "}
              {heroSettings.secondary_button_route || "Not set"}
            </p>
            <button
              className="control-panel__button control-panel__button--secondary"
              style={{ marginTop: "12px" }}
              onClick={() => setEditingHeroSettings(heroSettings)}
            >
              <Edit size={16} />
              Edit Settings
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: "#666", marginBottom: "12px" }}>
              No settings configured
            </p>
            <button
              className="control-panel__button control-panel__button--primary"
              onClick={() =>
                setEditingHeroSettings({
                  slide_duration_seconds: 5,
                  auto_advance: true,
                  show_navigation_dots: true,
                  show_prev_next_arrows: true,
                })
              }
            >
              <Plus size={16} />
              Create Settings
            </button>
          </div>
        )}
      </div>
      {editingHeroSettings && (
        <HeroSettingsModal
          settings={editingHeroSettings}
          onClose={() => setEditingHeroSettings(null)}
          onSave={handleSaveHeroSettings}
        />
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Hero Slides</h3>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() =>
              setEditingSlide({
                title: "",
                image_url: "",
                slide_order: 0,
                is_active: true,
              })
            }
          >
            <Plus size={16} />
            Add Slide
          </button>
        </div>
        <div className="control-panel__grid">
          {heroSlides.length === 0 ? (
            <div
              className="control-panel__empty"
              style={{ gridColumn: "1 / -1" }}
            >
              No slides yet
            </div>
          ) : (
            heroSlides.map((slide) => (
              <div key={slide.id} className="control-panel__card">
                <div className="control-panel__card-image">
                  {slide.image_url ? (
                    <img
                      src={slide.image_url}
                      alt={slide.image_alt || slide.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <Image size={48} />
                  )}
                </div>
                <div className="control-panel__card-header">
                  <h4>{slide.title || "Untitled Slide"}</h4>
                  <div className="control-panel__card-actions">
                    <button
                      className="control-panel__icon-button"
                      onClick={() => setEditingSlide(slide)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="control-panel__icon-button"
                      onClick={() => handleDeleteSlide(slide.id!)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <span
                  className={`control-panel__badge ${
                    slide.is_active
                      ? "control-panel__badge--active"
                      : "control-panel__badge--inactive"
                  }`}
                >
                  {slide.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderFooterTab = () => (
    <div className="control-panel__content">
      {editingFooterLink && (
        <FooterLinkModal
          link={editingFooterLink}
          onClose={() => setEditingFooterLink(null)}
          onSave={handleSaveFooterLink}
        />
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Footer Settings</h3>
          {footerSettings && (
            <button
              className="control-panel__icon-button"
              onClick={() => handleDeleteFooterSettings()}
              title="Delete Settings"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {footerSettings ? (
          <div style={{ marginTop: "16px" }}>
            <p>
              <strong>Logo URL:</strong> {footerSettings.logo_url || "Not set"}
            </p>
            <p>
              <strong>Tagline:</strong> {footerSettings.tagline || "Not set"}
            </p>
            <p>
              <strong>Copyright Text:</strong>{" "}
              {footerSettings.copyright_text || "Not set"}
            </p>
            {footerSettings.social_media &&
              Object.keys(footerSettings.social_media).length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <strong>Social Media:</strong>
                  <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                    {Object.entries(footerSettings.social_media).map(
                      ([platform, url]) => (
                        <li key={platform}>
                          {platform}: {url}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            <button
              className="control-panel__button control-panel__button--secondary"
              style={{ marginTop: "12px" }}
              onClick={() => setEditingFooterSettings(footerSettings)}
            >
              <Edit size={16} />
              Edit Settings
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: "#666", marginBottom: "12px" }}>
              No settings configured
            </p>
            <button
              className="control-panel__button control-panel__button--primary"
              onClick={() =>
                setEditingFooterSettings({
                  logo_url: "",
                  tagline: "",
                  copyright_text: "",
                })
              }
            >
              <Plus size={16} />
              Create Settings
            </button>
          </div>
        )}
      </div>
      {editingFooterSettings && (
        <FooterSettingsModal
          settings={editingFooterSettings}
          onClose={() => setEditingFooterSettings(null)}
          onSave={handleSaveFooterSettings}
        />
      )}
      <div className="control-panel__section">
        <div className="control-panel__header">
          <h3 className="control-panel__section-title">Footer Links</h3>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() =>
              setEditingFooterLink({
                link_text: "",
                link_url: "",
                section: "quick_links",
                display_order: 0,
                is_active: true,
              })
            }
          >
            <Plus size={16} />
            Add Link
          </button>
        </div>
        <div className="control-panel__table-wrapper">
          <table className="control-panel__table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Link Text</th>
                <th>URL</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {footerLinks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="control-panel__empty">
                    No links yet
                  </td>
                </tr>
              ) : (
                footerLinks.map((link) => (
                  <tr key={link.id}>
                    <td>{link.section}</td>
                    <td>{link.link_text}</td>
                    <td>{link.link_url}</td>
                    <td>
                      <span
                        className={`control-panel__badge ${
                          link.is_active
                            ? "control-panel__badge--active"
                            : "control-panel__badge--inactive"
                        }`}
                      >
                        {link.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="control-panel__card-actions">
                        <button
                          className="control-panel__icon-button"
                          onClick={() => setEditingFooterLink(link)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="control-panel__icon-button"
                          onClick={() => handleDeleteFooterLink(link.id!)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (loading) {
      return <div className="control-panel__empty">Loading...</div>;
    }

    if (error) {
      return (
        <div className="control-panel__empty" style={{ color: "#dc2626" }}>
          <AlertCircle size={20} style={{ marginBottom: "8px" }} />
          {error}
        </div>
      );
    }

    switch (activeTab) {
      case "navbar":
        return renderNavbarTab();
      case "contact":
        return renderContactTab();
      case "events":
        return renderEventsTab();
      case "services":
        return renderServicesTab();
      case "pricing":
        return renderPricingTab();
      case "guidelines":
        return renderGuidelinesTab();
      case "hero":
        return renderHeroTab();
      case "footer":
        return renderFooterTab();
      default:
        return <div>Select a tab</div>;
    }
  };

  // Handler functions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteNavbarItem = async (_id: string) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveNavbarItem = async (_item: NavbarMenuItem) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
    setEditingNavbarItem(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteContactMessage = async (_id: string) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteContactInfo = async (_id: string) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteEvent = async (_id: string) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteService = async (_id: string) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteGuideline = async (_id: string) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteSlide = async (_id: string) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteFooterLink = async (_id: string) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveContactInfo = async (_info: ContactInformation) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
    setEditingContactInfo(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveEvent = async (_event: Event) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
    setEditingEvent(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveService = async (_service: Service) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
    setEditingService(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSavePlan = async (_plan: PricingPlan) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
    setEditingPlan(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveGuideline = async (_guideline: Guideline) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
    setEditingGuideline(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveSlide = async (_slide: HeroSlide) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
    setEditingSlide(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveFooterLink = async (_link: FooterLink) => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
    setEditingFooterLink(null);
  };

  // Settings handlers
  const handleSaveNavbarSettings = async (settings: NavbarSettings) => {
    setNavbarSettings(settings);
    setEditingNavbarSettings(null);
  };

  const handleDeleteNavbarSettings = async () => {
    if (window.confirm("Are you sure you want to delete navbar settings?")) {
      setNavbarSettings(null);
    }
  };

  const handleSaveHeroSettings = async (settings: HeroPageSettings) => {
    setHeroSettings(settings);
    setEditingHeroSettings(null);
  };

  const handleDeleteHeroSettings = async () => {
    if (window.confirm("Are you sure you want to delete hero settings?")) {
      setHeroSettings(null);
    }
  };

  const handleSaveContactSettings = async (settings: ContactPageSettings) => {
    setContactSettings(settings);
    setEditingContactSettings(null);
  };

  const handleDeleteContactSettings = async () => {
    if (window.confirm("Are you sure you want to delete contact settings?")) {
      setContactSettings(null);
    }
  };

  const handleSaveEventsSettings = async (settings: EventsPageSettings) => {
    setEventsSettings(settings);
    setEditingEventsSettings(null);
  };

  const handleDeleteEventsSettings = async () => {
    if (window.confirm("Are you sure you want to delete events settings?")) {
      setEventsSettings(null);
    }
  };

  const handleSaveServicesSettings = async (settings: ServicesPageSettings) => {
    setServicesSettings(settings);
    setEditingServicesSettings(null);
  };

  const handleDeleteServicesSettings = async () => {
    if (window.confirm("Are you sure you want to delete services settings?")) {
      setServicesSettings(null);
    }
  };

  const handleSavePricingSettings = async (settings: PricingPageSettings) => {
    setPricingSettings(settings);
    setEditingPricingSettings(null);
  };

  const handleDeletePricingSettings = async () => {
    if (window.confirm("Are you sure you want to delete pricing settings?")) {
      setPricingSettings(null);
    }
  };

  const handleSaveGuidelinesSettings = async (
    settings: GuidelinesPageSettings
  ) => {
    setGuidelinesSettings(settings);
    setEditingGuidelinesSettings(null);
  };

  const handleDeleteGuidelinesSettings = async () => {
    if (
      window.confirm("Are you sure you want to delete guidelines settings?")
    ) {
      setGuidelinesSettings(null);
    }
  };

  const handleSaveFooterSettings = async (settings: FooterSettings) => {
    setFooterSettings(settings);
    setEditingFooterSettings(null);
  };

  const handleDeleteFooterSettings = async () => {
    if (window.confirm("Are you sure you want to delete footer settings?")) {
      setFooterSettings(null);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this pricing plan?")) {
      setPricingPlans((prev) => prev.filter((plan) => plan.id !== id));
      setPlanFeatures((prev) => {
        const newFeatures = { ...prev };
        delete newFeatures[id];
        return newFeatures;
      });
    }
  };

  // Export current hardcoded elements to database
  const handleExportCurrentElements = async () => {
    // No API calls - functionality disabled
    alert("Backend API removed. This functionality is no longer available.");
    return;
  };

  return (
    <div className="pages-control-panel">
      <div className="pages-control-panel__overlay" onClick={onClose}></div>
      <div className="pages-control-panel__container">
        <div className="pages-control-panel__header">
          <h2 className="pages-control-panel__title">
            Landing Page Management
          </h2>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="control-panel__button control-panel__button--primary"
              onClick={handleExportCurrentElements}
              style={{ fontSize: "14px", padding: "8px 16px" }}
              title="Export current hardcoded elements to database"
            >
              <Plus size={16} style={{ marginRight: "4px" }} />
              Export Current Elements
            </button>
            <button
              className="pages-control-panel__close"
              onClick={onClose}
              aria-label="Close panel"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="pages-control-panel__tabs">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`pages-control-panel__tab ${
                  activeTab === tab.id ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pages-control-panel__body">{renderTabContent()}</div>

        <div className="pages-control-panel__footer">
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple modal component for Navbar Item editing
const NavbarItemModal: React.FC<{
  item: NavbarMenuItem;
  onClose: () => void;
  onSave: (item: NavbarMenuItem) => void;
}> = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState<NavbarMenuItem>(item);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Edit Menu Item</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Label"
            value={formData.label}
            onChange={(e) =>
              setFormData({ ...formData, label: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <select
            value={formData.link_type}
            onChange={(e) => {
              const linkType = e.target.value as
                | "scroll"
                | "route"
                | "external";
              setFormData({ ...formData, link_type: linkType });
            }}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="scroll">Scroll</option>
            <option value="route">Route</option>
            <option value="external">External</option>
          </select>
          <input
            type="text"
            placeholder="Target/URL"
            value={formData.link_target || formData.scroll_target_id || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                link_target:
                  formData.link_type === "external" ||
                  formData.link_type === "route"
                    ? e.target.value
                    : undefined,
                scroll_target_id:
                  formData.link_type === "scroll" ? e.target.value : undefined,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder="Display Order"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({
                ...formData,
                display_order: parseInt(e.target.value) || 0,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            Active
          </label>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Contact Information Modal
const ContactInfoModal: React.FC<{
  info: ContactInformation;
  onClose: () => void;
  onSave: (info: ContactInformation) => void;
}> = ({ info, onSave, onClose }) => {
  const [formData, setFormData] = useState<ContactInformation>(info);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Contact Information</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <select
            value={formData.contact_type}
            onChange={(e) => {
              const contactType = e.target.value as
                | "phone"
                | "email"
                | "location";
              setFormData({ ...formData, contact_type: contactType });
            }}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="location">Location</option>
          </select>
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Primary Value"
            value={formData.primary_value}
            onChange={(e) =>
              setFormData({ ...formData, primary_value: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Secondary Value (optional)"
            value={formData.secondary_value || ""}
            onChange={(e) =>
              setFormData({ ...formData, secondary_value: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="color"
            placeholder="Icon Color"
            value={formData.icon_color || "#1a5d3a"}
            onChange={(e) =>
              setFormData({ ...formData, icon_color: e.target.value })
            }
            style={{
              padding: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder="Display Order"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({
                ...formData,
                display_order: parseInt(e.target.value) || 0,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            Active
          </label>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Event Modal
const EventModal: React.FC<{
  event: Event;
  onClose: () => void;
  onSave: (event: Event) => void;
}> = ({ event, onSave, onClose }) => {
  const [formData, setFormData] = useState<Event>(event);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Event</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <textarea
            placeholder="Description"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              minHeight: "80px",
            }}
          />
          <input
            type="date"
            placeholder="Event Date"
            value={formData.event_date}
            onChange={(e) =>
              setFormData({ ...formData, event_date: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="time"
            placeholder="Event Time"
            value={formData.event_time || ""}
            onChange={(e) =>
              setFormData({ ...formData, event_time: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Location"
            value={formData.location || ""}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Venue"
            value={formData.venue || ""}
            onChange={(e) =>
              setFormData({ ...formData, venue: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Image URL"
            value={formData.image_url || ""}
            onChange={(e) =>
              setFormData({ ...formData, image_url: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <select
            value={formData.status || "upcoming"}
            onChange={(e) => {
              const status = e.target.value as
                | "upcoming"
                | "ongoing"
                | "completed"
                | "cancelled";
              setFormData({ ...formData, status });
            }}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="number"
            placeholder="Max Attendees"
            value={formData.max_attendees || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                max_attendees: parseInt(e.target.value) || undefined,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder="Ticket Price"
            value={formData.ticket_price || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                ticket_price: parseFloat(e.target.value) || undefined,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Service Modal
const ServiceModal: React.FC<{
  service: Service;
  onClose: () => void;
  onSave: (service: Service) => void;
}> = ({ service, onSave, onClose }) => {
  const [formData, setFormData] = useState<Service>(service);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Service</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Service Key"
            value={formData.service_key}
            onChange={(e) =>
              setFormData({ ...formData, service_key: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              minHeight: "80px",
            }}
          />
          <input
            type="color"
            placeholder="Icon Color"
            value={formData.icon_color}
            onChange={(e) =>
              setFormData({ ...formData, icon_color: e.target.value })
            }
            style={{
              padding: "4px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Category (optional)"
            value={formData.category || ""}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Service URL (optional)"
            value={formData.service_url || ""}
            onChange={(e) =>
              setFormData({ ...formData, service_url: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder="Display Order"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({
                ...formData,
                display_order: parseInt(e.target.value) || 0,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            Active
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.requires_authentication || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requires_authentication: e.target.checked,
                })
              }
            />
            Requires Authentication
          </label>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Pricing Plan Modal
const PricingPlanModal: React.FC<{
  plan: PricingPlan;
  onClose: () => void;
  onSave: (plan: PricingPlan) => void;
}> = ({ plan, onSave, onClose }) => {
  const [formData, setFormData] = useState<PricingPlan>(plan);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Pricing Plan</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Plan Key"
            value={formData.plan_key}
            onChange={(e) =>
              setFormData({ ...formData, plan_key: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Plan Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={(e) =>
              setFormData({
                ...formData,
                price: parseFloat(e.target.value) || 0,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Currency (e.g., NGN)"
            value={formData.currency || "NGN"}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <select
            value={formData.billing_period || "monthly"}
            onChange={(e) => {
              const billingPeriod = e.target.value as
                | "monthly"
                | "yearly"
                | "one-time";
              setFormData({ ...formData, billing_period: billingPeriod });
            }}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="one-time">One-time</option>
          </select>
          <textarea
            placeholder="Description (optional)"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              minHeight: "60px",
            }}
          />
          <input
            type="number"
            placeholder="Display Order"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({
                ...formData,
                display_order: parseInt(e.target.value) || 0,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            Active
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.is_popular || false}
              onChange={(e) =>
                setFormData({ ...formData, is_popular: e.target.checked })
              }
            />
            Popular Plan
          </label>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Guideline Modal
const GuidelineModal: React.FC<{
  guideline: Guideline;
  onClose: () => void;
  onSave: (guideline: Guideline) => void;
}> = ({ guideline, onSave, onClose }) => {
  const [formData, setFormData] = useState<Guideline>(guideline);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Guideline</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <textarea
            placeholder="Quote"
            value={formData.quote}
            onChange={(e) =>
              setFormData({ ...formData, quote: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              minHeight: "100px",
            }}
          />
          <input
            type="text"
            placeholder="Author Name"
            value={formData.author_name}
            onChange={(e) =>
              setFormData({ ...formData, author_name: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Author Role (optional)"
            value={formData.author_role || ""}
            onChange={(e) =>
              setFormData({ ...formData, author_role: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder="Rating (1-5)"
            min="1"
            max="5"
            value={formData.rating || 5}
            onChange={(e) =>
              setFormData({
                ...formData,
                rating: parseInt(e.target.value) || 5,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Author Image URL (optional)"
            value={formData.author_image_url || ""}
            onChange={(e) =>
              setFormData({ ...formData, author_image_url: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder="Display Order"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({
                ...formData,
                display_order: parseInt(e.target.value) || 0,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            Active
          </label>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Hero Slide Modal
const HeroSlideModal: React.FC<{
  slide: HeroSlide;
  onClose: () => void;
  onSave: (slide: HeroSlide) => void;
}> = ({ slide, onSave, onClose }) => {
  const [formData, setFormData] = useState<HeroSlide>(slide);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Hero Slide</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Subtitle (optional)"
            value={formData.subtitle || ""}
            onChange={(e) =>
              setFormData({ ...formData, subtitle: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              minHeight: "60px",
            }}
          />
          <input
            type="text"
            placeholder="Image URL"
            value={formData.image_url}
            onChange={(e) =>
              setFormData({ ...formData, image_url: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Image Alt Text (optional)"
            value={formData.image_alt || ""}
            onChange={(e) =>
              setFormData({ ...formData, image_alt: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Link URL (optional)"
            value={formData.link_url || ""}
            onChange={(e) =>
              setFormData({ ...formData, link_url: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Link Text (optional)"
            value={formData.link_text || ""}
            onChange={(e) =>
              setFormData({ ...formData, link_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Button Text (optional)"
            value={formData.button_text || ""}
            onChange={(e) =>
              setFormData({ ...formData, button_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder="Slide Order"
            value={formData.slide_order}
            onChange={(e) =>
              setFormData({
                ...formData,
                slide_order: parseInt(e.target.value) || 0,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            Active
          </label>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Footer Link Modal
const FooterLinkModal: React.FC<{
  link: FooterLink;
  onClose: () => void;
  onSave: (link: FooterLink) => void;
}> = ({ link, onSave, onClose }) => {
  const [formData, setFormData] = useState<FooterLink>(link);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Footer Link</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <select
            value={formData.section}
            onChange={(e) => {
              const section = e.target.value as
                | "quick_links"
                | "services"
                | "legal"
                | "social";
              setFormData({ ...formData, section });
            }}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="quick_links">Quick Links</option>
            <option value="services">Services</option>
            <option value="legal">Legal</option>
            <option value="social">Social</option>
          </select>
          <input
            type="text"
            placeholder="Link Text"
            value={formData.link_text}
            onChange={(e) =>
              setFormData({ ...formData, link_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Link URL"
            value={formData.link_url}
            onChange={(e) =>
              setFormData({ ...formData, link_url: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="number"
            placeholder="Display Order"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({
                ...formData,
                display_order: parseInt(e.target.value) || 0,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            Active
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.opens_in_new_tab || false}
              onChange={(e) =>
                setFormData({ ...formData, opens_in_new_tab: e.target.checked })
              }
            />
            Opens in New Tab
          </label>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Settings Modals
const NavbarSettingsModal: React.FC<{
  settings: NavbarSettings;
  onClose: () => void;
  onSave: (settings: NavbarSettings) => void;
}> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<NavbarSettings>(settings);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Navbar Settings</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Logo URL"
            value={formData.logo_url || ""}
            onChange={(e) =>
              setFormData({ ...formData, logo_url: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Logo Alt Text"
            value={formData.logo_alt || ""}
            onChange={(e) =>
              setFormData({ ...formData, logo_alt: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Get Started Button Text"
            value={formData.get_started_button_text || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                get_started_button_text: e.target.value,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Get Started Button Route"
            value={formData.get_started_button_route || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                get_started_button_route: e.target.value,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            Active
          </label>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const HeroSettingsModal: React.FC<{
  settings: HeroPageSettings;
  onClose: () => void;
  onSave: (settings: HeroPageSettings) => void;
}> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<HeroPageSettings>(settings);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Hero Settings</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="number"
            placeholder="Slide Duration (seconds)"
            value={formData.slide_duration_seconds || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                slide_duration_seconds: parseInt(e.target.value) || undefined,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.auto_advance || false}
              onChange={(e) =>
                setFormData({ ...formData, auto_advance: e.target.checked })
              }
            />
            Auto Advance
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.show_navigation_dots || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  show_navigation_dots: e.target.checked,
                })
              }
            />
            Show Navigation Dots
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={formData.show_prev_next_arrows || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  show_prev_next_arrows: e.target.checked,
                })
              }
            />
            Show Prev/Next Arrows
          </label>
          <input
            type="text"
            placeholder="Default Badge Text"
            value={formData.default_badge_text || ""}
            onChange={(e) =>
              setFormData({ ...formData, default_badge_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Primary Button Text"
            value={formData.primary_button_text || ""}
            onChange={(e) =>
              setFormData({ ...formData, primary_button_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Primary Button Route"
            value={formData.primary_button_route || ""}
            onChange={(e) =>
              setFormData({ ...formData, primary_button_route: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Secondary Button Text"
            value={formData.secondary_button_text || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                secondary_button_text: e.target.value,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Secondary Button Route"
            value={formData.secondary_button_route || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                secondary_button_route: e.target.value,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const ContactSettingsModal: React.FC<{
  settings: ContactPageSettings;
  onClose: () => void;
  onSave: (settings: ContactPageSettings) => void;
}> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<ContactPageSettings>(settings);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Contact Settings</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Badge Text"
            value={formData.badge_text || ""}
            onChange={(e) =>
              setFormData({ ...formData, badge_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Heading"
            value={formData.heading}
            onChange={(e) =>
              setFormData({ ...formData, heading: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Subheading"
            value={formData.subheading || ""}
            onChange={(e) =>
              setFormData({ ...formData, subheading: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const EventsSettingsModal: React.FC<{
  settings: EventsPageSettings;
  onClose: () => void;
  onSave: (settings: EventsPageSettings) => void;
}> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<EventsPageSettings>(settings);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Events Settings</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Badge Text"
            value={formData.badge_text || ""}
            onChange={(e) =>
              setFormData({ ...formData, badge_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Heading"
            value={formData.heading || ""}
            onChange={(e) =>
              setFormData({ ...formData, heading: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Subheading"
            value={formData.subheading || ""}
            onChange={(e) =>
              setFormData({ ...formData, subheading: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Default Image URL"
            value={formData.default_image_url || ""}
            onChange={(e) =>
              setFormData({ ...formData, default_image_url: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const ServicesSettingsModal: React.FC<{
  settings: ServicesPageSettings;
  onClose: () => void;
  onSave: (settings: ServicesPageSettings) => void;
}> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<ServicesPageSettings>(settings);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Services Settings</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Badge Text"
            value={formData.badge_text || ""}
            onChange={(e) =>
              setFormData({ ...formData, badge_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Heading"
            value={formData.heading}
            onChange={(e) =>
              setFormData({ ...formData, heading: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Subheading"
            value={formData.subheading || ""}
            onChange={(e) =>
              setFormData({ ...formData, subheading: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="View All Button Text"
            value={formData.view_all_button_text || ""}
            onChange={(e) =>
              setFormData({ ...formData, view_all_button_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const PricingSettingsModal: React.FC<{
  settings: PricingPageSettings;
  onClose: () => void;
  onSave: (settings: PricingPageSettings) => void;
}> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<PricingPageSettings>(settings);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Pricing Settings</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Badge Text"
            value={formData.badge_text || ""}
            onChange={(e) =>
              setFormData({ ...formData, badge_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Heading"
            value={formData.heading}
            onChange={(e) =>
              setFormData({ ...formData, heading: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Subheading"
            value={formData.subheading || ""}
            onChange={(e) =>
              setFormData({ ...formData, subheading: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Subscribe Button Text"
            value={formData.subscribe_button_text || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                subscribe_button_text: e.target.value,
              })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const GuidelinesSettingsModal: React.FC<{
  settings: GuidelinesPageSettings;
  onClose: () => void;
  onSave: (settings: GuidelinesPageSettings) => void;
}> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<GuidelinesPageSettings>(settings);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Guidelines Settings</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Badge Text"
            value={formData.badge_text || ""}
            onChange={(e) =>
              setFormData({ ...formData, badge_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="text"
            placeholder="Heading"
            value={formData.heading || ""}
            onChange={(e) =>
              setFormData({ ...formData, heading: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const FooterSettingsModal: React.FC<{
  settings: FooterSettings;
  onClose: () => void;
  onSave: (settings: FooterSettings) => void;
}> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<FooterSettings>(settings);
  const [socialMedia, setSocialMedia] = useState<{
    platform: string;
    url: string;
  }>({ platform: "", url: "" });

  const addSocialMedia = () => {
    if (socialMedia.platform && socialMedia.url) {
      setFormData({
        ...formData,
        social_media: {
          ...(formData.social_media || {}),
          [socialMedia.platform]: socialMedia.url,
        },
      });
      setSocialMedia({ platform: "", url: "" });
    }
  };

  const removeSocialMedia = (platform: string) => {
    const newSocial = { ...(formData.social_media || {}) };
    delete newSocial[platform];
    setFormData({ ...formData, social_media: newSocial });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10002,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Edit Footer Settings</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Logo URL"
            value={formData.logo_url || ""}
            onChange={(e) =>
              setFormData({ ...formData, logo_url: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <textarea
            placeholder="Tagline"
            value={formData.tagline || ""}
            onChange={(e) =>
              setFormData({ ...formData, tagline: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              minHeight: "60px",
            }}
          />
          <input
            type="text"
            placeholder="Copyright Text"
            value={formData.copyright_text || ""}
            onChange={(e) =>
              setFormData({ ...formData, copyright_text: e.target.value })
            }
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <div style={{ marginTop: "12px" }}>
            <strong>Social Media:</strong>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "8px",
                marginBottom: "8px",
              }}
            >
              <input
                type="text"
                placeholder="Platform (e.g., facebook)"
                value={socialMedia.platform}
                onChange={(e) =>
                  setSocialMedia({ ...socialMedia, platform: e.target.value })
                }
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  flex: 1,
                }}
              />
              <input
                type="text"
                placeholder="URL"
                value={socialMedia.url}
                onChange={(e) =>
                  setSocialMedia({ ...socialMedia, url: e.target.value })
                }
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  flex: 2,
                }}
              />
              <button
                className="control-panel__button control-panel__button--primary"
                onClick={addSocialMedia}
                style={{ padding: "8px 12px" }}
              >
                <Plus size={16} />
              </button>
            </div>
            {formData.social_media &&
              Object.entries(formData.social_media).map(([platform, url]) => (
                <div
                  key={platform}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    marginBottom: "4px",
                  }}
                >
                  <span>
                    <strong>{platform}:</strong> {url}
                  </span>
                  <button
                    className="control-panel__icon-button"
                    onClick={() => removeSocialMedia(platform)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            className="control-panel__button control-panel__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="control-panel__button control-panel__button--primary"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PagesControlPanel;
