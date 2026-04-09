import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Search,
  Mail,
  User,
  Phone,
  MapPin,
  Building2,
  FileText,
  Loader2,
  AlertCircle,
  Settings,
} from "lucide-react";
import { fetchPendingRegistrations } from "../utils/fetchWithTimeout";
import { approveAccount, rejectAccount } from "../services/adminApi";
import { fetchRegisteredCitizensCount } from "../utils/citizenCountUtils";
import "../main.css";
import "../scss/_admin.scss";

interface PendingRegistration {
  // id?: string;
  user_id: string;
  account_type: "personal" | "business";
  business_email: string;
  user_email: string;
  email?: string;
  user_firstname?: string;
  user_lastname?: string;
  business_name?: string;
  user_phone: string;
  business_phone: string;
  address?: string;
  business_location?: string;
  nin_number?: string;
  cac_number?: string;
  created_at: string;
  user_registered: string;
  status: "pending" | "approved" | "rejected";
}

const AdminSettings: React.FC = () => {
  const [pendingRegistrations, setPendingRegistrations] = useState<
    PendingRegistration[]
  >([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<
    PendingRegistration[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch pending registrations
  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔄 Loading admin settings data...");
        const data = await fetchPendingRegistrations();
        console.log("✅ admin settings data loaded:", data);
        // setadmin settingsData(data.data);
        //   const pendingData = await data.data;
        setPendingRegistrations(data);
        setFilteredRegistrations(data);
      } catch (error) {
        console.error("❌ Failed to load admin settings:", error);
        // Handle error (show error message, etc.)
        setError("Failed to load admin settings data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadSettingsData();
  }, []);

  // Filter registrations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRegistrations(pendingRegistrations);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredRegistrations(
        Array.isArray(pendingRegistrations)
          ? pendingRegistrations.filter(
              (reg) =>
                reg?.user_email?.toLowerCase().includes(query) ||
                reg?.business_email?.toLowerCase().includes(query) ||
                (reg?.user_firstname &&
                  reg.user_firstname.toLowerCase().includes(query)) ||
                (reg?.user_lastname &&
                  reg.user_lastname.toLowerCase().includes(query)) ||
                (reg?.business_name &&
                  reg.business_name.toLowerCase().includes(query)) ||
                reg?.user_phone?.includes(query) ||
                reg?.business_phone?.includes(query)
            )
          : []
      );
    }
  }, [searchQuery, pendingRegistrations]);

  // const fetchPendingRegistrations = async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     setSuccess(null);

  //     // Get the admin token
  //     const adminToken = localStorage.getItem("adminToken");

  //     // Make the actual API call - DON'T call fetchPendingRegistrations() again!
  //     const response = await fetch('https://new-joscity.onrender.com/api/auth/admin/pending', {
  //       method: 'GET',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${adminToken}`,
  //       },
  //     });

  //     console.log("pending registrations response", response);

  //     if (!response.ok) {
  //       // If endpoint doesn't exist, use mock data for now
  //       if (response.status === 404) {
  //         // Mock data for demonstration
  //         const mockData: PendingRegistration[] = [
  //           {
  //             id: "1",
  //             type: "personal",
  //             email: "john.doe@example.com",
  //             firstname: "John",
  //             lastname: "Doe",
  //             phone: "+234 801 234 5678",
  //             address: "123 Main Street, Jos, Plateau State",
  //             nin_number: "12345678901",
  //             created_at: new Date().toISOString(),
  //             status: "pending",
  //           },
  //           {
  //             id: "2",
  //             type: "business",
  //             email: "business@example.com",
  //             business_name: "Tech Solutions Ltd",
  //             phone: "+234 802 345 6789",
  //             business_location: "456 Business Avenue, Abuja",
  //             CAC_number: "RC123456",
  //             created_at: new Date().toISOString(),
  //             status: "pending",
  //           },
  //         ];
  //         setPendingRegistrations(mockData);
  //         setFilteredRegistrations(mockData);
  //         setLoading(false);
  //         return;
  //       }
  //       throw new Error(`Failed to fetch: ${response.statusText}`);
  //     }

  //     const data = await response.json();
  //     console.log('Successfully fetched data:', data);
  //     setPendingRegistrations(data.registrations || []);
  //     setFilteredRegistrations(data.registrations || []);
  //   } catch (err) {
  //     console.error("Error fetching pending registrations:", err);
  //     setError(
  //       err instanceof Error
  //         ? err.message
  //         : "Failed to fetch pending registrations"
  //     );
  //     // Use mock data on error for demonstration
  //     const mockData: PendingRegistration[] = [
  //       {
  //         id: "1",
  //         type: "personal",
  //         email: "john.doe@example.com",
  //         firstname: "John",
  //         lastname: "Doe",
  //         phone: "+234 801 234 5678",
  //         address: "123 Main Street, Jos, Plateau State",
  //         nin_number: "12345678901",
  //         created_at: new Date().toISOString(),
  //         status: "pending",
  //       },
  //       {
  //         id: "2",
  //         type: "business",
  //         email: "business@example.com",
  //         business_name: "Tech Solutions Ltd",
  //         phone: "+234 802 345 6789",
  //         business_location: "456 Business Avenue, Abuja",
  //         CAC_number: "RC123456",
  //         created_at: new Date().toISOString(),
  //         status: "pending",
  //       },
  //     ];
  //     setPendingRegistrations(mockData);
  //     setFilteredRegistrations(mockData);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleApprove = async (user_id: string) => {
    try {
      setProcessing(user_id);
      setError(null);
      setSuccess(null);

      // const adminToken = localStorage.getItem("adminToken");
      // if (!adminToken) {
      //   setError("Not authenticated");
      //   setProcessing(null);
      //   return;
      // }

      // Call the admin API function that sends approval email
      const result = await approveAccount(user_id);

      // Remove approved registration from list
      setPendingRegistrations((prev) =>
        prev.filter((reg) => reg.user_id !== user_id)
      );

      if (result.success) {
        console.log("successful approval", result.message);
        // Refresh count from API after approval
        await fetchRegisteredCitizensCount();
        // Dispatch custom event to update count in other components
        window.dispatchEvent(new Event("citizenCountUpdated"));
      } else {
        console.log("failed approval", result.message);
      }

      setSuccess(result.message);
    } catch (err) {
      console.error("Error approving registration:", err);
      setError(
        err instanceof Error ? err.message : "Failed to approve registration"
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (user_id: string) => {
    try {
      setProcessing(user_id);
      setError(null);
      setSuccess(null);

      // Call the reject API function that sends rejection email
      const result = await rejectAccount(user_id);

      // Remove rejected user from list
      setPendingRegistrations((prev) =>
        prev.filter((reg) => reg.user_id !== user_id)
      );

      if (result.success) {
        console.log("successful rejection", result.message);
        // Note: We don't decrement here because rejected users were never approved
        // Only approved users are counted in registered citizens
        // If a user was previously approved and then rejected, that should be handled separately
        // Dispatch custom event to update count in other components (in case count needs refresh)
        window.dispatchEvent(new Event("citizenCountUpdated"));
      } else {
        console.log("failed rejection", result.message);
      }

      setSuccess(result.message || "User rejected successfully");
    } catch (err) {
      console.error("Error rejecting user:", err);
      setError(err instanceof Error ? err.message : "Failed to reject user");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-dashboard__header">
        <h1>
          <Settings size={20} />
          Settings - Registration Approvals
        </h1>
      </div>

      {/* Search Bar */}
      <div className="admin-dashboard__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by email, name, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="admin-dashboard__search-input"
        />
      </div>

      {/* Messages */}
      {error && (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="admin-dashboard__message-close admin-dashboard__message-close--error"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-dashboard__message admin-dashboard__message--success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="admin-dashboard__message-close admin-dashboard__message-close--success"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span className="admin-dashboard__loading-text">
            Loading registrations...
          </span>
        </div>
      )}

      {/* Registrations List */}
      {!loading && (
        <>
          {filteredRegistrations.length === 0 ? (
            <div className="admin-dashboard__empty-state">
              <FileText
                size={48}
                className="admin-dashboard__empty-state-icon"
              />
              <p className="admin-dashboard__empty-state-text">
                {searchQuery
                  ? "No registrations found matching your search"
                  : "No pending registrations"}
              </p>
            </div>
          ) : (
            <div className="admin-dashboard__registrations-grid">
              {filteredRegistrations.map((registration) => (
                <div
                  key={registration.user_id}
                  className="admin-dashboard__registration-card"
                >
                  <div className="admin-dashboard__card-header">
                    <div className="admin-dashboard__card-content">
                      <div className="admin-dashboard__account-badge-container">
                        {registration.account_type === "business" ? (
                          <Building2 size={20} color="var(--text-tertiary)" />
                        ) : (
                          <User size={20} color="var(--text-tertiary)" />
                        )}
                        <span className="admin-dashboard__account-badge">
                          {registration.account_type === "business"
                            ? "Business"
                            : "Personal"}
                        </span>
                        <span className="admin-dashboard__registration-date">
                          {formatDate(registration.user_registered)}
                        </span>
                      </div>

                      <h3 className="admin-dashboard__registration-name">
                        {registration.account_type === "business"
                          ? registration.business_name
                          : `${registration.user_firstname} ${registration.user_lastname}`}
                      </h3>

                      <div className="admin-registration-grid">
                        <div className="admin-dashboard__info-item">
                          <Mail size={16} />
                          <span>
                            {registration.business_email ||
                              registration.user_email}
                          </span>
                        </div>
                        <div className="admin-dashboard__info-item">
                          <Phone size={16} />
                          <span>
                            {registration.business_phone ||
                              registration.user_phone}
                          </span>
                        </div>
                        {registration.account_type === "personal" ? (
                          <>
                            {registration.address && (
                              <div className="admin-dashboard__info-item admin-dashboard__info-item--address">
                                <MapPin size={16} />
                                <span>{registration.address}</span>
                              </div>
                            )}
                            {registration.nin_number && (
                              <div className="admin-dashboard__info-item">
                                <FileText size={16} />
                                <span>NIN: {registration.nin_number}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {registration.business_location && (
                              <div className="admin-dashboard__info-item admin-dashboard__info-item--address">
                                <MapPin size={16} />
                                <span>{registration.business_location}</span>
                              </div>
                            )}
                            {registration.cac_number && (
                              <div className="admin-dashboard__info-item">
                                <FileText size={16} />
                                <span>CAC: {registration.cac_number}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="admin-registration-actions">
                    <button
                      onClick={() =>
                        handleApprove(
                          registration.user_id
                          // , (registration.user_email || registration.business_email)
                        )
                      }
                      disabled={processing === registration.user_id}
                      className="admin-registration-btn admin-registration-btn--approve"
                    >
                      {processing === registration.user_id ? (
                        <>
                          <Loader2 size={16} className="spinner" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          <span>Approve</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(registration.user_id)}
                      disabled={processing === registration.user_id}
                      className="admin-registration-btn admin-registration-btn--disapprove"
                    >
                      {processing === registration.user_id ? (
                        <>
                          <Loader2 size={16} className="spinner" />
                          <span>Rejecting...</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} />
                          <span>Reject</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminSettings;
