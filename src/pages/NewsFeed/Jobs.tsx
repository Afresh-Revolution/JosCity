import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, CheckCircle, XCircle } from "lucide-react";
import jobsImg from "../../image/jobs.png";
import moviesBg from "../../image/movies-bg.jpg";
import "../../main.css";
import "../../scss/_newsfeed.scss";
import "../../scss/_Jobs.scss";
import LazyImage from "../../components/LazyImage";
import JobCard from "../../components/JobCard";
import JobListingCard from "../../components/JobListingCard";
import NewsFeedHeader from "./NewsFeedHeader";
import FindFriendsModal from "../../components/FindFriendsModal";
import CreateJobModal from "../../components/CreateJobModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import { getProfileUsername, getUserAccountType, getUserName } from "../../utils/userUtils";

// API removed - using fallback data only
interface Job {
  id: string;
  title: string;
  year?: string;
  category: string;
  rating?: number;
  image_url: string;
  description?: string;
  company?: string;
  location?: string;
  type?: string;
  language?: string;
}

interface CreatedJob {
  id: string;
  role: string;
  jobDescription: string;
  jobRequirements: string;
  jobQualifications: string;
  jobDuration: string;
  applicationDeadline: string;
  companyName?: string;
  customFields?: any[];
  createdAt: string;
}

