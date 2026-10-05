
import { useEffect, useRef, useState } from "react";

import {
  Bell,
  ChevronDown,
  LogOut,
  Search,
  User,
  Pencil,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  getEmployees,
  getMyProjects,
  getAllProjects,
  getMyWorkReports,
  getAllWorkReports,
  getMyLeaves,
  getAllLeaves,
  getNotifications,
  getMyAttendance,
  getAllAttendance,
} from "../../services/dashboardService";

import "./Topbar.css";

function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Notification unread count
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const profileRef = useRef(null);

  const isHR = user?.role === "hr";

  // =========================================================
  // LOAD UNREAD NOTIFICATIONS
  // =========================================================

  useEffect(() => {
    const loadUnreadNotifications = async () => {
      try {
        const notifications = await getNotifications();

        const unread = (notifications || []).filter(
          (notification) => !notification.is_read
        );

        setUnreadNotifications(unread.length);
      } catch (error) {
        console.error("Notification loading failed:", error);
        setUnreadNotifications(0);
      }
    };

    if (user) {
      loadUnreadNotifications();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // User initials
  const getInitials = () => {
    if (!user?.full_name) return "U";

    return user.full_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0])
      .join("")
      .toUpperCase();
  };

  // Role label
  const getRoleName = () => {
    return isHR ? "HR Manager" : "Employee";
  };

  // =========================================================
  // SEARCH DATA
  // =========================================================

  const loadSearchData = async () => {
    if (!user) return;

    setSearchLoading(true);

    try {
      let results = [];

      if (isHR) {
        const [
          employees,
          projects,
          workReports,
          leaves,
          notifications,
          attendance,
        ] = await Promise.all([
          getEmployees(),
          getAllProjects(),
          getAllWorkReports(),
          getAllLeaves(),
          getNotifications(),
          getAllAttendance(),
        ]);

        results = [
          ...(employees || []).map((item) => ({
            id: `employee-${item.id}`,
            title: item.full_name || "Employee",
            subtitle:
              item.designation ||
              item.department ||
              item.email ||
              "Employee",
            type: "Employee",
            path: "/employees",
          })),

          ...(projects || []).map((item) => ({
            id: `project-${item.id}`,
            title: item.name || "Project",
            subtitle:
              item.description || "Project",
            type: "Project",
            path: "/projects",
          })),

          ...(workReports || []).map((item) => ({
            id: `report-${item.id}`,
            title:
              item.title ||
              item.description ||
              "Work Report",
            subtitle:
              item.tag ||
              `Completion: ${
                item.completion_percentage ?? 0
              }%`,
            type: "Work Report",
            path: "/work-reports",
          })),

          ...(leaves || []).map((item) => ({
            id: `leave-${item.id}`,
            title:
              item.leave_type ||
              item.reason ||
              "Leave Request",
            subtitle:
              item.status || "Leave",
            type: "Leave",
            path: "/leaves",
          })),

          ...(notifications || []).map((item) => ({
            id: `notification-${item.id}`,
            title:
              item.title ||
              "Notification",
            subtitle:
              item.message || "",
            type: "Notification",
            path: "/notifications",
          })),

          ...(attendance || []).map((item) => ({
            id: `attendance-${item.id}`,
            title:
              item.employee_name ||
              `Attendance #${item.id}`,
            subtitle:
              item.status || "Attendance",
            type: "Attendance",
            path: "/attendance",
          })),
        ];
      } else {
        const [
          projects,
          workReports,
          leaves,
          notifications,
          attendance,
        ] = await Promise.all([
          getMyProjects(),
          getMyWorkReports(),
          getMyLeaves(),
          getNotifications(),
          getMyAttendance(),
        ]);

        results = [
          ...(projects || []).map((item) => ({
            id: `project-${item.id}`,
            title: item.name || "Project",
            subtitle:
              item.description || "Project",
            type: "Project",
            path: "/projects",
          })),

          ...(workReports || []).map((item) => ({
            id: `report-${item.id}`,
            title:
              item.title ||
              item.description ||
              "Work Report",
            subtitle:
              item.tag ||
              `Completion: ${
                item.completion_percentage ?? 0
              }%`,
            type: "Work Report",
            path: "/work-reports",
          })),

          ...(leaves || []).map((item) => ({
            id: `leave-${item.id}`,
            title:
              item.leave_type ||
              item.reason ||
              "Leave Request",
            subtitle:
              item.status || "Leave",
            type: "Leave",
            path: "/leaves",
          })),

          ...(notifications || []).map((item) => ({
            id: `notification-${item.id}`,
            title:
              item.title ||
              "Notification",
            subtitle:
              item.message || "",
            type: "Notification",
            path: "/notifications",
          })),

          ...(attendance || []).map((item) => ({
            id: `attendance-${item.id}`,
            title:
              item.date ||
              `Attendance #${item.id}`,
            subtitle:
              item.status || "Attendance",
            type: "Attendance",
            path: "/attendance",
          })),
        ];
      }

      return results;
    } catch (error) {
      console.error("Search loading failed:", error);
      return [];
    } finally {
      setSearchLoading(false);
    }
  };

  // =========================================================
  // SEARCH
  // =========================================================

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const performSearch = async () => {
      const data = await loadSearchData();

      if (cancelled) return;

      const filtered = data.filter((item) => {
        const title = String(
          item.title || ""
        ).toLowerCase();

        const subtitle = String(
          item.subtitle || ""
        ).toLowerCase();

        const type = String(
          item.type || ""
        ).toLowerCase();

        return (
          title.includes(query) ||
          subtitle.includes(query) ||
          type.includes(query)
        );
      });

      setSearchResults(filtered.slice(0, 8));
    };

    performSearch();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, isHR, user]);

  // Open search result
  const handleSearchResult = (result) => {
    setSearchQuery("");
    setSearchResults([]);
    navigate(result.path);
  };

  // Open profile
  const handleProfileClick = () => {
    setProfileOpen(false);
    navigate("/profile");
  };

  // Open profile in edit mode
  const handleEditProfile = () => {
    setProfileOpen(false);
    navigate("/profile?mode=edit");
  };

  // Open notifications
  const handleNotifications = () => {
    navigate("/notifications");
  };

  // Logout
  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      {/* Search */}
      <div className="topbar-search-wrapper">
        <div className="topbar-search">
          <Search
            size={18}
            onClick={() => {
              if (searchQuery.trim() && searchResults[0]) {
                handleSearchResult(searchResults[0]);
              }
            }}
            style={{ cursor: "pointer" }}
          />

          <input
            type="text"
            placeholder="Search anything..."
            aria-label="Search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
          />
        </div>

        {searchQuery.trim() && (
          <div className="search-results-dropdown">
            {searchLoading ? (
              <div className="search-result-empty">
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="search-result-empty">
                No results found
              </div>
            ) : (
              searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="search-result-item"
                  onClick={() =>
                    handleSearchResult(result)
                  }
                >
                  <div className="search-result-icon">
                    <Search size={16} />
                  </div>

                  <div className="search-result-content">
                    <strong>{result.title}</strong>
                    <span>{result.subtitle}</span>
                  </div>

                  <small>{result.type}</small>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="topbar-actions">
        {/* Notifications */}
        <button
          type="button"
          className="notification-button"
          aria-label="Open notifications"
          onClick={handleNotifications}
        >
          <Bell size={20} />

          {unreadNotifications > 0 && (
            <span className="notification-dot" />
          )}
        </button>

        {/* Profile dropdown */}
        <div
          className="profile-menu-wrapper"
          ref={profileRef}
        >
          <button
            type="button"
            className="profile-menu"
            onClick={() =>
              setProfileOpen((previous) => !previous)
            }
            aria-expanded={profileOpen}
            aria-label="Open profile menu"
          >
            <div className="avatar">{getInitials()}</div>

            <div className="profile-info">
              <strong>
                {user?.full_name || "User"}
              </strong>
              <span>{getRoleName()}</span>
            </div>

            <ChevronDown
              size={17}
              className={
                profileOpen
                  ? "profile-chevron open"
                  : "profile-chevron"
              }
            />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              {/* User details */}
              <div className="dropdown-profile">
                <div className="dropdown-avatar">
                  {getInitials()}
                </div>

                <div>
                  <strong>
                    {user?.full_name || "User"}
                  </strong>
                  <span>{user?.email || ""}</span>
                </div>
              </div>

              <div className="dropdown-divider" />

              {/* HR menu */}
              {isHR ? (
                <>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={handleProfileClick}
                  >
                    <User size={18} />
                    <span>View Profile</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={handleEditProfile}
                  >
                    <Pencil size={18} />
                    <span>Edit Profile</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={handleProfileClick}
                >
                  <User size={18} />
                  <span>My Profile</span>
                </button>
              )}

              <div className="dropdown-divider" />

              {/* Logout */}
              <button
                type="button"
                className="dropdown-item logout-item"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;

