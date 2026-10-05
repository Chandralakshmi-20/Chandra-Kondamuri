
import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./WorkReports.css";

function WorkReports() {
  const { user } = useAuth();

  const isHR = user?.role === "hr";

  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [saving, setSaving] = useState(false);

  // =========================================================
  // DELETE CONFIRMATION
  // =========================================================

  const [deleteReport, setDeleteReport] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // =========================================================
  // SUCCESS TOAST
  // =========================================================

  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const [formData, setFormData] = useState({
    project_id: "",
    report_date: "",
    title: "",
    description: "",
    tag: "",
    completion_percentage: 0,
  });

  // =========================================================
  // LOAD REPORTS
  // =========================================================

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        isHR
          ? "/api/work-reports/all"
          : "/api/work-reports"
      );

      setReports(response.data || []);
    } catch (error) {
      console.error("Failed to load work reports:", error);

      setError(
        error?.response?.data?.detail ||
          "Unable to load work reports."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD PROJECTS
  // =========================================================

  const loadProjects = async () => {
    try {
      const response = await api.get(
        isHR
          ? "/api/projects/all"
          : "/api/projects"
      );

      setProjects(response.data || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
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
      const response = await api.get("/api/employees");

      setEmployees(response.data || []);
    } catch (error) {
      console.error("Failed to load employees:", error);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadPageData = async () => {
      await Promise.all([
        loadReports(),
        loadProjects(),
        loadEmployees(),
      ]);
    };

    loadPageData();
  }, [user]);

  // =========================================================
  // CREATE FORM
  // =========================================================

  const openCreateForm = () => {
    setEditingReport(null);

    setFormData({
      project_id: "",
      report_date: "",
      title: "",
      description: "",
      tag: "",
      completion_percentage: 0,
    });

    setError("");
    setShowForm(true);
  };

  // =========================================================
  // EDIT FORM
  // =========================================================

  const openEditForm = (report) => {
    setEditingReport(report);

    setFormData({
      project_id: report.project_id
        ? String(report.project_id)
        : "",
      report_date: report.report_date || "",
      title: report.title || "",
      description: report.description || "",
      tag: report.tag || "",
      completion_percentage:
        report.completion_percentage ?? 0,
    });

    setError("");
    setShowForm(true);
  };

  // =========================================================
  // CLOSE FORM
  // =========================================================

  const closeForm = () => {
    setShowForm(false);
    setEditingReport(null);
  };

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "completion_percentage"
          ? Number(value)
          : value,
    }));
  };

  // =========================================================
  // SUBMIT WORK REPORT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.project_id) {
      setError("Please select a project.");
      return;
    }

    if (!formData.report_date) {
      setError("Please select a start date.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a work report title.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please enter a work description.");
      return;
    }

    if (!formData.tag.trim()) {
      setError("Please enter a tag.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        project_id: Number(formData.project_id),
        report_date: formData.report_date,
        title: formData.title.trim(),
        description: formData.description.trim(),
        tag: formData.tag.trim(),
        completion_percentage: Number(
          formData.completion_percentage
        ),
      };

      if (editingReport) {
        await api.put(
          `/api/work-reports/${editingReport.id}`,
          payload
        );

        showToast("Work report updated successfully.");
      } else {
        await api.post(
          "/api/work-reports",
          payload
        );

        showToast("Work report submitted successfully.");
      }

      closeForm();

      await loadReports();

      await loadProjects();
    } catch (error) {
      console.error(
        "Failed to save work report:",
        error
      );

      setError(
        error?.response?.data?.detail ||
          "Unable to save work report."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // OPEN DELETE CONFIRMATION
  // =========================================================

  const handleDelete = (report) => {
    setDeleteReport(report);
  };

  // =========================================================
  // CLOSE DELETE CONFIRMATION
  // =========================================================

  const closeDeleteConfirmation = () => {
    if (deleteLoading) {
      return;
    }

    setDeleteReport(null);
  };

  // =========================================================
  // CONFIRM DELETE WORK REPORT
  // =========================================================

  const confirmDeleteReport = async () => {
    if (!deleteReport) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError("");

      await api.delete(
        `/api/work-reports/${deleteReport.id}`
      );

      setDeleteReport(null);

      await loadReports();
      await loadProjects();

      showToast("Work report deleted successfully.");
    } catch (error) {
      console.error(
        "Failed to delete work report:",
        error
      );

      setError(
        error?.response?.data?.detail ||
          "Unable to delete work report."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // =========================================================
  // GET PROJECT NAME
  // =========================================================

  const getProjectName = (projectId) => {
    const project = projects.find(
      (item) => item.id === projectId
    );

    return (
      project?.name ||
      `Project #${projectId}`
    );
  };

  // =========================================================
  // GET EMPLOYEE NAME
  // =========================================================

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(
      (item) => item.id === employeeId
    );

    return (
      employee?.full_name ||
      `Employee #${employeeId}`
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="work-reports-page">
        <PageHeader
          title="Work Reports"
          description={
            isHR
              ? "Monitor employee work reports and completion."
              : "Create and manage your work reports."
          }
        />

        <div className="empty-panel">
          <p>Loading work reports...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="work-reports-page">

      {/* SUCCESS TOAST */}

      {toast && (
        <div
          role="status"
          className="work-report-toast"
        >
          {toast}
        </div>
      )}

      <PageHeader
        title="Work Reports"
        description={
          isHR
            ? "Monitor employee work reports and completion."
            : "Create and manage your work reports."
        }
      />

      {/* ERROR */}

      {error && (
        <div
          className="empty-panel work-report-error"
        >
          <h2>Unable to load work reports</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadReports}
          >
            Try Again
          </button>
        </div>
      )}

      {/* EMPLOYEE CREATE BUTTON */}

      {!isHR && (
        <div className="work-reports-toolbar">
          <button
            type="button"
            className="text-button"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            Add Work Report
          </button>
        </div>
      )}

      {/* EMPLOYEE CREATE / EDIT FORM */}

      {showForm && !isHR && (
        <div className="panel work-report-form-panel">
          <div className="panel-header work-report-form-header">
            <div>
              <h2>
                {editingReport
                  ? "Edit Work Report"
                  : "Create Work Report"}
              </h2>

              <p>
                Submit your completed work details.
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
            <div className="work-report-form-grid">

              {/* PROJECT */}

              <div className="form-group">
                <label>Project *</label>

                <select
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Project
                  </option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* TAG */}

              <div className="form-group">
                <label>Tag *</label>

                <input
                  type="text"
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                  placeholder="Development"
                  required
                />
              </div>

              {/* Report DATE */}

              <div className="form-group">
                <label>Report Date *</label>

                <input
                  type="date"
                  name="report_date"
                  value={formData.report_date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* TITLE */}

              <div className="form-group work-report-full-field">
                <label>Title *</label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter work report title"
                  required
                />
              </div>

              {/* DESCRIPTION */}

              <div className="form-group work-report-full-field">
                <label>Description *</label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the work completed..."
                  rows="5"
                  required
                />
              </div>

              {/* COMPLETION */}

              <div className="form-group work-report-full-field">
                <label>
                  Completion Percentage:{" "}
                  {formData.completion_percentage}%
                </label>

                <input
                  type="range"
                  name="completion_percentage"
                  min="0"
                  max="100"
                  value={
                    formData.completion_percentage
                  }
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* FORM ACTIONS */}

            <div className="work-report-form-actions">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="text-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingReport
                  ? "Save Changes"
                  : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REPORT LIST */}

      {!error && reports.length === 0 ? (
        <div className="empty-panel">
          <FileText size={42} />

          <h2>No Work Reports</h2>

          <p>
            {isHR
              ? "No employee work reports have been submitted yet."
              : "You have not submitted any work reports yet."}
          </p>
        </div>
      ) : (
        !error && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  {isHR
                    ? "Employee Work Reports"
                    : "My Work Reports"}
                </h2>

                <p>
                  {reports.length} report
                  {reports.length !== 1
                    ? "s"
                    : ""}{" "}
                  submitted
                </p>
              </div>
            </div>

            <div className="work-reports-grid">
              {reports.map((report) => (
                <div
                  className="panel work-report-card"
                  key={report.id}
                >
                  {/* HEADER */}

                  <div className="work-report-card-header">
                    <div className="work-report-title">
                      <FileText size={22} />

                      <strong>
                        {report.title}
                      </strong>
                    </div>

                    <span className="status-badge success">
                      <CheckCircle2 size={14} />

                      {report.status}
                    </span>
                  </div>

                  {/* HR EMPLOYEE */}

                  {isHR && (
                    <p className="work-report-employee">
                      Employee:{" "}
                      {getEmployeeName(
                        report.employee_id
                      )}
                    </p>
                  )}

                  {/* PROJECT */}

                  <p>
                    <strong>Project:</strong>{" "}
                    {getProjectName(
                      report.project_id
                    )}
                  </p>

                  {/* DESCRIPTION */}

                  <p className="work-report-description">
                    {report.description}
                  </p>

                  {/* Report DATE */}

                  <div className="work-report-date">
                    <span>
                      <CalendarDays
                        size={15}
                        className="work-report-date-icon"
                      />

                      <strong>Report Date:</strong>{" "}
                      {report.report_date}
                    </span>
                  </div>

                  {/* COMPLETION */}

                  <div className="work-report-completion">
                    <div className="work-report-completion-header">
                      <span>
                        Completion
                      </span>

                      <strong>
                        {
                          report.completion_percentage
                        }
                        %
                      </strong>
                    </div>

                    <div className="work-report-progress-track">
                      <div
                        className="work-report-progress-fill"
                        style={{
                          width: `${report.completion_percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* TAG */}

                  <div className="work-report-tag">
                    <span className="status-badge">
                      {report.tag}
                    </span>
                  </div>

                  {/* EMPLOYEE ACTIONS */}

                  {!isHR && (
                    <div className="work-report-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() =>
                          openEditForm(report)
                        }
                        title="Edit report"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="icon-button"
                        onClick={() =>
                          handleDelete(report)
                        }
                        title="Delete report"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* =====================================================
          DELETE CONFIRMATION MODAL
          ===================================================== */}

      {deleteReport && (
        <div className="work-report-delete-overlay">
          <div
            className="work-report-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-work-report-title"
          >
            <div className="work-report-delete-icon">
              <Trash2 size={22} />
            </div>

            <h2 id="delete-work-report-title">
              Delete Work Report?
            </h2>

            <p>
              Are you sure you want to delete this
              work report?
            </p>

            <strong className="work-report-delete-name">
              {deleteReport.title}
            </strong>

            <div className="work-report-delete-actions">
              <button
                type="button"
                className="work-report-delete-cancel"
                onClick={closeDeleteConfirmation}
                disabled={deleteLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="work-report-delete-confirm"
                onClick={confirmDeleteReport}
                disabled={deleteLoading}
              >
                {deleteLoading
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkReports;

