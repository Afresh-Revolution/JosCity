import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Bookmark,
  Briefcase,
  Users,
  Calendar as Events,
  Film,
  Newspaper,
  MessageSquare,
  Store,
  Tag,
  Briefcase as Jobs,
  Video,
  Flag,
  X,
} from 'lucide-react';

import ReportModal from "../../components/ReportModal";

interface NewsFeedSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NewsFeedSidebar: React.FC<NewsFeedSidebarProps> = ({ isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState<string>('newsfeed');
  const [reportOpen, setReportOpen] = useState(false);

  // Update active item based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/people') {
      setActiveItem('people');
    } else if (path === '/forums') {
      setActiveItem('forums');
    } else if (path === '/events') {
      setActiveItem('events');
    } else if (path === '/news') {
      setActiveItem('news');
    } else if (path === '/marketplace') {
      setActiveItem('marketplace');
    } else if (path === '/offers') {
      setActiveItem('offers');
    } else if (path === '/jobs') {
      setActiveItem('jobs');
    } else if (path === '/movies') {
      setActiveItem('movies');
    } else if (path === '/scheduled') {
      setActiveItem('scheduled');
    } else if (path === '/saved') {
      setActiveItem('saved');
    } else if (path === '/business') {
      setActiveItem('business');
    } else if (path === '/reels') {
      setActiveItem('reels');
    } else if (path === '/newsfeed' || path === '/') {
      setActiveItem('newsfeed');
    }
  }, [location.pathname]);

  const handlePeopleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setActiveItem('people');
    navigate('/people');
    // Close sidebar on mobile after clicking
    if (onClose) {
      onClose();
    }
  };

  const handleForumsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setActiveItem('forums');
    navigate('/forums');
    // Close sidebar on mobile after clicking
    if (onClose) {
      onClose();
    }
  };

  const handleNewsFeedClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setActiveItem('newsfeed');
    navigate('/newsfeed');
    // Close sidebar on mobile after clicking
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className={`newsfeed-sidebar ${isOpen ? 'newsfeed-sidebar--open' : ''}`}>
      <div className="newsfeed-sidebar__header">
        <h3 className="newsfeed-sidebar__title">Menu</h3>
        {onClose && (
          <button 
            className="newsfeed-sidebar__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="newsfeed-sidebar__nav">
        <div className="newsfeed-sidebar__section">
          <a
            href="/newsfeed"
            className={`newsfeed-sidebar__item ${activeItem === 'newsfeed' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={handleNewsFeedClick}
          >
            <Home size={20} />
            <span>News Feed</span>
          </a>
          <a
            href="/scheduled"
            className={`newsfeed-sidebar__item ${activeItem === 'scheduled' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveItem('scheduled');
              navigate('/scheduled');
              if (onClose) {
                onClose();
              }
            }}
          >
            <Calendar size={20} />
            <span>Scheduled</span>
          </a>
          <a
            href="/saved"
            className={`newsfeed-sidebar__item ${activeItem === 'saved' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveItem('saved');
              navigate('/saved');
              if (onClose) {
                onClose();
              }
            }}
          >
            <Bookmark size={20} />
            <span>Saved</span>
          </a>
        </div>

        <div className="newsfeed-sidebar__section">
          <h3 className="newsfeed-sidebar__section-title">EXPLORE</h3>
          <a
            href="/business"
            className={`newsfeed-sidebar__item ${activeItem === 'business' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveItem('business');
              navigate('/business');
              if (onClose) {
                onClose();
              }
            }}
          >
            <Briefcase size={20} />
            <span>Business</span>
          </a>
          <a
            href="/people"
            className={`newsfeed-sidebar__item ${activeItem === 'people' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={handlePeopleClick}
          >
            <Users size={20} />
            <span>People</span>
          </a>
          <a
            href="/events"
            className={`newsfeed-sidebar__item ${activeItem === 'events' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/events');
              if (onClose) {
                onClose();
              }
            }}
          >
            <Events size={20} />
            <span>Events</span>
          </a>
          <a
            href="/reels"
            className={`newsfeed-sidebar__item ${activeItem === 'reels' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveItem('reels');
              navigate('/reels');
              if (onClose) {
                onClose();
              }
            }}
          >
            <Video size={20} />
            <span>Reels</span>
          </a>
          <a
            href="/news"
            className={`newsfeed-sidebar__item ${activeItem === 'news' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveItem('news');
              navigate('/news');
              if (onClose) {
                onClose();
              }
            }}
          >
            <Newspaper size={20} />
            <span>News</span>
          </a>
          <a
            href="/forums"
            className={`newsfeed-sidebar__item ${activeItem === 'forums' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={handleForumsClick}
          >
            <MessageSquare size={20} />
            <span>Forums</span>
          </a>
          <a
            href="/marketplace"
            className={`newsfeed-sidebar__item ${activeItem === 'marketplace' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveItem('marketplace');
              navigate('/marketplace');
              if (onClose) {
                onClose();
              }
            }}
          >
            <Store size={20} />
            <span>Marketplace</span>
          </a>
          <a
            href="/offers"
            className={`newsfeed-sidebar__item ${activeItem === 'offers' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveItem('offers');
              navigate('/offers');
              if (onClose) {
                onClose();
              }
            }}
          >
            <Tag size={20} />
            <span>Offers</span>
          </a>
          <a
            href="/jobs"
            className={`newsfeed-sidebar__item ${activeItem === 'jobs' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveItem('jobs');
              navigate('/jobs');
              if (onClose) {
                onClose();
              }
            }}
          >
            <Jobs size={20} />
            <span>Jobs</span>
          </a>
          <a
            href="/movies"
            className={`newsfeed-sidebar__item ${activeItem === 'movies' ? 'newsfeed-sidebar__item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveItem('movies');
              navigate('/movies');
              if (onClose) {
                onClose();
              }
            }}
          >
            <Film size={20} />
            <span>Movies</span>
          </a>
          <button
            type="button"
            className="newsfeed-sidebar__item"
            onClick={() => setReportOpen(true)}
          >
            <Flag size={20} />
            <span>Report a safety concern</span>
          </button>
        </div>
      </nav>
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        contentType="general"
      />
    </aside>
  );
};

export default NewsFeedSidebar;

