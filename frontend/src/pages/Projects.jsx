
import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  BarChart3,
} from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Projects.css";

function Projects() {
  const { user } = useAuth();

  const isHR = user?.role === "hr";

  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showProgressModal, setShowProgressModal] =
    useState(false);

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [progressProject, setProgressProject] =
    useState(null);

  const [progressValue, setProgressValue] =
    useState(0);

  const [editingProject, setEditingProject] =
    useState(null);

  const [deleteProject, setDeleteProject] =
    useState(null);

  const [saving, setSaving] = useState(false);
  const [updatingProgress, setUpdatingProgress] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    assigned_employee_ids: [],
    start_date: "",
    end_date: "",
    status: "active",
    completion_percentage: 0,
  });

  // =========================================================
  // TOAST MESSAGE
  // =========================================================

  const showToast = (message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // =========================================================
  // LOAD PROJECTS
  // =========================================================

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const endpoint = isHR
        ? "/api/projects/all"
        : "/api/projects";

      const response = await api.get(endpoint);

      setProjects(response.data || []);
    } catch (error) {
      console.error(
        "Failed to load projects:",
        error
      );

      setError(
        error?.response?.data?.detail ||
          "Failed to load projects."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD EMPLOYEES
  // HR ONLY
  // =========================================================

  const loadEmployees = async () => {
    if (!isHR) {
      return;
    }

    try {
      const response = await api.get(
        "/api/employees"
      );

      setEmployees(response.data || []);
    } catch (error) {
      console.error(
        "Failed to load employees:",
        error
      );
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    loadProjects();

    if (isHR) {
      loadEmployees();
    }
  }, [user, isHR]);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // EMPLOYEE SELECTION
  // =========================================================

  const handleEmployeeSelection = (employeeId) => {
    const employeeIdString = String(employeeId);

    setFormData((previous) => {
      const currentIds =
        previous.assigned_employee_ids || [];

      const alreadySelected =
        currentIds.includes(employeeIdString);

      return {
        ...previous,
        assigned_employee_ids: alreadySelected
          ? currentIds.filter(
              (id) => id !== employeeIdString
            )
          : [
              ...currentIds,
              employeeIdString,
            ],
      };
    });
  };

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      assigned_employee_ids: [],
      start_date: "",
      end_date: "",
      status: "active",
      completion_percentage: 0,
    });

    setEditingProject(null);
  };

  // =========================================================
  // OPEN ADD FORM
  // =========================================================

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  // =========================================================
  // OPEN EDIT FORM
  // =========================================================

  const openEditForm = (project) => {
    setEditingProject(project);

    setFormData({
      name: project.name || "",

      description:
        project.description || "",

      assigned_employee_ids: (
        project.assigned_employee_ids || []
      ).map((id) => String(id)),

      start_date:
        project.start_date || "",

      end_date:
        project.end_date || "",

      status:
        project.status || "active",

      completion_percentage:
        project.completion_percentage ?? 0,
    });

    setShowForm(true);
  };

  // =========================================================
  // CLOSE FORM
  // =========================================================

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  // =========================================================
  // OPEN PROJECT DETAILS
  // =========================================================

  const openDetails = async (project) => {
    try {
      const response = await api.get(
        `/api/projects/${project.id}`
      );

      setSelectedProject(response.data);
      setShowDetails(true);
    } catch (error) {
      console.error(
        "Failed to load project details:",
        error
      );

      showToast(
        error?.response?.data?.detail ||
          "Failed to load project details."
      );
    }
  };

  // =========================================================
  // CLOSE PROJECT DETAILS
  // =========================================================

  const closeDetails = () => {
    setSelectedProject(null);
    setShowDetails(false);
  };

  // =========================================================
  // OPEN UPDATE PROGRESS
  // =========================================================

  const openProgressModal = (project) => {
    setProgressProject(project);

    setProgressValue(
      project.completion_percentage ?? 0
    );

    setShowProgressModal(true);
  };

  // =========================================================
  // CLOSE UPDATE PROGRESS
  // =========================================================

  const closeProgressModal = () => {
    if (updatingProgress) {
      return;
    }

    setProgressProject(null);
    setProgressValue(0);
    setShowProgressModal(false);
  };

  // =========================================================
  // UPDATE PROJECT PROGRESS
  // =========================================================

  const handleProgressUpdate = async (event) => {
    event.preventDefault();

    if (!progressProject) {
      return;
    }

    const value = Number(progressValue);

    if (
      Number.isNaN(value) ||
      value < 0 ||
      value > 100
    ) {
      showToast(
        "Completion percentage must be between 0 and 100."
      );
      return;
    }

    try {
      setUpdatingProgress(true);

      const response = await api.patch(
        `/api/projects/${progressProject.id}/progress`,
        {
          completion_percentage: value,
        }
      );

      const updatedProject = response.data;

      setProjects((previousProjects) =>
        previousProjects.map((project) =>
          project.id === updatedProject.id
            ? updatedProject
            : project
        )
      );

      if (
        selectedProject &&
        selectedProject.id === updatedProject.id
      ) {
        setSelectedProject(updatedProject);
      }

      showToast(
        "Project progress updated successfully."
      );

      closeProgressModal();

      await loadProjects();
    } catch (error) {
      console.error(
        "Failed to update project progress:",
        error
      );

      showToast(
        error?.response?.data?.detail ||
          "Failed to update project progress."
      );
    } finally {
      setUpdatingProgress(false);
    }
  };

  // =========================================================
  // SAVE PROJECT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isHR) {
      return;
    }

    if (!formData.name.trim()) {
      showToast("Please enter project name.");
      return;
    }

    if (!formData.start_date) {
      showToast("Please select project start date.");
      return;
    }

    if (!formData.end_date) {
      showToast("Please select project end date.");
      return;
    }

    if (formData.end_date < formData.start_date) {
      showToast(
        "End date cannot be before start date."
      );
      return;
    }

    const completionPercentage = Number(
      formData.completion_percentage
    );

    if (
      Number.isNaN(completionPercentage) ||
      completionPercentage < 0 ||
      completionPercentage > 100
    ) {
      showToast(
        "Completion percentage must be between 0 and 100."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),

        description:
          formData.description.trim() || null,

        assigned_employee_ids:
          formData.assigned_employee_ids.map(
            (id) => Number(id)
          ),

        start_date:
          formData.start_date,

        end_date:
          formData.end_date,

        status: formData.status,

        completion_percentage:
          completionPercentage,
      };

      if (editingProject) {
        await api.put(
          `/api/projects/${editingProject.id}`,
          payload
        );

        showToast(
          "Project updated successfully."
        );
      } else {
        await api.post(
          "/api/projects",
          payload
        );

        showToast(
          "Project added successfully."
        );
      }

      closeForm();

      await loadProjects();
    } catch (error) {
      console.error(
        "Failed to save project:",
        error
      );

      showToast(
        error?.response?.data?.detail ||
          "Failed to save project."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // OPEN DELETE CONFIRMATION
  // =========================================================

  const handleDelete = (project) => {
    if (!isHR) {
      return;
    }

    setDeleteProject(project);
  };

  // =========================================================
  // CONFIRM DELETE PROJECT
  // =========================================================

  const confirmDeleteProject = async () => {
    if (!deleteProject) {
      return;
    }

    try {
      await api.delete(
        `/api/projects/${deleteProject.id}`
      );

      setDeleteProject(null);

      await loadProjects();

      showToast(
        "Project deleted successfully."
      );
    } catch (error) {
      console.error(
        "Failed to delete project:",
        error
      );

      setDeleteProject(null);

      showToast(
        error?.response?.data?.detail ||
          "Failed to delete project."
      );
    }
  };

  // =========================================================
  // ASSIGNED EMPLOYEE DETAILS
  // =========================================================

  const getAssignedEmployees = (
    employeeIds = []
  ) => {
    if (
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0
    ) {
      return [];
    }

    return employeeIds
      .map((employeeId) =>
        employees.find(
          (employee) =>
            Number(employee.id) ===
            Number(employeeId)
        )
      )
      .filter(Boolean);
  };

  // =========================================================
  // EMPLOYEE NAMES
  // =========================================================

  const getEmployeeNames = (
    employeeIds = []
  ) => {
    const assignedEmployees =
      getAssignedEmployees(employeeIds);

    if (assignedEmployees.length === 0) {
      return "Not assigned";
    }

    const names = assignedEmployees.map(
      (employee) =>
        employee.full_name ||
        employee.name ||
        `Employee #${employee.id}`
    );

    return names.join(", ");
  };

  // =========================================================
  // STATUS LABEL
  // =========================================================

  const getStatusLabel = (
    status,
    completionPercentage
  ) => {
    if (Number(completionPercentage) === 100) {
      return "Completed";
    }

    if (!status) {
      return "Unknown";
    }

    const normalizedStatus =
      String(status).toLowerCase();

    return (
      normalizedStatus.charAt(0).toUpperCase() +
      normalizedStatus
        .slice(1)
        .replace("_", " ")
    );
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (
    status,
    completionPercentage
  ) => {
    if (Number(completionPercentage) === 100) {
      return "success";
    }

    const normalizedStatus =
      String(status || "").toLowerCase();

    if (normalizedStatus === "completed") {
      return "success";
    }

    if (normalizedStatus === "active") {
      return "warning";
    }

    if (
      normalizedStatus === "not_started" ||
      normalizedStatus === "not-started"
    ) {
      return "danger";
    }

    if (normalizedStatus === "cancelled") {
      return "danger";
    }

    if (normalizedStatus === "on_hold") {
      return "info";
    }

    return "warning";
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="projects-page">
        <PageHeader
          title={
            isHR
              ? "Projects"
              : "My Projects"
          }
          description={
            isHR
              ? "Manage projects and employee assignments."
              : "View your assigned projects and progress."
          }
        />

        <div className="empty-panel">
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="projects-page">
        <PageHeader
          title={
            isHR
              ? "Projects"
              : "My Projects"
          }
          description={
            isHR
              ? "Manage projects and employee assignments."
              : "View your assigned projects and progress."
          }
        />

        <div className="empty-panel">
          <h2>
            Unable to load projects
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadProjects}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="projects-page">

      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            minWidth: "280px",
            maxWidth: "380px",
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#ecfdf3",
            color: "#027a48",
            border: "1px solid #abefc6",
            boxShadow:
              "0 8px 24px rgba(16, 24, 40, 0.15)",
            fontSize: "14px",
            fontWeight: 600,
          }}
          role="status"
        >
          {toast}
        </div>
      )}

      <PageHeader
        title={
          isHR
            ? "Projects"
            : "My Projects"
        }
        description={
          isHR
            ? "Manage projects and employee assignments."
            : "View your assigned projects and progress."
        }
      />

      {isHR && (
        <div className="projects-toolbar">
          <button
            type="button"
            className="text-button"
            onClick={openAddForm}
          >
            <Plus size={18} />
            Add Project
          </button>
        </div>
      )}

      {isHR && showForm && (
        <div className="panel project-form-panel">

          <div className="panel-header project-form-header">

            <div>
              <h2>
                {editingProject
                  ? "Edit Project"
                  : "Add Project"}
              </h2>

              <p>
                {editingProject
                  ? "Update project information."
                  : "Enter the project information below."}
              </p>
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={closeForm}
              title="Close"
            >
              <X size={18} />
            </button>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="project-form-grid">

              <div className="form-group">

                <label>
                  Project Name
                  <span className="required">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter project name"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Assign Employees
                </label>

                <div className="employee-selection-list">

                  {employees.length === 0 ? (
                    <div className="employee-selection-empty">
                      No employees available.
                    </div>
                  ) : (
                    employees.map((employee) => {
                      const employeeId =
                        String(employee.id);

                      const isSelected =
                        formData.assigned_employee_ids.includes(
                          employeeId
                        );

                      return (
                        <label
                          key={employee.id}
                          className={`employee-selection-item ${
                            isSelected
                              ? "selected"
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              handleEmployeeSelection(
                                employee.id
                              )
                            }
                          />

                          <span>
                            {employee.full_name}
                          </span>
                        </label>
                      );
                    })
                  )}

                </div>

                <small>
                  Select one or more employees.
                </small>

              </div>

              <div className="form-group">

                <label>
                  Start Date
                  <span className="required">
                    *
                  </span>
                </label>

                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  End Date
                  <span className="required">
                    *
                  </span>
                </label>

                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  min={
                    formData.start_date ||
                    undefined
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="not_started">
                    Not Started
                  </option>

                  <option value="on_hold">
                    On Hold
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>
                </select>

              </div>

              <div className="form-group">

                <label>
                  Completion Percentage
                </label>

                <input
                  type="number"
                  name="completion_percentage"
                  value={
                    formData.completion_percentage
                  }
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  placeholder="0"
                />

              </div>

              <div className="form-group project-description-field">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter project description"
                  rows="4"
                />

              </div>

            </div>

            <div className="project-form-actions">

              <button
                type="button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="project-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingProject
                  ? "Save Changes"
                  : "Save Project"}
              </button>

            </div>

          </form>

        </div>
      )}

      <div className="panel">

        <div className="panel-header">

          <div>
            <h2>
              {isHR
                ? "Project List"
                : "My Assigned Projects"}
            </h2>

            <p>
              {projects.length} project
              {projects.length !== 1
                ? "s"
                : ""}{" "}
              {isHR
                ? "registered"
                : "assigned to you"}
            </p>
          </div>

        </div>

        {projects.length === 0 ? (

          <div className="empty-panel">

            <h2>
              {isHR
                ? "No projects found"
                : "No projects assigned"}
            </h2>

            <p>
              {isHR
                ? "There are no projects registered in the system."
                : "You currently don't have any projects assigned to you."}
            </p>

          </div>

        ) : (

          <div className="project-table-wrapper">

            <table className="data-table">

              <thead>
                <tr>

                  <th>Project</th>

                  <th>Description</th>

                  {isHR && (
                    <th>Employee</th>
                  )}

                  <th>Start Date</th>

                  <th>End Date</th>

                  <th>Status</th>

                  <th>Completion</th>

                  <th>Actions</th>

                </tr>
              </thead>

              <tbody>

                {projects.map(
                  (project) => (

                    <tr key={project.id}>

                      <td>
                        <strong>
                          {project.name}
                        </strong>
                      </td>

                      <td>
                        {project.description ||
                          "No description"}
                      </td>

                      {isHR && (
                        <td>
                          {getEmployeeNames(
                            project.assigned_employee_ids ||
                              []
                          )}
                        </td>
                      )}

                      <td>
                        {formatDate(
                          project.start_date
                        )}
                      </td>

                      <td>
                        {formatDate(
                          project.end_date
                        )}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            project.status,
                            project.completion_percentage
                          )}`}
                        >
                          {getStatusLabel(
                            project.status,
                            project.completion_percentage
                          )}
                        </span>
                      </td>

                      <td>

                        <div className="project-completion">

                          <div className="project-completion-label">

                            <strong>
                              {
                                project.completion_percentage ??
                                0
                              }%
                            </strong>

                          </div>

                          <div className="project-progress-track">

                            <div
                              className="project-progress-fill"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    Number(
                                      project.completion_percentage ||
                                        0
                                    )
                                  )
                                )}%`,
                              }}
                            />

                          </div>

                        </div>

                      </td>

                      <td>

                        <div className="project-actions">

                          <button
                            type="button"
                            title="View project"
                            className="icon-button"
                            onClick={() =>
                              openDetails(
                                project
                              )
                            }
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title="Update project progress"
                            className="icon-button"
                            onClick={() =>
                              openProgressModal(
                                project
                              )
                            }
                          >
                            <BarChart3 size={17} />
                          </button>

                          {isHR && (
                            <button
                              type="button"
                              title="Edit project"
                              className="icon-button"
                              onClick={() =>
                                openEditForm(
                                  project
                                )
                              }
                            >
                              <Pencil size={17} />
                            </button>
                          )}

                          {isHR && (
                            <button
                              type="button"
                              title="Delete project"
                              className="icon-button"
                              onClick={() =>
                                handleDelete(
                                  project
                                )
                              }
                            >
                              <Trash2 size={17} />
                            </button>
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {showDetails &&
        selectedProject && (

          <div
            className="project-modal-overlay"
            onClick={closeDetails}
          >

            <div
              className="panel project-details-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="panel-header project-modal-header">

                <div>

                  <h2>
                    {selectedProject.name}
                  </h2>

                  <p>
                    Project Details
                  </p>

                </div>

                <button
                  type="button"
                  className="icon-button"
                  onClick={closeDetails}
                  title="Close"
                >
                  <X size={18} />
                </button>

              </div>

              <div className="project-description">

                <span className="project-detail-label">
                  Description
                </span>

                <p>
                  {selectedProject.description ||
                    "No description available."}
                </p>

              </div>

              <div className="project-assigned-section">

                <span className="project-detail-label">
                  Assigned Employees
                </span>

                {getAssignedEmployees(
                  selectedProject.assigned_employee_ids ||
                    []
                ).length === 0 ? (

                  <p className="no-assigned-employees">
                    No employees assigned.
                  </p>

                ) : (

                  <div className="assigned-employee-list">

                    {getAssignedEmployees(
                      selectedProject.assigned_employee_ids ||
                        []
                    ).map((employee) => (

                      <div
                        key={employee.id}
                        className="assigned-employee-card"
                      >

                        <div className="assigned-employee-info">

                          <strong>
                            {employee.full_name ||
                              employee.name ||
                              `Employee #${employee.id}`}
                          </strong>

                          <span>
                            {employee.email ||
                              "Email not available"}
                          </span>

                        </div>

                      </div>

                    ))}

                  </div>
                )}

              </div>

              <div className="project-status-grid">

                <div>

                  <span className="project-detail-label">
                    Status
                  </span>

                  <div className="project-status-value">

                    <span
                      className={`status-badge ${getStatusClass(
                        selectedProject.status,
                        selectedProject.completion_percentage
                      )}`}
                    >
                      {getStatusLabel(
                        selectedProject.status,
                        selectedProject.completion_percentage
                      )}
                    </span>

                  </div>

                </div>

                <div>

                  <span className="project-detail-label">
                    Completion
                  </span>

                  <strong className="project-details-value">
                    {
                      selectedProject.completion_percentage ??
                      0
                    }%
                  </strong>

                </div>

                <div>

                  <span className="project-detail-label">
                    Start Date
                  </span>

                  <strong className="project-details-value">
                    {formatDate(
                      selectedProject.start_date
                    )}
                  </strong>

                </div>

                <div>

                  <span className="project-detail-label">
                    End Date
                  </span>

                  <strong className="project-details-value">
                    {formatDate(
                      selectedProject.end_date
                    )}
                  </strong>

                </div>

              </div>

              <div className="project-progress-section">

                <div className="project-progress-header">

                  <span>
                    Project Progress
                  </span>

                  <strong>
                    {
                      selectedProject.completion_percentage ??
                      0
                    }%
                  </strong>

                </div>

                <div className="project-details-progress-track">

                  <div
                    className="project-details-progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          Number(
                            selectedProject.completion_percentage ||
                              0
                          )
                        )
                      )}%`,
                    }}
                  />

                </div>

              </div>

              <div className="project-modal-actions">

                <button
                  type="button"
                  className="project-progress-update-button"
                  onClick={() => {
                    closeDetails();
                    openProgressModal(
                      selectedProject
                    );
                  }}
                >
                  <BarChart3 size={17} />
                  Update Progress
                </button>

                <button
                  type="button"
                  onClick={closeDetails}
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

      {showProgressModal &&
        progressProject && (

          <div
            className="project-modal-overlay project-progress-overlay"
            onClick={closeProgressModal}
          >

            <div
              className="panel progress-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="panel-header project-modal-header">

                <div>

                  <h2>
                    Update Project Progress
                  </h2>

                  <p>
                    Update the completion percentage
                    for this project.
                  </p>

                </div>

                <button
                  type="button"
                  className="icon-button"
                  onClick={closeProgressModal}
                  title="Close"
                  disabled={updatingProgress}
                >
                  <X size={18} />
                </button>

              </div>

              <div className="progress-project-info">

                <span>
                  Project
                </span>

                <strong>
                  {progressProject.name}
                </strong>

              </div>

              <div className="progress-current-value">

                <span>
                  Current Completion
                </span>

                <strong>
                  {
                    progressProject.completion_percentage ??
                    0
                  }%
                </strong>

              </div>

              <form
                onSubmit={handleProgressUpdate}
              >

                <div className="form-group progress-form-group">

                  <label>
                    New Completion Percentage
                  </label>

                  <div className="progress-input-group">

                    <input
                      type="number"
                      value={progressValue}
                      onChange={(event) =>
                        setProgressValue(
                          event.target.value
                        )
                      }
                      min="0"
                      max="100"
                      step="1"
                      required
                      autoFocus
                    />

                    <strong>
                      %
                    </strong>

                  </div>

                </div>

                <div className="progress-preview">

                  <div className="progress-preview-header">

                    <span>
                      Progress Preview
                    </span>

                    <strong>
                      {
                        Math.min(
                          100,
                          Math.max(
                            0,
                            Number(
                              progressValue || 0
                            )
                          )
                        )
                      }%
                    </strong>

                  </div>

                  <div className="progress-preview-track">

                    <div
                      className="progress-preview-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            Number(
                              progressValue || 0
                            )
                          )
                        )}%`,
                      }}
                    />

                  </div>

                </div>

                <div className="project-modal-actions">

                  <button
                    type="button"
                    onClick={closeProgressModal}
                    disabled={updatingProgress}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="project-progress-update-button"
                    disabled={updatingProgress}
                  >
                    <BarChart3 size={17} />

                    {updatingProgress
                      ? "Updating..."
                      : "Update Progress"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      {/* =========================================================
          DELETE PROJECT CONFIRMATION
          ========================================================= */}

      {deleteProject && (
        <div
          className="project-modal-overlay"
          onClick={() => setDeleteProject(null)}
        >
          <div
            className="panel project-details-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="panel-header project-modal-header">
              <div>
                <h2>Delete Project</h2>

                <p>
                  Review the project information before
                  deleting.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() =>
                  setDeleteProject(null)
                }
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="project-description">
              <span className="project-detail-label">
                Project Name
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: "6px",
                  fontSize: "17px",
                  color: "#101828",
                }}
              >
                {deleteProject.name}
              </strong>
            </div>

            <div className="project-description">
              <span className="project-detail-label">
                Description
              </span>

              <p>
                {deleteProject.description ||
                  "No description available."}
              </p>
            </div>

            <div className="project-assigned-section">
              <span className="project-detail-label">
                Assigned Employees
              </span>

              {getAssignedEmployees(
                deleteProject.assigned_employee_ids ||
                  []
              ).length === 0 ? (
                <p className="no-assigned-employees">
                  No employees assigned.
                </p>
              ) : (
                <div className="assigned-employee-list">
                  {getAssignedEmployees(
                    deleteProject.assigned_employee_ids ||
                      []
                  ).map((employee) => (
                    <div
                      key={employee.id}
                      className="assigned-employee-card"
                    >
                      <div className="assigned-employee-info">
                        <strong>
                          {employee.full_name ||
                            employee.name ||
                            `Employee #${employee.id}`}
                        </strong>

                        <span>
                          {employee.email ||
                            "Email not available"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="project-status-grid">
              <div>
                <span className="project-detail-label">
                  Status
                </span>

                <div className="project-status-value">
                  <span
                    className={`status-badge ${getStatusClass(
                      deleteProject.status,
                      deleteProject.completion_percentage
                    )}`}
                  >
                    {getStatusLabel(
                      deleteProject.status,
                      deleteProject.completion_percentage
                    )}
                  </span>
                </div>
              </div>

              <div>
                <span className="project-detail-label">
                  Completion
                </span>

                <strong className="project-details-value">
                  {deleteProject.completion_percentage ??
                    0}
                  %
                </strong>
              </div>

              <div>
                <span className="project-detail-label">
                  Start Date
                </span>

                <strong className="project-details-value">
                  {formatDate(
                    deleteProject.start_date
                  )}
                </strong>
              </div>

              <div>
                <span className="project-detail-label">
                  End Date
                </span>

                <strong className="project-details-value">
                  {formatDate(
                    deleteProject.end_date
                  )}
                </strong>
              </div>
            </div>

            <div className="project-progress-section">
              <div className="project-progress-header">
                <span>
                  Project Progress
                </span>

                <strong>
                  {deleteProject.completion_percentage ??
                    0}
                  %
                </strong>
              </div>

              <div className="project-details-progress-track">
                <div
                  className="project-details-progress-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        Number(
                          deleteProject.completion_percentage ||
                            0
                        )
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "14px 16px",
                borderRadius: "10px",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                color: "#9a3412",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete this
              project? This action cannot be undone.
            </div>

            <div
              className="project-modal-actions"
              style={{
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setDeleteProject(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteProject}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                }}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Projects;

