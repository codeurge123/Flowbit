import { useEffect, useRef, useState } from "react";
import {
  FiBarChart2,
  FiBell,
  FiCheckSquare,
  FiChevronDown,
  FiChevronsLeft,
  FiChevronsRight,
  FiEdit3,
  FiFileText,
  FiFolder,
  FiGrid,
  FiHelpCircle,
  FiLogOut,
  FiMonitor,
  FiMoon,
  FiPlus,
  FiSearch,
  FiSettings,
  FiSun,
  FiUsers,
  FiZap
} from "react-icons/fi";
import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../context/useApp";
import { initials } from "../utils/taskUtils";
import { ChangePasswordModal, ProjectModal, TaskModal } from "./Modals";

function Sidebar() {
  const { setProjectModalOpen, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const nav = [
    ["Dashboard", "/dashboard", <FiGrid />],
    ["Projects", "/projects", <FiFolder />],
    ["My Tasks", "/my-tasks", <FiCheckSquare />],
    ["Reports", "/reports", <FiBarChart2 />],
    ["Team", "/team", <FiUsers />],
    ["Settings", "/settings", <FiSettings />]
  ];

  return (
    <aside className="sidebar">
      <button className="sidebar-toggle" title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setSidebarCollapsed((value) => !value)}>
        {sidebarCollapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
      </button>
      <div className="logo">
        <span className="logo-icon"><FiZap /></span>
        <div>
          <strong>Flowbit</strong>
          <small>Enterprise Tier</small>
        </div>
      </div>
      <nav>
        {nav.map(([label, path, icon]) => (
          <NavLink key={path} to={path} className={({ isActive }) => (isActive ? "active" : "")}>
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <button className="new-project-btn" onClick={() => setProjectModalOpen(true)}>
        <FiPlus /> New Project
      </button>
    </aside>
  );
}

function Topbar() {
  const {
    user,
    invitations,
    respondInvitation,
    search,
    selectedProject,
    setSearch,
    setTaskModalOpen,
    setPasswordModalOpen,
    setToast,
    logout
  } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("flowbit_theme") || "light");
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const settingsRef = useRef(null);
  const helpRef = useRef(null);
  const currentRole = selectedProject?.members?.find((member) => member.user._id === user?._id)?.role;
  const isAdmin = currentRole === "Admin";
  const themeOptions = [
    ["light", "Light", <FiSun />],
    ["dark", "Dark", <FiMoon />],
    ["system", "System", <FiMonitor />]
  ];
  const activeThemeIcon = themeOptions.find(([value]) => value === theme)?.[2] || <FiMonitor />;

  useEffect(() => {
    localStorage.setItem("flowbit_theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!menuOpen && !notificationsOpen && !settingsOpen && !helpOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
      if (!notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (!settingsRef.current?.contains(event.target)) {
        setSettingsOpen(false);
      }
      if (!helpRef.current?.contains(event.target)) {
        setHelpOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [menuOpen, notificationsOpen, settingsOpen, helpOpen]);

  return (
    <header className="topbar">
      <label className="search">
        <span><FiSearch /></span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks, teams, or documents..." />
      </label>
      <div className="top-actions">
        <div className="notification-menu" ref={notificationsRef}>
          <button className="icon-btn" title="Notifications" onClick={() => setNotificationsOpen((open) => !open)}>
            <FiBell />
            {invitations.length > 0 && <span className="notification-badge">{invitations.length}</span>}
          </button>
          {notificationsOpen && (
            <div className="notification-dropdown">
              <div className="panel-title">
                <h2>Notifications</h2>
                <span>{invitations.length}</span>
              </div>
              {invitations.length === 0 ? (
                <p className="empty-state">No pending invitations.</p>
              ) : (
                invitations.map((invitation) => (
                  <article className="notification-item" key={invitation._id}>
                    <strong>{invitation.project.name}<small>{invitation.invitedBy?.name} invited you as {invitation.role}</small></strong>
                    <div>
                      <button className="primary-btn small" onClick={() => respondInvitation(invitation.project._id, "accept").catch((err) => setToast(err.message))}>Accept</button>
                      <button className="outline-btn" onClick={() => respondInvitation(invitation.project._id, "decline").catch((err) => setToast(err.message))}>Decline</button>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </div>
        <div className="help-menu" ref={helpRef}>
          <button className="icon-btn" title="Terms and conditions" onClick={() => setHelpOpen((open) => !open)}><FiHelpCircle /></button>
          {helpOpen && (
            <div className="help-dropdown">
              <div className="panel-title">
                <h2>Terms & Conditions</h2>
                <span><FiFileText /></span>
              </div>
              <p>Use Flowbit to manage work you are authorized to access. Project data, invitations, tasks, and reports are visible according to each project membership.</p>
              <p>Keep account credentials private, assign work only to active project members, and review changes before saving workflow updates.</p>
            </div>
          )}
        </div>
        <div className="settings-menu" ref={settingsRef}>
          <button className="icon-btn" title={`Theme: ${theme}`} onClick={() => setSettingsOpen((open) => !open)}>{activeThemeIcon}</button>
          {settingsOpen && (
            <div className="settings-dropdown">
              <div className="panel-title">
                <h2>Theme</h2>
                <span>{theme}</span>
              </div>
              <div className="theme-options">
                {themeOptions.map(([value, label, icon]) => (
                  <button
                    type="button"
                    key={value}
                    className={theme === value ? "active" : ""}
                    onClick={() => setTheme(value)}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {isAdmin && <button className="primary-btn small" onClick={() => setTaskModalOpen(true)}>Create Task</button>}
        <div className="account-menu" ref={menuRef}>
          <button className="avatar-trigger" title="Account" onClick={() => setMenuOpen((open) => !open)}>
            <span className="avatar">{initials(user?.name)}</span>
            <FiChevronDown />
          </button>
          {menuOpen && (
            <div className="account-dropdown">
              <div className="account-summary">
                <span className="avatar">{initials(user?.name)}</span>
                <strong>{user?.name}<small>{user?.email}</small></strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setPasswordModalOpen(true);
                }}
              >
                <FiEdit3 /> Change password
              </button>
              <button type="button" className="danger-action" onClick={logout}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppLayout() {
  const { toast, setToast, projects, setProjectModalOpen, sidebarCollapsed } = useApp();

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [setToast, toast]);

  return (
    <main className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar />
      <div className="workspace">
        <Topbar />
        {projects.length === 0 ? (
          <section className="content-section empty-project">
            <h1>Create your first project</h1>
            <p>Project creators become admins and can invite members, create tasks, and assign work.</p>
            <button className="primary-btn" onClick={() => setProjectModalOpen(true)}>New Project</button>
          </section>
        ) : (
          <Outlet />
        )}
      </div>
      <TaskModal />
      <ProjectModal />
      <ChangePasswordModal />
      {toast && <button className="toast" onClick={() => setToast("")}>{toast}</button>}
    </main>
  );
}
