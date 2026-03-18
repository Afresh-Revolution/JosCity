import React from "react";
import { X, UserPlus, MessageCircle, MoreVertical, MapPin, Calendar, Briefcase, Mail, Phone } from "lucide-react";
import Avatar from "./Avatar";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  userAvatar: string;
  isOnline?: boolean;
  onMessage?: () => void;
  onAddFriend?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  isOnline = false,
  onMessage,
  onAddFriend,
}) => {
  if (!isOpen) return null;

  // Mock profile data - in real app, this would come from API
  const profileData = {
    bio: "Passionate about technology and innovation. Always learning and growing!",
    location: "Lagos, Nigeria",
    joinedDate: "January 2023",
    occupation: "Software Developer",
    email: "user@example.com",
    phone: "+234 123 456 7890",
    posts: 42,
    friends: 156,
    photos: 89,
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal__header">
          <h2 className="profile-modal__title">Profile</h2>
          <button className="profile-modal__close" onClick={onClose} aria-label="Close profile">
            <X size={24} />
          </button>
        </div>

        <div className="profile-modal__content">
          <div className="profile-modal__cover">
            <div className="profile-modal__cover-image"></div>
          </div>

          <div className="profile-modal__profile-section">
            <div className="profile-modal__avatar-wrapper">
              <Avatar
                src={userAvatar}
                name={userName}
                size={120}
                className="profile-modal__avatar"
                showBorder={true}
              />
              {isOnline && <span className="profile-modal__online-indicator"></span>}
            </div>

            <div className="profile-modal__user-info">
              <h3 className="profile-modal__user-name">{userName}</h3>
              <p className="profile-modal__user-status">{isOnline ? "Online" : "Offline"}</p>
            </div>

            <div className="profile-modal__actions">
              <button
                className="profile-modal__action-btn profile-modal__action-btn--primary"
                onClick={() => {
                  if (onMessage) onMessage();
                  onClose();
                }}
              >
                <MessageCircle size={18} />
                <span>Message</span>
              </button>
              <button
                className="profile-modal__action-btn"
                onClick={() => {
                  if (onAddFriend) onAddFriend();
                }}
              >
                <UserPlus size={18} />
                <span>Add Friend</span>
              </button>
              <button className="profile-modal__action-btn">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          <div className="profile-modal__stats">
            <div className="profile-modal__stat-item">
              <span className="profile-modal__stat-value">{profileData.posts}</span>
              <span className="profile-modal__stat-label">Posts</span>
            </div>
            <div className="profile-modal__stat-item">
              <span className="profile-modal__stat-value">{profileData.friends}</span>
              <span className="profile-modal__stat-label">Friends</span>
            </div>
            <div className="profile-modal__stat-item">
              <span className="profile-modal__stat-value">{profileData.photos}</span>
              <span className="profile-modal__stat-label">Photos</span>
            </div>
          </div>

          <div className="profile-modal__details">
            {profileData.bio && (
              <div className="profile-modal__detail-item">
                <p className="profile-modal__bio">{profileData.bio}</p>
              </div>
            )}

            <div className="profile-modal__detail-item">
              <MapPin size={18} />
              <span>{profileData.location}</span>
            </div>

            <div className="profile-modal__detail-item">
              <Briefcase size={18} />
              <span>{profileData.occupation}</span>
            </div>

            <div className="profile-modal__detail-item">
              <Calendar size={18} />
              <span>Joined {profileData.joinedDate}</span>
            </div>

            <div className="profile-modal__detail-item">
              <Mail size={18} />
              <span>{profileData.email}</span>
            </div>

            <div className="profile-modal__detail-item">
              <Phone size={18} />
              <span>{profileData.phone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

