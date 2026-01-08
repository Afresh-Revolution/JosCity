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
import ApplicationCard from "../../components/ApplicationCard";
import NewsFeedHeader from "./NewsFeedHeader";
import FindFriendsModal from "../../components/FindFriendsModal";
import CreateJobModal from "../../components/CreateJobModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import JobApplicationModal from "../../components/JobApplicationModal";
import {
  getProfileUsername,
  getUserAccountType,
  getUserName,
} from "../../utils/userUtils";

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
  applicationFormFields?: any[];
  category?: string;
  createdAt: string;
}

const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"discover" | "applications">(
    "discover"
  );
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [createdJobs, setCreatedJobs] = useState<CreatedJob[]>([]);
  const [jobSuccessBadge, setJobSuccessBadge] = useState<{
    text: string;
    type?: "success" | "error";
  } | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [jobToApply, setJobToApply] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [applications, setApplications] = useState<any[]>([]);
  // Sidebar and filter states (for personal accounts only)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories] = useState<string[]>([
    "All",
    "Admin & Office",
    "Arts & Designs",
    "Business & Operations",
    "Cleaning & Facilities",
    "Community & Social Service",
    "Computer & Data",
    "Constructions & Mining",
    "Education",
    "Farming & Forestry",
    "Healthcare",
    "Installation & maintenance Repair",
    "Legal",
    "management",
    "Manufacturing",
    "Media & Communication",
    "Personal Care",
    "Protective Service",
    "Restaurant & hospitality",
    "Retail & Sales",
    "Science & Engineering",
    "Sports & Entertainment",
    "Transportation",
  ]);

  // Modal/Panel states
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [notifications] = useState<any[]>([]); // Empty notifications for now

  // Calculate unread notifications count
  const unreadNotificationsCount = notifications.filter(
    (n) => !n.isRead
  ).length;

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

  // Filter created jobs based on search query and category (for personal accounts)
  const filteredCreatedJobs = useMemo(() => {
    let filtered = createdJobs;

    // Filter by category if not "All" and user is personal account
    if (!isBusinessAccount && selectedCategory !== "All") {
      filtered = filtered.filter((job) => {
        const jobCategory = job.category?.toLowerCase() || "";
        const categoryLower = selectedCategory.toLowerCase();
        return (
          jobCategory === categoryLower || jobCategory.includes(categoryLower)
        );
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((job) => {
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
    }

    return filtered;
  }, [createdJobs, searchQuery, selectedCategory, isBusinessAccount]);

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
              category: jobData.category || "Other",
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
      setJobSuccessBadge({
        text: "Job updated successfully!",
        type: "success",
      });
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
        category: jobData.category || "Other",
        customFields: jobData.customFields || [],
        applicationFormFields: jobData.applicationFormFields || [],
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
      setJobSuccessBadge({
        text: "Job created successfully!",
        type: "success",
      });
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

  // Handle job application - open modal
  const handleJobApply = (jobId: string) => {
    // Check if already applied
    if (appliedJobs.has(jobId)) {
      return;
    }
    setJobToApply(jobId);
    setIsApplicationModalOpen(true);
  };

  // Handle application form submission
  const handleApplicationSubmit = (applicationData: any) => {
    if (!jobToApply) return;

    try {
      const job = createdJobs.find((j) => j.id === jobToApply);
      if (!job) return;

      // Create application object
      const application = {
        id: `app-${Date.now()}`,
        jobId: jobToApply,
        jobRole: job.role,
        jobCompany: job.companyName || getUserName(),
        applicantName: applicationData.fullName,
        applicantEmail: applicationData.email,
        applicantPhone: applicationData.phoneNumber,
        applicantAddress: applicationData.currentAddress,
        educationStatus: applicationData.educationStatus,
        role: applicationData.role,
        motivation: applicationData.motivation,
        attachment: applicationData.attachment?.name || null,
        workRemotely: applicationData.workRemotely,
        customFields: applicationData.customFields || {},
        status: "pending", // pending, accepted, rejected
        appliedAt: new Date().toISOString(),
      };

      // Save application to localStorage
      const existingApplications = JSON.parse(
        localStorage.getItem("jobApplications") || "[]"
      );
      const updatedApplications = [...existingApplications, application];
      localStorage.setItem(
        "jobApplications",
        JSON.stringify(updatedApplications)
      );

      // Update applications state for business accounts
      if (isBusinessAccount) {
        setApplications(updatedApplications);
      }

      // Add to applied jobs
      const newAppliedJobs = new Set(appliedJobs);
      newAppliedJobs.add(jobToApply);
      setAppliedJobs(newAppliedJobs);

      // Save applied jobs to localStorage
      localStorage.setItem(
        "appliedJobs",
        JSON.stringify(Array.from(newAppliedJobs))
      );

      // Show success badge
      setJobSuccessBadge({
        text: "Application submitted successfully!",
        type: "success",
      });
      setTimeout(() => setJobSuccessBadge(null), 3000);

      // Close modal
      setIsApplicationModalOpen(false);
      setJobToApply(null);
    } catch (error) {
      console.error("Error submitting application:", error);
      // Show error badge
      setJobSuccessBadge({
        text: "Failed to submit application. Please try again.",
        type: "error",
      });
      setTimeout(() => setJobSuccessBadge(null), 3000);
    }
  };

  // Handle application accept
  const handleApplicationAccept = (applicationId: string) => {
    try {
      const updatedApplications = applications.map((app: any) =>
        app.id === applicationId ? { ...app, status: "accepted" } : app
      );
      setApplications(updatedApplications);
      localStorage.setItem(
        "jobApplications",
        JSON.stringify(updatedApplications)
      );

      setJobSuccessBadge({
        text: "Application accepted successfully!",
        type: "success",
      });
      setTimeout(() => setJobSuccessBadge(null), 3000);
    } catch (error) {
      console.error("Error accepting application:", error);
      setJobSuccessBadge({
        text: "Failed to accept application. Please try again.",
        type: "error",
      });
      setTimeout(() => setJobSuccessBadge(null), 3000);
    }
  };

  // Handle application reject
  const handleApplicationReject = (applicationId: string) => {
    try {
      const updatedApplications = applications.map((app: any) =>
        app.id === applicationId ? { ...app, status: "rejected" } : app
      );
      setApplications(updatedApplications);
      localStorage.setItem(
        "jobApplications",
        JSON.stringify(updatedApplications)
      );

      setJobSuccessBadge({
        text: "Application rejected.",
        type: "success",
      });
      setTimeout(() => setJobSuccessBadge(null), 3000);
    } catch (error) {
      console.error("Error rejecting application:", error);
      setJobSuccessBadge({
        text: "Failed to reject application. Please try again.",
        type: "error",
      });
      setTimeout(() => setJobSuccessBadge(null), 3000);
    }
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
      setJobSuccessBadge({
        text: "Job deleted successfully!",
        type: "success",
      });
      setTimeout(() => setJobSuccessBadge(null), 3000);

      // Close modal and reset
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    } catch (error) {
      console.error("Error deleting job:", error);

      // Show failed badge
      setJobSuccessBadge({
        text: "Failed to delete job. Please try again.",
        type: "error",
      });
      setTimeout(() => setJobSuccessBadge(null), 3000);

      // Close modal
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    }
  };

  return (
    <div className="jobs-page">
      {jobSuccessBadge && (
        <div
          className={`jobs-success-badge ${
            jobSuccessBadge.type === "error" ? "jobs-success-badge--error" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {jobSuccessBadge.type === "error" ? (
            <XCircle size={18} />
          ) : (
            <CheckCircle size={18} />
          )}
          <span>{jobSuccessBadge.text}</span>
        </div>
      )}
      {/* Top Navigation Bar - Using NewsFeed Header */}
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => {
          if (!isBusinessAccount) {
            setIsLeftSidebarOpen(!isLeftSidebarOpen);
          }
        }}
        onProfileClick={handleProfileClick}
        onNotificationClick={handleNotificationClick}
        onMessageClick={handleMessageClick}
        onAddFriendClick={handleAddFriendClick}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="jobs-container">
        {/* Hero/Banner Section */}
        <section
          className="jobs-hero"
          style={{ backgroundImage: `url(${moviesBg})` }}
        >
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
                  activeTab === "discover" ? "jobs-tabs__item--active" : ""
                }`}
                onClick={() => setActiveTab("discover")}
              >
                Discover
              </button>
              {isBusinessAccount && (
                <button
                  className={`jobs-tabs__item ${
                    activeTab === "applications"
                      ? "jobs-tabs__item--active"
                      : ""
                  }`}
                  onClick={() => setActiveTab("applications")}
                >
                  Applications
                </button>
              )}
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
            {/* Left Sidebar - Categories (Personal accounts only) */}
            {!isBusinessAccount && (
              <aside
                className={`jobs-sidebar ${
                  isLeftSidebarOpen ? "jobs-sidebar--open" : ""
                }`}
              >
                <button
                  className="jobs-sidebar__close"
                  onClick={() => setIsLeftSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <X size={20} />
                </button>
                <nav className="jobs-sidebar__nav">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`jobs-sidebar__item ${
                        selectedCategory === category
                          ? "jobs-sidebar__item--active"
                          : ""
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </nav>
              </aside>
            )}

            {/* Main Content Area */}
            <main className={!isBusinessAccount ? "jobs-content" : ""}>
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
              ) : activeTab === "applications" ? (
                <div className="jobs-applications">
                  {applications.filter((app) =>
                    createdJobs.some((job) => job.id === app.jobId)
                  ).length === 0 ? (
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
                      <h2 className="jobs-empty__title">No Applications</h2>
                      <p className="jobs-empty__message">
                        You haven't received any applications yet.
                      </p>
                    </div>
                  ) : (
                    <div className="jobs-applications-grid">
                      {applications
                        .filter((app) =>
                          createdJobs.some((job) => job.id === app.jobId)
                        )
                        .map((application) => (
                          <ApplicationCard
                            key={application.id}
                            application={application}
                            onAccept={(appId) => handleApplicationAccept(appId)}
                            onReject={(appId) => handleApplicationReject(appId)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="jobs-listing-grid">
                  {/* Show created jobs - different behavior for business vs personal accounts */}
                  {filteredCreatedJobs.length === 0 &&
                  filteredJobs.length === 0 ? (
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
                        {searchQuery.trim()
                          ? "No Jobs Found"
                          : isBusinessAccount
                          ? "No Jobs Created"
                          : "No Jobs Available"}
                      </h2>
                      <p className="jobs-empty__message">
                        {searchQuery.trim()
                          ? "Try adjusting your search terms."
                          : isBusinessAccount
                          ? "Create your first job posting to get started."
                          : "There are no job postings available at the moment."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Display created jobs */}
                      {filteredCreatedJobs.map((job) => (
                        <JobListingCard
                          key={job.id}
                          job={job}
                          onEdit={isBusinessAccount ? handleJobEdit : undefined}
                          onDelete={
                            isBusinessAccount ? handleJobDelete : undefined
                          }
                          onApply={
                            !isBusinessAccount ? handleJobApply : undefined
                          }
                          showApplyButton={!isBusinessAccount}
                        />
                      ))}
                      {/* Display API jobs if any */}
                      {filteredJobs.length > 0 && (
                        <div className="jobs-grid">
                          {filteredJobs.map((job) => (
                            <JobCard
                              key={job.id}
                              job={{
                                id:
                                  typeof job.id === "string"
                                    ? parseInt(job.id, 10) || 0
                                    : job.id || 0,
                                title: job.title,
                                image: job.image_url,
                                category: job.category,
                                company: job.company,
                                location: job.location,
                                type: job.type,
                                year:
                                  typeof job.year === "string"
                                    ? parseInt(job.year) || undefined
                                    : job.year,
                                rating:
                                  typeof job.rating === "number"
                                    ? job.rating
                                    : undefined,
                              }}
                              onClick={() => {
                                console.log("Clicked job:", job.title);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
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
        initialData={
          editingJobId
            ? createdJobs.find((job) => job.id === editingJobId) || undefined
            : undefined
        }
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

      {/* Job Application Modal */}
      {jobToApply &&
        (() => {
          const job = createdJobs.find((j) => j.id === jobToApply);
          const jobRole = job?.role || "";
          const isRoleFixed = !!jobRole && !isBusinessAccount;

          return (
            <JobApplicationModal
              isOpen={isApplicationModalOpen}
              onClose={() => {
                setIsApplicationModalOpen(false);
                setJobToApply(null);
              }}
              onSubmit={handleApplicationSubmit}
              jobRole={jobRole}
              isRoleFixed={isRoleFixed}
            />
          );
        })()}

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
