
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ClipboardList,
  CalendarDays,
  Bell,
  LogOut,
  UserRound,
  Menu,
  X,
  ChartNoAxesCombined,
  Clock3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

function Sidebar({ collapsed, setCollapsed }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isHR = user?.role === "hr";
  const dashboardPath = isHR ? "/hr/dashboard" : "/employee/dashboard";

  const menuItems = isHR
    ? [
        {
          label: "Dashboard",
          path: dashboardPath,
          icon: LayoutDashboard,
        },
        {
          label: "Employees",
          path: "/employees",
          icon: Users,
        },
        {
          label: "Work Reports",
          path: "/work-reports",
          icon: ClipboardList,
        },
        {
          label: "Leave Management",
          path: "/leaves",
          icon: CalendarDays,
        },
        {
          label: "Attendance",
          path: "/attendance",
          icon: Clock3,
        },
        {
          label: "Projects",
          path: "/projects",
          icon: FolderKanban,
        },
        {
          label: "Analytics",
          path: "/analytics",
          icon: ChartNoAxesCombined,
        },
        {
          label: "Notifications",
          path: "/notifications",
          icon: Bell,
        },
      ]
    : [
        {
          label: "Dashboard",
          path: dashboardPath,
          icon: LayoutDashboard,
        },
        {
          label: "My Projects",
          path: "/projects",
          icon: FolderKanban,
        },
        {
          label: "My Leaves",
          path: "/leaves",
          icon: CalendarDays,
        },
        {
          label: "Attendance",
          path: "/attendance",
          icon: Clock3,
        },
        {
          label: "Work Reports",
          path: "/work-reports",
          icon: ClipboardList,
        },
        {
          label: "Notifications",
          path: "/notifications",
          icon: Bell,
        },
      ];

  const handleToggleSidebar = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setCollapsed((prev) => !prev);
  };

  const handleProfileClick = () => {
    setMobileOpen(false);
    navigate("/profile");
  };

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleOpenMobileMenu = () => {
    setMobileOpen(true);
  };

  const handleCloseMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* =========================================================
          MOBILE MENU BUTTON
          Shows only when sidebar is closed
          ========================================================= */}
      {!mobileOpen && (
        <button
          type="button"
          className="mobile-menu-button"
          onClick={handleOpenMobileMenu}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      )}

      {/* =========================================================
          MOBILE OVERLAY
          ========================================================= */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={handleCloseMobileMenu}
        />
      )}

      {/* =========================================================
          SIDEBAR
          ========================================================= */}
      <aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
        style={{
          "--sidebar-width": collapsed ? "76px" : "250px",
        }}
      >
        {/* =======================================================
            BRAND
            ======================================================= */}
        <div className="sidebar-brand">
          <div className="brand-icon">HR</div>

          <div className="sidebar-brand-text">
            <h2>HRMS</h2>
            <span>Human Resource</span>
          </div>

          {/* Mobile Close */}
          {mobileOpen && (
            <button
              type="button"
              className="mobile-close"
              onClick={handleCloseMobileMenu}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* =======================================================
            DESKTOP COLLAPSE BUTTON
            ======================================================= */}
        <button
          type="button"
          className="sidebar-collapse-button"
          onClick={handleToggleSidebar}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>

        {/* =======================================================
            MAIN MENU TITLE
            ======================================================= */}
        <div className="sidebar-section-title">
          MAIN MENU
        </div>

        {/* =======================================================
            NAVIGATION
            ======================================================= */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? "active" : ""
                  }`
                }
                data-label={item.label}
                title={collapsed ? item.label : ""}
              >
                <Icon size={19} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* =======================================================
            BOTTOM
            ======================================================= */}
        <div className="sidebar-bottom">
          {/* Employee Profile */}
          {!isHR && (
            <button
              type="button"
              className="sidebar-link sidebar-profile-button"
              onClick={handleProfileClick}
              data-label="My Profile"
              title={collapsed ? "My Profile" : ""}
            >
              <UserRound size={19} />
              <span>My Profile</span>
            </button>
          )}

          {/* Logout */}
          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
            data-label="Logout"
            title={collapsed ? "Logout" : ""}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

