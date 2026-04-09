import React from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TrendingSection from "./TrendingSection";
import SuggestedFriends from "./SuggestedFriends";
import SuggestedBusinesses from "./SuggestedBusinesses";
import { getUserAccountType } from "../../utils/userUtils";

export interface NewsfeedRightAsideProps {
  isOpen: boolean;
  onClose: () => void;
  trending: Array<{ hashtag: string; posts: number }>;
  onHashtagClick: (hashtag: string) => void;
  /** Default: friends (news feed). Business section uses nearby business accounts only. */
  suggestedSection?: "friends" | "businesses";
}

const NewsfeedRightAside: React.FC<NewsfeedRightAsideProps> = ({
  isOpen,
  onClose,
  trending,
  onHashtagClick,
  suggestedSection = "friends",
}) => {
  const navigate = useNavigate();
  const isBusinessAccount =
    getUserAccountType().toLowerCase() === "business";
  const showSuggestedBusinesses = suggestedSection === "businesses";
  const asideTitle = showSuggestedBusinesses
    ? "Trending & Businesses"
    : isBusinessAccount
      ? "Trending & Businesses"
      : "Trending & Friends";

  return (
    <aside
      className={`newsfeed-aside ${
        isOpen ? "newsfeed-aside--open" : ""
      }`}
    >
      <div className="newsfeed-aside__header">
        <h3>{asideTitle}</h3>
        <button
          type="button"
          className="newsfeed-aside__close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>
      <TrendingSection trending={trending} onHashtagClick={onHashtagClick} />
      {showSuggestedBusinesses ? (
        <SuggestedBusinesses businesses={[]} />
      ) : (
        <SuggestedFriends friends={[]} />
      )}
      <footer className="newsfeed-footer">
        <p>© 2026 JOSCity</p>
        <div className="newsfeed-footer__links">
          <a
            href="/about"
            onClick={(e) => {
              e.preventDefault();
              navigate("/about", { state: { fromNewsfeed: true } });
            }}
          >
            About
          </a>
          <a
            href="/terms-of-service"
            onClick={(e) => {
              e.preventDefault();
              navigate("/terms-of-service", {
                state: { fromNewsfeed: true },
              });
            }}
          >
            Terms
          </a>
          <a
            href="/privacy-policy"
            onClick={(e) => {
              e.preventDefault();
              navigate("/privacy-policy", {
                state: { fromNewsfeed: true },
              });
            }}
          >
            Privacy
          </a>
          <a
            href="/contact"
            onClick={(e) => {
              e.preventDefault();
              navigate("/contact", { state: { fromNewsfeed: true } });
            }}
          >
            Contact Us
          </a>
        </div>
      </footer>
    </aside>
  );
};

export default NewsfeedRightAside;
