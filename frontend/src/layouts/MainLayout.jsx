
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";
import "./MainLayout.css";

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`app-shell ${
        collapsed ? "sidebar-collapsed" : "sidebar-expanded"
      }`}
    >
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="main-area">
        <Topbar />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;

