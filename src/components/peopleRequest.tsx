import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  SquarePlus,
  UserPlus,
  MessageCircle,
  Bell,
  Menu,
  X,
  ArrowLeft,
  Users,
  MapPin,
  Briefcase,
  Calendar,
} from "lucide-react";
import primaryLogo from "../image/primary-logo.png";
import headerAvatar from "../image/newsfeed/blessing.jpg";
import LazyImage from "./LazyImage";
import Avatar from "./Avatar";
import { getProfileUsername, getUserName } from "../utils/userUtils";
import "../main.css";

const PeopleRequest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

  // Handle profile navigation
  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  return (
    <div
      className="people-page"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Top Navigation Bar */}
      <header className="newsfeed-header">
        <div className="newsfeed-header__container">
          <div className="newsfeed-header__left">
            <button
              className="newsfeed-header__menu-toggle"
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              aria-label="Toggle menu"
            >
              {isLeftSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="newsfeed-header__logo">
              <LazyImage src={primaryLogo} alt="JOSCity Logo" />
              <span>JOSCity</span>
            </div>
          </div>
          <div className="newsfeed-header__actions">
            <button className="newsfeed-header__icon-btn" title="Create">
              <SquarePlus size={20} />
            </button>
            <button className="newsfeed-header__icon-btn" title="Add Friend">
              <UserPlus size={20} />
            </button>
            <button className="newsfeed-header__icon-btn" title="Messages">
              <MessageCircle size={20} />
            </button>
            <button
              className="newsfeed-header__icon-btn newsfeed-header__icon-btn--notifications"
              title="Notifications"
            >
              <Bell size={20} />
            </button>
            <button 
              className="newsfeed-header__join-btn"
              onClick={handleProfileClick}
              title="View Profile"
            >
              <div className="newsfeed-header__join-initials">
                <Avatar
                  name={getUserName()}
                  size={32}
                  className="newsfeed-header__join-avatar"
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: "2rem",
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/people")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "2rem",
            padding: "0.75rem 1.5rem",
            background: "#1c8e38",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#156d2a";
            e.currentTarget.style.transform = "translateX(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1c8e38";
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          <ArrowLeft size={18} />
          Back to People
        </button>

        {/* Profile Card */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {/* Profile Image */}
            <div
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                overflow: "hidden",
                background: "#f0f0f0",
                flexShrink: 0,
              }}
            >
              <LazyImage
                src={headerAvatar}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Profile Info */}
            <div style={{ flex: 1, minWidth: "250px" }}>
              <h1
                style={{
                  fontSize: "2rem",
                  margin: "0 0 0.5rem 0",
                  color: "#323232",
                }}
              >
                Person Profile
              </h1>
              <p style={{ color: "#666", margin: "0 0 1rem 0" }}>ID: {id}</p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#1c8e38",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <UserPlus size={18} />
                  Send Friend Request
                </button>
                <button
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "white",
                    color: "#1c8e38",
                    border: "2px solid #1c8e38",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <MessageCircle size={18} />
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              margin: "0 0 1.5rem 0",
              color: "#323232",
            }}
          >
            Details
          </h2>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <MapPin size={20} color="#1c8e38" />
              <div>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  Location
                </p>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    color: "#323232",
                    fontWeight: "500",
                  }}
                >
                  Jos, Plateau State, Nigeria
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Briefcase size={20} color="#1c8e38" />
              <div>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  Occupation
                </p>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    color: "#323232",
                    fontWeight: "500",
                  }}
                >
                  Software Developer
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Users size={20} color="#1c8e38" />
              <div>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  Mutual Friends
                </p>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    color: "#323232",
                    fontWeight: "500",
                  }}
                >
                  12 mutual friends
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Calendar size={20} color="#1c8e38" />
              <div>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  Joined
                </p>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    color: "#323232",
                    fontWeight: "500",
                  }}
                >
                  January 2024
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeopleRequest;
