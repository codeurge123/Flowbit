import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, dashboardApi, getToken, projectApi, taskApi } from "../services/api";
import { AppContext } from "./appContext";

const SELECTED_PROJECT_KEY = "flowbit_selected_project";

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedProjectId, setSelectedProjectIdState] = useState(() => localStorage.getItem(SELECTED_PROJECT_KEY) || "");
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [booting, setBooting] = useState(Boolean(getToken()));

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  );

  const setSelectedProjectId = useCallback((projectId) => {
    setSelectedProjectIdState(projectId);
    if (projectId) {
      localStorage.setItem(SELECTED_PROJECT_KEY, projectId);
    } else {
      localStorage.removeItem(SELECTED_PROJECT_KEY);
    }
  }, []);

  const loadData = useCallback(async (preferredProjectId = selectedProjectId) => {
    const [projectPayload, dashboardPayload] = await Promise.all([projectApi.list(), dashboardApi.get()]);
    const activeProjectId = projectPayload.projects.some((project) => project._id === preferredProjectId)
      ? preferredProjectId
      : projectPayload.projects[0]?._id || "";

    setProjects(projectPayload.projects);
    setSelectedProjectId(activeProjectId);
    setDashboard(dashboardPayload);

    if (activeProjectId) {
      const taskPayload = await taskApi.list(activeProjectId);
      setTasks(taskPayload.tasks);
    } else {
      setTasks([]);
    }
  }, [selectedProjectId, setSelectedProjectId]);

  const loadInvitations = useCallback(async () => {
    const payload = await projectApi.invitations();
    setInvitations(payload.invitations);
  }, []);

  useEffect(() => {
    if (!getToken()) {
      queueMicrotask(() => setBooting(false));
      return;
    }

    authApi.me()
      .then((payload) => {
        setUser(payload.user);
        return loadInvitations();
      })
      .catch(() => setUser(null))
      .finally(() => setBooting(false));
  }, [loadInvitations]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      loadData().catch((err) => setToast(err.message));
    });
  }, [loadData, user]);

  useEffect(() => {
    if (!user) return undefined;

    const timer = window.setInterval(() => {
      loadInvitations().catch((err) => setToast(err.message));
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loadInvitations, user]);

  useEffect(() => {
    if (!user || !getToken()) return undefined;

    const events = new EventSource(projectApi.invitationStreamUrl(), { withCredentials: true });

    events.addEventListener("invitation", (event) => {
      const payload = JSON.parse(event.data || "{}");
      loadInvitations().catch((err) => setToast(err.message));
      setToast(`${payload.invitedBy || "Someone"} invited you to ${payload.projectName || "a project"}`);
    });

    return () => events.close();
  }, [loadInvitations, setToast, user]);

  useEffect(() => {
    if (!selectedProjectId || !user) return;
    queueMicrotask(() => setSelectedTask(null));
    taskApi
      .list(selectedProjectId)
      .then((payload) => setTasks(payload.tasks))
      .catch((err) => setToast(err.message));
  }, [selectedProjectId, user]);

  const authenticate = async (mode, form) => {
    const payload =
      mode === "signup"
        ? await authApi.signup(form)
        : await authApi.signin({ email: form.email, password: form.password });
    setUser(payload.user);
    await loadInvitations();
    navigate("/dashboard", { replace: true });
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setProjects([]);
    setInvitations([]);
    setTasks([]);
    setDashboard(null);
    setSelectedProjectId("");
    navigate("/signin", { replace: true });
  };

  const changePassword = async (form) => {
    await authApi.changePassword(form);
    setPasswordModalOpen(false);
    setToast("Password changed");
  };

  const createProject = async (form) => {
    const payload = await projectApi.create(form);
    setProjects((current) => [payload.project, ...current]);
    setSelectedProjectId(payload.project._id);
    setProjectModalOpen(false);
    setToast("Project created");
  };

  const createTask = async (form) => {
    await taskApi.create(form);
    setTaskModalOpen(false);
    await loadData(form.projectId);
    setToast("Task created");
  };

  const saveTask = async (draft) => {
    const update = { ...draft };
    if (update.assignedTo && typeof update.assignedTo === "object") {
      update.assignedTo = update.assignedTo._id;
    }
    delete update._id;
    delete update.createdAt;
    delete update.updatedAt;
    delete update.createdBy;
    delete update.project;

    const payload = await taskApi.update(draft._id, update);
    const dashboardPayload = await dashboardApi.get();
    setTasks((current) => current.map((task) => (task._id === payload.task._id ? payload.task : task)));
    setDashboard(dashboardPayload);
    setSelectedTask(payload.task);
    setToast("Task updated");
  };

  const updateProject = async (projectId, form) => {
    const payload = await projectApi.update(projectId, form);
    setProjects((current) => current.map((project) => (project._id === payload.project._id ? payload.project : project)));
    const dashboardPayload = await dashboardApi.get();
    setDashboard(dashboardPayload);
    setToast("Project updated");
  };

  const deleteProject = async (projectId, form) => {
    await projectApi.remove(projectId, form);
    await loadData("");
    setSelectedTask(null);
    setToast("Project deleted");
  };

  const addMember = async (form) => {
    const payload = await projectApi.addMember(selectedProject._id, form);
    setProjects((current) => current.map((project) => (project._id === payload.project._id ? payload.project : project)));
    setToast("Invitation sent");
  };

  const respondInvitation = async (projectId, action) => {
    await projectApi.respondInvitation(projectId, action);
    await Promise.all([loadInvitations(), loadData(projectId)]);
    setToast(action === "accept" ? "Invitation accepted" : "Invitation declined");
  };

  const removeMember = async (userId) => {
    const payload = await projectApi.removeMember(selectedProject._id, userId);
    setProjects((current) => current.map((project) => (project._id === payload.project._id ? payload.project : project)));
    await loadData(selectedProject._id);
    setToast("Member removed");
  };

  const value = {
    user,
    booting,
    projects,
    invitations,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    tasks,
    dashboard,
    selectedTask,
    setSelectedTask,
    taskModalOpen,
    setTaskModalOpen,
    projectModalOpen,
    setProjectModalOpen,
    passwordModalOpen,
    setPasswordModalOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    search,
    setSearch,
    toast,
    setToast,
    authenticate,
    changePassword,
    logout,
    createProject,
    createTask,
    saveTask,
    updateProject,
    deleteProject,
    addMember,
    respondInvitation,
    removeMember
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
