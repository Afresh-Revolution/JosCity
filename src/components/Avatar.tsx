import React, { useState, useMemo } from "react";
import LazyImage from "./LazyImage";
import { getUserInitials, getInitialsFromName, getUserAvatar, getUserName } from "../utils/userUtils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: number | string;
  className?: string;
  showBorder?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  fontSize?: number | string;
  // For user data object (optional, for current user)
  userData?: {
    user_firstname?: string;
    user_lastname?: string;
    display_name?: string;
    name?: string;
    profile_image_url?: string;
    user_avatar?: string;
  } | null;
}


/**
 * Reusable Avatar component that displays user's profile picture or initials
 * 
 * @param src - Image URL for the avatar
 * @param alt - Alt text for the image
 * @param name - User's name (used for initials if no image)
 * @param size - Size of the avatar (number for pixels or string like "48px")
 * @param className - Additional CSS classes
 * @param showBorder - Whether to show a border
 * @param borderColor - Color of the border
 * @param backgroundColor - Background color for initials
 * @param fontSize - Font size for initials
 * @param userData - User data object (for current user, uses getUserInitials)
 */


const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User Avatar",
  name,
  size = 40,
  className = "",
  showBorder = false,
  borderColor = "#1a5d3a",
  backgroundColor = "#1a5d3a",
  fontSize,
  userData,
}) => {
  const [imageError, setImageError] = useState(false);
  

  // <Avatar
  //                       src={comment.userAvatar}
  //                       name={comment.userName}
  //                       size={32}
  //                       className="newsfeed-post__comment-avatar"
  //                     />


  // If src is not provided, try to get current user's avatar if name matches
  const avatarSrc = useMemo(() => {
    if (src && src.trim() !== "" && src !== "/placeholder-avatar.png") {
      return src;
    }
    // If no src provided and name matches current user, try to get current user's avatar
    if (name && name === getUserName()) {
      const currentUserAvatar = getUserAvatar();
      if (currentUserAvatar) {
        return currentUserAvatar;
      }
    }
    return null;
  }, [src, name]);
  
  // Determine if we should show image or initials
  const hasImage = !imageError && avatarSrc && avatarSrc.trim() !== "" && avatarSrc !== "/placeholder-avatar.png";
  
  // Get initials
  const getInitials = (): string => {
    // If userData is provided, use the utility function for current user
    if (userData) {
      return getUserInitials();
    }
    
    // Otherwise, generate from name using utility function
    return getInitialsFromName(name);
  };

  const sizeValue = typeof size === "number" ? `${size}px` : size;
  const fontSizeValue = fontSize 
    ? (typeof fontSize === "number" ? `${fontSize}px` : fontSize)
    : typeof size === "number" 
      ? `${Math.max(12, Math.floor(size * 0.4))}px` 
      : "16px";

  const avatarStyle: React.CSSProperties = {
    width: sizeValue,
    height: sizeValue,
    minWidth: sizeValue,
    minHeight: sizeValue,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: backgroundColor,
    border: showBorder ? `2px solid ${borderColor}` : "none",
    flexShrink: 0,
    position: "relative",
  };

  const initialsStyle: React.CSSProperties = {
    fontSize: fontSizeValue,
    fontWeight: 600,
    color: "white",
    textTransform: "uppercase",
    userSelect: "none",
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`avatar ${className}`} style={avatarStyle}>
      {hasImage ? (
        <LazyImage
          src={avatarSrc!}
          alt={alt}
          className="avatar__image"
          onError={handleImageError}
        />
      ) : (
        <div className="avatar__initials" style={initialsStyle}>
          {getInitials()}
        </div>
      )}
    </div>
  );
};

export default Avatar;

