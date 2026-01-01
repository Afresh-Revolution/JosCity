import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Shield,
  Calendar,
  ArrowLeft,
  Edit,
  Save,
  X,
  Camera,
  Phone,
  MapPin,
} from "lucide-react";
import "../main.css";
import "../scss/_admin.scss";
import userAvatar from "../image/sky.png";
import ProtectedRoute from "../components/ProtectedRoute";

const AdminProfile: React.FC = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState<Record<string, unknown> | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    display_name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [profilePicture, setProfilePicture] = useState<string>(userAvatar);

  // Load admin data on mount
  useEffect(() => {
    const adminDataStr = localStorage.getItem("adminData");
    if (adminDataStr) {
      try {
        const parsed = JSON.parse(adminDataStr);
        setAdminData(parsed);
        setEditedData({
          display_name: (parsed.display_name as string) || "",
          email: (parsed.email as string) || "",
          phone: (parsed.phone as string) || "",
          address: (parsed.address as string) || "",
        });
        // Load profile picture from localStorage if available
        const storedPicture = localStorage.getItem("adminProfilePicture");
        if (storedPicture) {
          setProfilePicture(storedPicture);
        }
      } catch (e) {
        console.error("Failed to parse admin data:", e);
      }
    }
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({
      display_name: (adminData?.display_name as string) || "",
      email: (adminData?.email as string) || "",
      phone: (adminData?.phone as string) || "",
      address: (adminData?.address as string) || "",
    });
  };

  const handleSave = () => {
    // Update local state
    const updatedData = {
      ...adminData,
      display_name: editedData.display_name,
      email: editedData.email,
      phone: editedData.phone,
      address: editedData.address,
    };
    setAdminData(updatedData);

    // Update localStorage
    localStorage.setItem("adminData", JSON.stringify(updatedData));

    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      // Read file as data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfilePicture(result);
        // Store in localStorage
        localStorage.setItem("adminProfilePicture", result);
        alert("Profile picture updated successfully!");
      };
      reader.onerror = () => {
        alert("Error reading image file");
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow selecting the same file again
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

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="admin-page">
        {/* Header Bar */}
        <header className="admin-header">
          <div className="admin-header__container">
            <div className="admin-header__left">
              <button
                className="admin-header__icon-btn"
                onClick={() => navigate("/admin")}
                title="Back to Dashboard"
                style={{ marginRight: "8px" }}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="admin-header__logo">
                <span>Admin Profile</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-container">
          <main className="admin-main">
            <div className="admin-profile">
              <div className="admin-profile__header">
                <div className="admin-profile__avatar-container">
                  <div className="admin-profile__avatar-wrapper">
                    <div className="admin-profile__avatar">
                      <img
                        src={profilePicture}
                        alt="Admin Avatar"
                        width={120}
                        height={120}
                      />
                    </div>
                    <button
                      className="admin-profile__change-picture-btn"
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
                  <div className="admin-profile__badge">
                    <Shield size={16} />
                    <span>Administrator</span>
                  </div>
                </div>
                <div className="admin-profile__header-info">
                  <h1 className="admin-profile__name">
                    {(adminData?.display_name as string) ||
                      (adminData?.email as string) ||
                      "Admin User"}
                  </h1>
                  <p className="admin-profile__email">
                    {(adminData?.email as string) || "No email provided"}
                  </p>
                </div>
                <button
                  className="admin-profile__edit-btn"
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

              <div className="admin-profile__content">
                <div className="admin-profile__section">
                  <h2 className="admin-profile__section-title">
                    Personal Information
                  </h2>
                  <div className="admin-profile__info-grid">
                    <div className="admin-profile__info-item">
                      <div className="admin-profile__info-label">
                        <User size={18} />
                        <span>Display Name</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          name="display_name"
                          value={editedData.display_name}
                          onChange={handleInputChange}
                          className="admin-profile__input"
                          placeholder="Enter display name"
                        />
                      ) : (
                        <div className="admin-profile__info-value">
                          {(adminData?.display_name as string) || "Not set"}
                        </div>
                      )}
                    </div>

                    <div className="admin-profile__info-item">
                      <div className="admin-profile__info-label">
                        <Mail size={18} />
                        <span>Email Address</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={editedData.email}
                          onChange={handleInputChange}
                          className="admin-profile__input"
                          placeholder="Enter email address"
                        />
                      ) : (
                        <div className="admin-profile__info-value">
                          {(adminData?.email as string) || "Not set"}
                        </div>
                      )}
                    </div>

                    <div className="admin-profile__info-item">
                      <div className="admin-profile__info-label">
                        <Phone size={18} />
                        <span>Phone Number</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={editedData.phone}
                          onChange={handleInputChange}
                          className="admin-profile__input"
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <div className="admin-profile__info-value">
                          {(adminData?.phone as string) || "Not set"}
                        </div>
                      )}
                    </div>

                    <div className="admin-profile__info-item">
                      <div className="admin-profile__info-label">
                        <MapPin size={18} />
                        <span>Address</span>
                      </div>
                      {isEditing ? (
                        <textarea
                          name="address"
                          value={editedData.address}
                          onChange={handleInputChange}
                          className="admin-profile__input admin-profile__input--textarea"
                          placeholder="Enter address"
                          rows={3}
                        />
                      ) : (
                        <div className="admin-profile__info-value">
                          {(adminData?.address as string) || "Not set"}
                        </div>
                      )}
                    </div>

                    <div className="admin-profile__info-item">
                      <div className="admin-profile__info-label">
                        <Shield size={18} />
                        <span>Role</span>
                      </div>
                      <div className="admin-profile__info-value admin-profile__info-value--role">
                        Administrator
                      </div>
                    </div>

                    <div className="admin-profile__info-item">
                      <div className="admin-profile__info-label">
                        <Calendar size={18} />
                        <span>Account Created</span>
                      </div>
                      <div className="admin-profile__info-value">
                        {formatDate(
                          adminData?.created_at as string | undefined
                        )}
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="admin-profile__actions">
                      <button
                        className="admin-profile__save-btn"
                        onClick={handleSave}
                      >
                        <Save size={18} />
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <div className="admin-profile__section">
                  <h2 className="admin-profile__section-title">
                    Account Security
                  </h2>
                  <div className="admin-profile__security-info">
                    <div className="admin-profile__security-item">
                      <Shield size={20} />
                      <div>
                        <h3>Two-Factor Authentication</h3>
                        <p>Add an extra layer of security to your account</p>
                      </div>
                      <button className="admin-profile__security-btn">
                        Enable
                      </button>
                    </div>
                    <div className="admin-profile__security-item">
                      <Shield size={20} />
                      <div>
                        <h3>Password</h3>
                        <p>
                          Last changed:{" "}
                          {formatDate(
                            adminData?.password_changed_at as string | undefined
                          )}
                        </p>
                      </div>
                      <button className="admin-profile__security-btn">
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminProfile;
