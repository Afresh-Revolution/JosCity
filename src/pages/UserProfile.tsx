import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  User,
  Mail,
  Calendar,
  ArrowLeft,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  Crown,
  CheckCircle,
  Building2,
  LogOut,
  Phone,
  MapPin,
  IdCard,
  VenusAndMars,
  Copy,
} from "lucide-react";
import "../main.css";
import "../scss/_user-profile.scss";
import {
  getUserData,
  getUserName,
  getUserEmail,
  getUserAccountType,
  getUserInitials,
  getUserId,
} from "../utils/userUtils";
import { userApi } from "../services/userApi";
import { getUserProfile, uploadProfilePicture } from "../api/auth";
import LazyImage from "../components/LazyImage";
import ConfirmationModal from "../components/ConfirmationModal";
import { formatMemberDisplayId } from "../utils/memberDisplayId";

/** Numeric id from profile API or stored user object */
function readNumericUserId(data: Record<string, unknown> | null): number {
  if (!data) return 0;
  const raw = data.user_id ?? data.id ?? data.userId;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string" && raw.trim() && !Number.isNaN(Number(raw))) {
    const n = Number(raw);
    return n > 0 ? n : 0;
  }
  return 0;
}

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const [userData, setUserData] = useState<Record<string, unknown> | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editedData, setEditedData] = useState({
    user_firstname: "",
    user_lastname: "",
    user_gender: "",
    user_email: "",
    user_phone: "",
    nin_number: "",
    address: "",
    // Business fields
    business_name: "",
    business_type: "",
    business_email: "",
    business_phone: "",
    business_location: "",
    CAC_number: "",
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [userIdCopied, setUserIdCopied] = useState(false);
  const accountType = getUserAccountType().toLowerCase();
  const isBusinessAccount = accountType === "business";

  // Load user data on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        // Fetch from API using the new /api/profile endpoint
        const response = await getUserProfile();
        if (response.success && response.data) {
          const profileData = response.data;
          
          // Ensure all data is properly mapped for display in the first section
          const mappedUserData: Record<string, unknown> = {
            ...profileData,
            user_firstname: profileData.user_firstname || "",
            user_lastname: profileData.user_lastname || "",
            user_gender: profileData.user_gender || "",
            user_email: profileData.user_email || "",
            user_phone: profileData.user_phone || "",
            nin_number: profileData.nin_number || "",
            address: profileData.address || "",
            // Business fields
            business_name: profileData.business_name || "",
            business_type: profileData.business_type || "",
            business_email: profileData.business_email || "",
            business_phone: profileData.business_phone || "",
            business_location: profileData.business_location || "",
            CAC_number: profileData.CAC_number || "",
            // Display name for header
            display_name: profileData.display_name || 
              (profileData.business_name || 
               `${profileData.user_firstname || ""} ${profileData.user_lastname || ""}`.trim() || 
               "User"),
            full_name: profileData.full_name || 
              `${profileData.user_firstname || ""} ${profileData.user_lastname || ""}`.trim(),
          };
          
          // Set user data for display in the first user-profile__section
          setUserData(mappedUserData);
          
          // Set edited data for form fields
          setEditedData({
            user_firstname: profileData.user_firstname || "",
            user_lastname: profileData.user_lastname || "",
            user_gender: profileData.user_gender || "",
            user_email: profileData.user_email || "",
            user_phone: profileData.user_phone || "",
            nin_number: profileData.nin_number || "",
            address: profileData.address || "",
            // Business fields
            business_name: profileData.business_name || "",
            business_type: profileData.business_type || "",
            business_email: profileData.business_email || "",
            business_phone: profileData.business_phone || "",
            business_location: profileData.business_location || "",
            CAC_number: profileData.CAC_number || "",
          });
          
          if (profileData.user_picture) {
            setProfilePicture(profileData.user_picture);
          }
          
          // Update localStorage with fresh data from database
          const currentUser = getUserData();
          if (currentUser) {
            const mergedUser = { ...currentUser, ...mappedUserData };
            localStorage.setItem("user", JSON.stringify(mergedUser));
          } else {
            localStorage.setItem("user", JSON.stringify(mappedUserData));
          }
          
          console.log("Profile data fetched and loaded into first section:", mappedUserData);
        } else {
          // Fallback to localStorage if API fails
          console.warn("API fetch failed, using localStorage fallback:", response.message);
          const user = getUserData();
          if (user) {
            setUserData(user);
            setEditedData({
              user_firstname: (user.user_firstname as string) || "",
              user_lastname: (user.user_lastname as string) || "",
              user_gender: (user.user_gender as string) || "",
              user_email: (user.user_email as string) || getUserEmail(),
              user_phone: (user.user_phone as string) || "",
              nin_number: (user.nin_number as string) || "",
              address: (user.address as string) || "",
              // Business fields
              business_name: (user.business_name as string) || "",
              business_type: (user.business_type as string) || "",
              business_email: (user.business_email as string) || "",
              business_phone: (user.business_phone as string) || "",
              business_location: (user.business_location as string) || "",
              CAC_number: (user.CAC_number as string) || "",
            });
            const storedPicture = localStorage.getItem("userProfilePicture");
            if (storedPicture) {
              setProfilePicture(storedPicture);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Fallback to localStorage
        const user = getUserData();
        if (user) {
          setUserData(user);
          setEditedData({
            user_firstname: (user.user_firstname as string) || "",
            user_lastname: (user.user_lastname as string) || "",
            user_gender: (user.user_gender as string) || "",
            user_email: (user.user_email as string) || getUserEmail(),
            user_phone: (user.user_phone as string) || "",
            nin_number: (user.nin_number as string) || "",
            address: (user.address as string) || "",
            // Business fields
            business_name: (user.business_name as string) || "",
            business_type: (user.business_type as string) || "",
            business_email: (user.business_email as string) || "",
            business_phone: (user.business_phone as string) || "",
            business_location: (user.business_location as string) || "",
            CAC_number: (user.CAC_number as string) || "",
          });
          const storedPicture = localStorage.getItem("userProfilePicture");
          if (storedPicture) {
            setProfilePicture(storedPicture);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (userData) {
      setEditedData({
        user_firstname: (userData.user_firstname as string) || "",
        user_lastname: (userData.user_lastname as string) || "",
        user_gender: (userData.user_gender as string) || "",
        user_email: (userData.user_email as string) || getUserEmail(),
        user_phone: (userData.user_phone as string) || "",
        nin_number: (userData.nin_number as string) || "",
        address: (userData.address as string) || "",
        // Business fields
        business_name: (userData.business_name as string) || "",
        business_type: (userData.business_type as string) || "",
        business_email: (userData.business_email as string) || "",
        business_phone: (userData.business_phone as string) || "",
        business_location: (userData.business_location as string) || "",
        CAC_number: (userData.CAC_number as string) || "",
      });
    }
  };

  const handleSave = async () => {
    try {
      // Update local state
      const updatedData = {
        ...userData,
        user_firstname: editedData.user_firstname,
        user_lastname: editedData.user_lastname,
        user_gender: editedData.user_gender,
        user_email: editedData.user_email,
        user_phone: editedData.user_phone,
        nin_number: editedData.nin_number,
        address: editedData.address,
        // Business fields
        business_name: editedData.business_name,
        business_type: editedData.business_type,
        business_email: editedData.business_email,
        business_phone: editedData.business_phone,
        business_location: editedData.business_location,
        CAC_number: editedData.CAC_number,
        display_name: isBusinessAccount
          ? editedData.business_name ||
            (userData?.business_name as string) ||
            "Business"
          : `${editedData.user_firstname} ${editedData.user_lastname}`.trim(),
      };
      setUserData(updatedData);

      // Update localStorage
      const currentUser = getUserData();
      if (currentUser) {
        const mergedUser = { ...currentUser, ...updatedData };
        localStorage.setItem("user", JSON.stringify(mergedUser));
      }

      // Update profile on backend
      try {
        const updatePayload = isBusinessAccount
          ? {
              business_name: editedData.business_name,
              business_type: editedData.business_type,
              business_email: editedData.business_email,
              business_phone: editedData.business_phone,
              business_location: editedData.business_location,
              CAC_number: editedData.CAC_number,
              user_phone: editedData.user_phone,
              address: editedData.address,
            }
          : {
              user_firstname: editedData.user_firstname,
              user_lastname: editedData.user_lastname,
              user_gender: editedData.user_gender,
              user_email: editedData.user_email,
              user_phone: editedData.user_phone,
              nin_number: editedData.nin_number,
              address: editedData.address,
            };

        await userApi.updateUserProfile(updatePayload);
      } catch (apiError) {
        console.error("API update error:", apiError);
        // Still update local state even if API fails
      }

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const showUploadBadge = (text: string, type: "success" | "error") => {
    setUploadStatus({ text, type });
    window.setTimeout(() => setUploadStatus(null), 3000);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      showUploadBadge("Invalid image file", "error");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showUploadBadge("Image must be under 5MB", "error");
      e.target.value = "";
      return;
    }

    const result = await uploadProfilePicture(file);
    if (result.success && result.user_picture) {
      setProfilePicture(result.user_picture);
      localStorage.setItem("userProfilePicture", result.user_picture);
      // Update stored user object so avatar shows elsewhere (feed, etc.)
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.user_picture = result.user_picture;
          user.profile_image_url = result.user_picture;
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (_) {
        // ignore
      }
      showUploadBadge("Profile picture saved to cloud", "success");
    } else {
      showUploadBadge(result.message || "Upload failed", "error");
    }
    e.target.value = "";
  };

  const triggerImageInput = () => {
    const fileInput = document.getElementById(
      "profile-picture-input"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userProfilePicture");
    localStorage.removeItem("accountType");

    // Clear any other user-related data
    localStorage.removeItem("userEventLists");
    localStorage.removeItem("events");

    setIsLogoutModalOpen(false);
    // Redirect to landing page
    navigate("/");
  };

  const getAccountTypeLabel = () => {
    const accountType = getUserAccountType().trim();
    return accountType || "Basic";
  };

  const getAccountTypeBadge = () => {
    const accountType = getUserAccountType().toLowerCase();
    const displayName = getUserAccountType();

    switch (accountType) {
      case "premium":
        return (
          <div className="user-profile__badge user-profile__badge--premium">
            <Crown size={16} />
            <span>{displayName}</span>
          </div>
        );
      case "verified":
        return (
          <div className="user-profile__badge user-profile__badge--verified">
            <CheckCircle size={16} />
            <span>{displayName}</span>
          </div>
        );
      case "business":
        return (
          <div className="user-profile__badge user-profile__badge--business">
            <Building2 size={16} />
            <span>{displayName}</span>
          </div>
        );
      default:
        return (
          <div className="user-profile__badge user-profile__badge--basic">
            <User size={16} />
            <span>{displayName}</span>
          </div>
        );
    }
  };

  const displayName = getUserName();
  const displayUserId = readNumericUserId(userData) || getUserId();

  const handleCopyUserId = async () => {
    const id = readNumericUserId(userData) || getUserId();
    if (!id) return;
    try {
      await navigator.clipboard.writeText(String(id));
      setUserIdCopied(true);
      window.setTimeout(() => setUserIdCopied(false), 2000);
    } catch {
      window.prompt("Copy user ID", String(id));
    }
  };

  return (
    <div className="user-profile-page">
      {uploadStatus && (
        <div
          className={`user-profile__upload-badge user-profile__upload-badge--${uploadStatus.type}`}
          role="status"
          aria-live="polite"
        >
          {uploadStatus.type === "success" ? <CheckCircle size={18} /> : <X size={18} />}
          <span>{uploadStatus.text}</span>
        </div>
      )}
      {/* Header Bar */}
      <header className="user-profile-header">
        <div className="user-profile-header__container">
          <div className="user-profile-header__left">
            <button
              className="user-profile-header__icon-btn"
              onClick={() => navigate(-1)}
              title="Go Back"
              style={{ marginRight: "8px" }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="user-profile-header__logo">
              <span>Profile</span>
            </div>
          </div>
        </div>
      </header>

      <div className="user-profile-container">
        <main className="user-profile-main">
          <div className="user-profile">
            <div className="user-profile__header">
              <div className="user-profile__avatar-container">
                <div className="user-profile__avatar-wrapper">
                  <div className="user-profile__avatar">
                    {profilePicture ? (
                      <LazyImage
                        src={profilePicture}
                        alt="User Avatar"
                        className="user-profile__avatar-img"
                      />
                    ) : (
                      <div className="user-profile__avatar-initials">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                  <button
                    className="user-profile__change-picture-btn"
                    onClick={triggerImageInput}
                    title="Change profile picture"
                  >
                    <Camera size={20} />
                  </button>
                  <input
                    id="profile-picture-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </div>
                {getAccountTypeBadge()}
              </div>
              <div className="user-profile__header-info">
                <h1 className="user-profile__name">
                  {isBusinessAccount
                    ? (userData?.business_name as string) ||
                      (userData?.display_name as string) ||
                      displayName ||
                      "Business"
                    : userData?.display_name
                    ? `${(userData.user_firstname as string) || ""} ${
                        (userData.user_lastname as string) || ""
                      }`.trim() || displayName
                    : displayName || "User"}
                </h1>
                <p className="user-profile__email">
                  {isBusinessAccount
                    ? (userData?.business_email as string) ||
                      (userData?.user_email as string) ||
                      getUserEmail() ||
                      "No email provided"
                    : (userData?.user_email as string) ||
                      getUserEmail() ||
                      "No email provided"}
                </p>
                {displayUserId > 0 && (
                  <div
                    className="user-profile__user-id-row"
                    role="group"
                    aria-label="Member ID"
                  >
                    <span className="user-profile__user-id-label">Member ID</span>
                    <code className="user-profile__user-id-value">
                      {formatMemberDisplayId(displayUserId)}
                    </code>
                    <span
                      className="user-profile__user-id-numeric"
                      title="Use this number when adding people in Forums (admin)"
                    >
                      #{displayUserId}
                    </span>
                    <button
                      type="button"
                      className="user-profile__user-id-copy"
                      onClick={() => void handleCopyUserId()}
                      title="Copy numeric account ID (for forums & invites)"
                      aria-label="Copy numeric account ID to clipboard"
                    >
                      <Copy size={16} aria-hidden />
                    </button>
                    {userIdCopied && (
                      <span className="user-profile__user-id-feedback" role="status">
                        Copied
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                className="user-profile__edit-btn"
                onClick={isEditing ? handleCancel : handleEdit}
              >
                {isEditing ? (
                  <>
                    <X size={18} />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit size={18} />
                    Edit Profile
                  </>
                )}
              </button>
            </div>

            <div className="user-profile__content">
              <div className="user-profile__section">
                <h2 className="user-profile__section-title">
                  {isBusinessAccount
                    ? "Business Information"
                    : "Personal Information"}
                </h2>
                {isLoading ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    Loading profile data...
                  </div>
                ) : (
                  <div className="user-profile__info-grid">
                    {isBusinessAccount ? (
                      <>
                        {/* Business Information Fields */}
                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <Building2 size={18} />
                            <span>Business Name</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="text"
                              name="business_name"
                              value={editedData.business_name}
                              onChange={handleInputChange}
                              className="user-profile__input"
                              placeholder="Enter business name"
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.business_name as string) || "Not set"}
                            </div>
                          )}
                        </div>

                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <Building2 size={18} />
                            <span>Business Type</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="text"
                              name="business_type"
                              value={editedData.business_type}
                              onChange={handleInputChange}
                              className="user-profile__input"
                              placeholder="Enter business type"
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.business_type as string) || "Not set"}
                            </div>
                          )}
                        </div>

                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <Mail size={18} />
                            <span>Business Email</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="email"
                              name="business_email"
                              value={editedData.business_email}
                              onChange={handleInputChange}
                              className="user-profile__input"
                              placeholder="Enter business email"
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.business_email as string) ||
                                (userData?.user_email as string) ||
                                "Not set"}
                            </div>
                          )}
                        </div>

                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <Phone size={18} />
                            <span>Business Phone</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="tel"
                              name="business_phone"
                              value={editedData.business_phone}
                              onChange={handleInputChange}
                              className="user-profile__input"
                              placeholder="Enter business phone"
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.business_phone as string) ||
                                (userData?.user_phone as string) ||
                                "Not set"}
                            </div>
                          )}
                        </div>

                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <MapPin size={18} />
                            <span>Business Location</span>
                          </div>
                          {isEditing ? (
                            <textarea
                              name="business_location"
                              value={editedData.business_location}
                              onChange={handleInputChange}
                              className="user-profile__input user-profile__input--textarea"
                              placeholder="Enter business location"
                              rows={3}
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.business_location as string) ||
                                (userData?.address as string) ||
                                "Not set"}
                            </div>
                          )}
                        </div>

                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <IdCard size={18} />
                            <span>CAC Number</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="text"
                              name="CAC_number"
                              value={editedData.CAC_number}
                              onChange={handleInputChange}
                              className="user-profile__input"
                              placeholder="Enter CAC number"
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.CAC_number as string) || "Not set"}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Personal Information Fields */}
                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <User size={18} />
                            <span>First Name</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="text"
                              name="user_firstname"
                              value={editedData.user_firstname}
                              onChange={handleInputChange}
                              className="user-profile__input"
                              placeholder="Enter first name"
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.user_firstname as string) ||
                                "Not set"}
                            </div>
                          )}
                        </div>

                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <User size={18} />
                            <span>Last Name</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="text"
                              name="user_lastname"
                              value={editedData.user_lastname}
                              onChange={handleInputChange}
                              className="user-profile__input"
                              placeholder="Enter last name"
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.user_lastname as string) || "Not set"}
                            </div>
                          )}
                        </div>

                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <VenusAndMars size={18} />
                            <span>Gender</span>
                          </div>
                          {isEditing ? (
                            <select
                              name="user_gender"
                              value={editedData.user_gender}
                              onChange={handleInputChange}
                              className="user-profile__input"
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                            </select>
                          ) : (
                            <div className="user-profile__info-value">
                              {(() => {
                                const gender =
                                  (userData?.user_gender as string) || "";
                                if (!gender) return "Not set";
                                return (
                                  gender.charAt(0).toUpperCase() +
                                  gender.slice(1)
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <Mail size={18} />
                            <span>Email Address</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="email"
                              name="user_email"
                              value={editedData.user_email}
                              onChange={handleInputChange}
                              className="user-profile__input"
                              placeholder="Enter email address"
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.user_email as string) ||
                                getUserEmail() ||
                                "Not set"}
                            </div>
                          )}
                        </div>

                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <Phone size={18} />
                            <span>Phone Number</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="tel"
                              name="user_phone"
                              value={editedData.user_phone}
                              onChange={handleInputChange}
                              className="user-profile__input"
                              placeholder="Enter phone number"
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.user_phone as string) || "Not set"}
                            </div>
                          )}
                        </div>

                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <IdCard size={18} />
                            <span>NIN Number</span>
                          </div>
                          {isEditing ? (
                            <input
                              type="text"
                              name="nin_number"
                              value={editedData.nin_number}
                              onChange={handleInputChange}
                              className="user-profile__input"
                              placeholder="Enter NIN number"
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.nin_number as string) || "Not set"}
                            </div>
                          )}
                        </div>

                        <div className="user-profile__info-item">
                          <div className="user-profile__info-label">
                            <MapPin size={18} />
                            <span>Address</span>
                          </div>
                          {isEditing ? (
                            <textarea
                              name="address"
                              value={editedData.address}
                              onChange={handleInputChange}
                              className="user-profile__input user-profile__input--textarea"
                              placeholder="Enter address"
                              rows={3}
                            />
                          ) : (
                            <div className="user-profile__info-value">
                              {(userData?.address as string) || "Not set"}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="user-profile__info-item">
                      <div className="user-profile__info-label">
                        <Shield size={18} />
                        <span>Account Type</span>
                      </div>
                      <div className="user-profile__info-value user-profile__info-value--account-type">
                        <span className="user-profile__account-type-text">
                          {getAccountTypeLabel()}
                        </span>
                      </div>
                    </div>

                    <div className="user-profile__info-item">
                      <div className="user-profile__info-label">
                        <Calendar size={18} />
                        <span>Account Created</span>
                      </div>
                      <div className="user-profile__info-value">
                        {formatDate(userData?.user_registered as string | undefined)}
                      </div>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="user-profile__actions">
                    <button
                      className="user-profile__save-btn"
                      onClick={handleSave}
                    >
                      <Save size={18} />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              {/* Logout Section */}
              <div className="user-profile__section">
                <h2 className="user-profile__section-title">Account Actions</h2>
                <div className="user-profile__logout-container">
                  <button
                    className="user-profile__logout-btn"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Logout?"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
        avatarUrl={profilePicture || undefined}
        avatarInitials={getUserInitials()}
      />
    </div>
  );
};

export default UserProfile;