const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"jobs" | "application">("jobs");
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [createdJobs, setCreatedJobs] = useState<CreatedJob[]>([]);
  const [jobSuccessBadge, setJobSuccessBadge] = useState<{ text: string; type?: "success" | "error" } | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // Modal/Panel states
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [notifications] = useState<any[]>([]); // Empty notifications for now

  // Calculate unread notifications count
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // Handle profile navigation
  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  // Handle notification click
  const handleNotificationClick = () => {
    setIsNotificationPanelOpen(true);
  };

  // Handle message click
  const handleMessageClick = () => {
    setIsChatPanelOpen(true);
  };

  // Handle add friend click
  const handleAddFriendClick = () => {
    setIsAddFriendModalOpen(true);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is a business account
  const isBusinessAccount = getUserAccountType().toLowerCase() === "business";

  // Categories initialized with fallback data (API removed)
  // Categories are already set in useState above

  // Load created jobs from localStorage on mount
  useEffect(() => {
    try {
      const storedJobs = localStorage.getItem("createdJobs");
      if (storedJobs) {
        setCreatedJobs(JSON.parse(storedJobs));
      }
    } catch (error) {
      console.error("Error loading created jobs:", error);
    }
  }, []);

  // API removed - no data fetching, will show empty state
  useEffect(() => {
    setIsLoading(false);
    setAllJobs([]);
    setError(null);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search filtering is handled by useMemo below
  };

  // Filter created jobs based on search query
  const filteredCreatedJobs = useMemo(() => {
    if (!searchQuery.trim()) {
      return createdJobs;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return createdJobs.filter((job) => {
      const role = job.role?.toLowerCase() || "";
      const companyName = job.companyName?.toLowerCase() || "";
      const description = job.jobDescription?.toLowerCase() || "";
      const requirements = job.jobRequirements?.toLowerCase() || "";
      const qualifications = job.jobQualifications?.toLowerCase() || "";
      
      return (
        role.includes(query) ||
        companyName.includes(query) ||
        description.includes(query) ||
        requirements.includes(query) ||
        qualifications.includes(query)
      );
    });
  }, [createdJobs, searchQuery]);

  // Filter API jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) {
      return allJobs;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return allJobs.filter((job) => {
      const title = job.title?.toLowerCase() || "";
      const company = job.company?.toLowerCase() || "";
      const description = job.description?.toLowerCase() || "";
      const category = job.category?.toLowerCase() || "";
      const location = job.location?.toLowerCase() || "";
      
      return (
        title.includes(query) ||
        company.includes(query) ||
        description.includes(query) ||
        category.includes(query) ||
        location.includes(query)
      );
    });
  }, [allJobs, searchQuery]);

  // Handle job creation
  const handleJobSubmit = (jobData: any) => {
    console.log("Job created:", jobData);
    console.log("Current createdJobs:", createdJobs);
    
    if (editingJobId) {
      // Update existing job
      const updatedJobs = createdJobs.map((job) =>
        job.id === editingJobId
          ? {
              ...job,
              role: jobData.role || "",
              jobDescription: jobData.jobDescription || "",
              jobRequirements: jobData.jobRequirements || "",
              jobQualifications: jobData.jobQualifications || "",
              jobDuration: jobData.jobDuration || "Contract",
              applicationDeadline: jobData.applicationDeadline || "",
              customFields: jobData.customFields || [],
            }
          : job
      );
      setCreatedJobs(updatedJobs);
      
      // Save to localStorage
      try {
        localStorage.setItem("createdJobs", JSON.stringify(updatedJobs));
        console.log("Updated job in localStorage");
      } catch (error) {
        console.error("Error updating job in localStorage:", error);
      }
      
      // Show success badge
      setJobSuccessBadge({ text: "Job updated successfully!", type: "success" });
      setTimeout(() => setJobSuccessBadge(null), 3000);
      setEditingJobId(null);
    } else {
      // Create new job
      const newJob: CreatedJob = {
        id: `job-${Date.now()}`,
        role: jobData.role || "",
        jobDescription: jobData.jobDescription || "",
        jobRequirements: jobData.jobRequirements || "",
        jobQualifications: jobData.jobQualifications || "",
        jobDuration: jobData.jobDuration || "Contract",
        applicationDeadline: jobData.applicationDeadline || "",
        companyName: getUserName(),
        customFields: jobData.customFields || [],
        createdAt: new Date().toISOString(),
      };

      const updatedJobs = [...createdJobs, newJob];
      console.log("Updated jobs:", updatedJobs);
      setCreatedJobs(updatedJobs);
      
      // Save to localStorage
      try {
        localStorage.setItem("createdJobs", JSON.stringify(updatedJobs));
        console.log("Saved to localStorage");
      } catch (error) {
        console.error("Error saving job to localStorage:", error);
      }
      
      // Show success badge
      setJobSuccessBadge({ text: "Job created successfully!", type: "success" });
      setTimeout(() => setJobSuccessBadge(null), 3000);
    }
  };

  // Handle job edit
  const handleJobEdit = (jobId: string) => {
    setEditingJobId(jobId);
    setIsCreateJobModalOpen(true);
  };

  // Handle job delete - show confirmation modal
  const handleJobDelete = (jobId: string) => {
    setJobToDelete(jobId);
    setIsDeleteModalOpen(true);
  };

  // Confirm and perform deletion
  const confirmDeleteJob = () => {
    if (!jobToDelete) return;

    try {
      const updatedJobs = createdJobs.filter((job) => job.id !== jobToDelete);
      setCreatedJobs(updatedJobs);
      
      // Update localStorage
      localStorage.setItem("createdJobs", JSON.stringify(updatedJobs));
      
      // Show success badge
      setJobSuccessBadge({ text: "Job deleted successfully!", type: "success" });
      setTimeout(() => setJobSuccessBadge(null), 3000);
      
      // Close modal and reset
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    } catch (error) {
      console.error("Error deleting job:", error);
      
      // Show failed badge
      setJobSuccessBadge({ text: "Failed to delete job. Please try again.", type: "error" });
      setTimeout(() => setJobSuccessBadge(null), 3000);
      
      // Close modal
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    }
  };

  return (
    <div className="jobs-page">
      {jobSuccessBadge && (
        <div className={`jobs-success-badge ${jobSuccessBadge.type === "error" ? "jobs-success-badge--error" : ""}`} role="status" aria-live="polite">
          {jobSuccessBadge.type === "error" ? <XCircle size={18} /> : <CheckCircle size={18} />}
          <span>{jobSuccessBadge.text}</span>
        </div>
      )}
      {/* Top Navigation Bar - Using NewsFeed Header */}
      <NewsFeedHeader
        isLeftSidebarOpen={false}
        onToggleLeftSidebar={() => {}}
        onProfileClick={handleProfileClick}
        onNotificationClick={handleNotificationClick}
        onMessageClick={handleMessageClick}
        onAddFriendClick={handleAddFriendClick}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="jobs-container">

        {/* Hero/Banner Section */}
        <section className="jobs-hero" style={{ backgroundImage: `url(${moviesBg})` }}>
          <div className="jobs-hero__content">
            <div className="jobs-hero__image">
              <LazyImage src={jobsImg} alt="Jobs Illustration" />
            </div>
            <div className="jobs-hero__text">
              <h1 className="jobs-hero__title">Jobs</h1>
              <p className="jobs-hero__subtitle">Discover new Job</p>
              <form onSubmit={handleSearch} className="jobs-hero__search">
                <input
                  type="text"
                  placeholder="Search for Job"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="jobs-hero__search-input"
                />
                <button
                  type="submit"
                  className="jobs-hero__search-icon"
                  aria-label="Search"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* White Rounded Card - Overlaps Hero and Contains Tabs */}
        <div className="jobs-tabs-card">
          <div className="jobs-tabs">
            <div className="jobs-tabs__left">
              <button
                className={`jobs-tabs__item ${
                  activeTab === "jobs" ? "jobs-tabs__item--active" : ""
                }`}
                onClick={() => setActiveTab("jobs")}
              >
                Jobs
              </button>
              <button
                className={`jobs-tabs__item ${
                  activeTab === "application" ? "jobs-tabs__item--active" : ""
                }`}
                onClick={() => setActiveTab("application")}
              >
                Application
              </button>
            </div>
            {isBusinessAccount && (
              <button
                className="jobs-content__filter-btn"
                onClick={() => setIsCreateJobModalOpen(true)}
              >
                <span className="jobs-content__filter-btn__icon-wrapper">
                  <Plus size={16} />
                </span>
                <span>Create Job</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories and Content Section (Light Gray Background) */}
        <div className="jobs-content-section">
        <div className="jobs-main-layout">
          {/* Main Content Area */}
          <main>
            {isLoading ? (
              <div className="jobs-empty">
                <div className="jobs-empty__icon">
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="spinning"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
                <h2 className="jobs-empty__title">Loading...</h2>
                <p className="jobs-empty__message">
                  Please wait while we fetch jobs.
                </p>
              </div>
            ) : error ? (
              <div className="jobs-empty">
                <div className="jobs-empty__icon">
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h2 className="jobs-empty__title">Error</h2>
                <p className="jobs-empty__message">{error}</p>
              </div>
            ) : activeTab === "jobs" ? (
              <div className="jobs-listing-grid">
                {filteredCreatedJobs.length === 0 ? (
                  <div className="jobs-empty">
                    <div className="jobs-empty__icon">
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <circle cx="17.5" cy="17.5" r="3.5" />
                        <path d="M17.5 14v7M17.5 14h7" />
                      </svg>
                    </div>
                    <h2 className="jobs-empty__title">
                      {searchQuery.trim() ? "No Jobs Found" : "No Jobs Created"}
                    </h2>
                    <p className="jobs-empty__message">
                      {searchQuery.trim()
                        ? "Try adjusting your search terms."
                        : "Create your first job posting to get started."}
                    </p>
                  </div>
                ) : (
                  filteredCreatedJobs.map((job) => (
                    <JobListingCard
                      key={job.id}
                      job={job}
                      onEdit={handleJobEdit}
                      onDelete={handleJobDelete}
                    />
                  ))
                )}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="jobs-empty">
                <div className="jobs-empty__icon">
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <circle cx="17.5" cy="17.5" r="3.5" />
                    <path d="M17.5 14v7M17.5 14h7" />
                  </svg>
                </div>
                <h2 className="jobs-empty__title">No Data Found</h2>
                <p className="jobs-empty__message">
                  There is no data to show you right now.
                </p>
              </div>
            ) : (
              <div className="jobs-grid">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={{
                      id: typeof job.id === 'string' ? parseInt(job.id, 10) || 0 : job.id || 0,
                      title: job.title,
                      image: job.image_url,
                      category: job.category,
                      company: job.company,
                      location: job.location,
                      type: job.type,
                      year: typeof job.year === 'string' ? parseInt(job.year) || undefined : job.year,
                      rating: typeof job.rating === 'number' ? job.rating : undefined,
                    }}
                    onClick={() => {
                      // Handle job click - can navigate to job details page
                      console.log("Clicked job:", job.title);
                    }}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
        </div>
      </div>

      {/* Add Friend Modal */}
      <FindFriendsModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isCreateJobModalOpen}
        onClose={() => {
          setIsCreateJobModalOpen(false);
          setEditingJobId(null);
        }}
        onSubmit={handleJobSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setJobToDelete(null);
        }}
        onConfirm={confirmDeleteJob}
        title="Delete Job"
        message="Are you sure you want to delete this job? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
      />

      {/* Chat Panel */}
      {isChatPanelOpen && (
        <div
          className="newsfeed-chat-panel-overlay"
          onClick={() => setIsChatPanelOpen(false)}
        >
          <div
            className="newsfeed-chat-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="newsfeed-chat-panel__header">
              <h3>Messages</h3>
              <button
                className="newsfeed-chat-panel__close"
                onClick={() => setIsChatPanelOpen(false)}
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>
            <div className="newsfeed-chat-panel__content">
              <div className="newsfeed-chat-panel__empty">
                <p>No messages yet</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      {isNotificationPanelOpen && (
        <div
          className="newsfeed-notification-panel-overlay"
          onClick={() => setIsNotificationPanelOpen(false)}
        >
          <div
            className="newsfeed-notification-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="newsfeed-notification-panel__header">
              <h3>Notifications</h3>
              <button
                className="newsfeed-notification-panel__close"
                onClick={() => setIsNotificationPanelOpen(false)}
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>
            <div className="newsfeed-notification-panel__content">
              <div className="newsfeed-notification-panel__empty">
                <p>No notifications</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;