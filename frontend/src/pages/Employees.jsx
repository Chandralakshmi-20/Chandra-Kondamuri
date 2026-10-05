
import { useEffect, useState } from "react";
import {
  UserPlus,
  Pencil,
  Trash2,
  Power,
  Eye,
  X,
} from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import api from "../services/api";
import "./Employees.css";

function Employees() {
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);

  const [viewingEmployee, setViewingEmployee] = useState(null);

  const [deleteEmployee, setDeleteEmployee] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    joining_date: "",
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
  // LOAD EMPLOYEES
  // =========================================================

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/employees");

      setEmployees(response.data || []);
    } catch (error) {
      console.error(
        "Failed to load employees:",
        error
      );

      setError(
        error?.response?.data?.detail ||
          "Failed to load employees."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

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
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      department: "",
      designation: "",
      joining_date: "",
    });

    setEditingEmployee(null);
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

  const openEditForm = (employee) => {
    setEditingEmployee(employee);

    setFormData({
      full_name: employee.full_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department || "",
      designation: employee.designation || "",
      joining_date: employee.joining_date || "",
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
  // VIEW EMPLOYEE
  // =========================================================

  const openView = (employee) => {
    setViewingEmployee(employee);
  };

  const closeView = () => {
    setViewingEmployee(null);
  };

  // =========================================================
  // SAVE EMPLOYEE
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        department: formData.department || null,
        designation: formData.designation || null,
        joining_date: formData.joining_date || null,
      };

      if (editingEmployee) {
        await api.put(
          `/api/employees/${editingEmployee.id}`,
          payload
        );

        showToast(
          "Employee updated successfully."
        );
      } else {
        await api.post(
          "/api/employees",
          payload
        );

        showToast(
          "Employee added successfully."
        );
      }

      closeForm();

      await loadEmployees();
    } catch (error) {
      console.error(
        "Failed to save employee:",
        error
      );

      showToast(
        error?.response?.data?.detail ||
          "Failed to save employee."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // OPEN DELETE CONFIRMATION
  // =========================================================

  const handleDelete = (employee) => {
    // Prevent accidental deletion of an HR account.
    if (employee?.role === "hr") {
      showToast(
        "HR account cannot be deleted."
      );
      return;
    }

    setDeleteEmployee(employee);
  };

  // =========================================================
  // CLOSE DELETE CONFIRMATION
  // =========================================================

  const closeDeleteConfirmation = () => {
    setDeleteEmployee(null);
  };

  // =========================================================
  // CONFIRM DELETE EMPLOYEE
  // =========================================================

  const confirmDeleteEmployee = async () => {
    if (!deleteEmployee) {
      return;
    }

    // Extra safety check.
    if (deleteEmployee.role === "hr") {
      setDeleteEmployee(null);

      showToast(
        "HR account cannot be deleted."
      );

      return;
    }

    const employeeId = deleteEmployee.id;
    const employeeName =
      deleteEmployee.full_name || "Employee";

    try {
      // Close confirmation box immediately.
      setDeleteEmployee(null);

      await api.delete(
        `/api/employees/${employeeId}`
      );

      // Refresh employee list only.
      await loadEmployees();

      // Show success message.
      showToast(
        `${employeeName} deleted successfully.`
      );
    } catch (error) {
      console.error(
        "Failed to delete employee:",
        error
      );

      setDeleteEmployee(null);

      showToast(
        error?.response?.data?.detail ||
          "Failed to delete employee."
      );
    }
  };

  // =========================================================
  // STATUS CHANGE
  // =========================================================

  const handleStatusChange = async (employee) => {
    try {
      await api.patch(
        `/api/employees/${employee.id}/status`,
        {
          is_active: !employee.is_active,
        }
      );

      await loadEmployees();

      showToast(
        employee.is_active
          ? "Employee deactivated successfully."
          : "Employee activated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to update employee status:",
        error
      );

      showToast(
        error?.response?.data?.detail ||
          "Failed to update employee status."
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="employees-page">
        <PageHeader
          title="Employees"
          description="Manage employee information and profiles."
        />

        <div className="empty-panel">
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="employees-page">
        <PageHeader
          title="Employees"
          description="Manage employee information and profiles."
        />

        <div className="empty-panel">
          <h2>Unable to load employees</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadEmployees}
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
    <div className="employees-page">

      {/* =====================================================
          TOAST
          ===================================================== */}

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

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <PageHeader
        title="Employees"
        description="Manage employee information and profiles."
      />

      {/* =====================================================
          TOOLBAR
          ===================================================== */}

      <div className="employees-toolbar">
        <button
          type="button"
          className="text-button"
          onClick={openAddForm}
        >
          <UserPlus size={18} />
          Add Employee
        </button>
      </div>

      {/* =====================================================
          ADD / EDIT FORM
          ===================================================== */}

      {showForm && (
        <div className="panel employee-form-panel">
          <div className="panel-header employee-form-header">
            <div>
              <h2>
                {editingEmployee
                  ? "Edit Employee"
                  : "Add Employee"}
              </h2>

              <p>
                {editingEmployee
                  ? "Update employee information."
                  : "Enter the employee information below."}
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
            <div className="employee-form-grid">
              <div className="form-group">
                <label>Full Name *</label>

                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label>Department</label>

                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Example: Development"
                />
              </div>

              <div className="form-group">
                <label>Designation</label>

                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="Example: Python Developer"
                />
              </div>

              <div className="form-group">
                <label>Joining Date</label>

                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="employee-form-actions">
              <button
                type="button"
                onClick={closeForm}
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
                  : editingEmployee
                  ? "Save Changes"
                  : "Save Employee"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================
          EMPLOYEE LIST
          ===================================================== */}

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Employee List</h2>

            <p>
              {employees.length} employee
              {employees.length !== 1
                ? "s"
                : ""}{" "}
              registered
            </p>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="empty-panel">
            <h2>No employees found</h2>

            <p>
              There are no employees registered in the
              system.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead className="professional-table-head">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <strong>
                        {employee.full_name}
                      </strong>
                    </td>

                    <td>{employee.email}</td>

                    <td>
                      {employee.department ||
                        "Not assigned"}
                    </td>

                    <td>
                      {employee.designation ||
                        "Not assigned"}
                    </td>

                    <td>{employee.role}</td>

                    <td>
                      <span
                        className={`status-badge ${
                          employee.is_active
                            ? "success"
                            : "warning"
                        }`}
                      >
                        {employee.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="employee-actions">
                        <button
                          type="button"
                          title="View employee"
                          className="icon-button"
                          onClick={() =>
                            openView(employee)
                          }
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          title="Edit employee"
                          className="icon-button"
                          onClick={() =>
                            openEditForm(employee)
                          }
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          title={
                            employee.is_active
                              ? "Deactivate employee"
                              : "Activate employee"
                          }
                          className="icon-button"
                          onClick={() =>
                            handleStatusChange(
                              employee
                            )
                          }
                        >
                          <Power size={17} />
                        </button>

                        <button
                          type="button"
                          title="Delete employee"
                          className="icon-button"
                          onClick={() =>
                            handleDelete(employee)
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          VIEW EMPLOYEE MODAL
          ===================================================== */}

      {viewingEmployee && (
        <div className="employee-modal-overlay">
          <div className="panel employee-view-modal">
            <div className="panel-header employee-form-header">
              <div>
                <h2>Employee Details</h2>

                <p>
                  View complete employee information.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeView}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="employee-profile-section">
              {viewingEmployee.profile_image_url ? (
                <img
                  src={
                    viewingEmployee.profile_image_url
                  }
                  alt={viewingEmployee.full_name}
                  className="employee-profile-image"
                />
              ) : (
                <div className="employee-profile-avatar">
                  {viewingEmployee.full_name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>
              )}

              <div>
                <h2 className="employee-profile-name">
                  {viewingEmployee.full_name}
                </h2>

                <p className="employee-profile-designation">
                  {viewingEmployee.designation ||
                    "Designation not assigned"}
                </p>

                <span
                  className={`status-badge ${
                    viewingEmployee.is_active
                      ? "success"
                      : "warning"
                  }`}
                >
                  {viewingEmployee.is_active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
            </div>

            <div className="employee-info-section">
              <h3>Basic Information</h3>

              <div className="employee-info-grid">
                <div>
                  <strong>Email</strong>
                  <p>
                    {viewingEmployee.email || "-"}
                  </p>
                </div>

                <div>
                  <strong>Phone</strong>
                  <p>
                    {viewingEmployee.phone || "-"}
                  </p>
                </div>

                <div>
                  <strong>Role</strong>
                  <p>
                    {viewingEmployee.role || "-"}
                  </p>
                </div>

                <div>
                  <strong>Date of Birth</strong>
                  <p>
                    {viewingEmployee.date_of_birth ||
                      "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="employee-info-section employee-employment-section">
              <h3>Employment Information</h3>

              <div className="employee-info-grid">
                <div>
                  <strong>Department</strong>
                  <p>
                    {viewingEmployee.department ||
                      "Not assigned"}
                  </p>
                </div>

                <div>
                  <strong>Designation</strong>
                  <p>
                    {viewingEmployee.designation ||
                      "Not assigned"}
                  </p>
                </div>

                <div>
                  <strong>Joining Date</strong>
                  <p>
                    {viewingEmployee.joining_date ||
                      "-"}
                  </p>
                </div>

                <div>
                  <strong>Account Status</strong>
                  <p>
                    {viewingEmployee.is_active
                      ? "Active"
                      : "Inactive"}
                  </p>
                </div>
              </div>
            </div>

            <div className="employee-view-actions">
              <button
                type="button"
                onClick={closeView}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DELETE EMPLOYEE CONFIRMATION
          ===================================================== */}

      {deleteEmployee && (
        <div
          className="employee-modal-overlay"
          onClick={closeDeleteConfirmation}
        >
          <div
            className="panel employee-view-modal delete-confirm-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="panel-header employee-form-header">
              <div>
                <h2>Delete Employee</h2>

                <p>
                  Please confirm this action.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeDeleteConfirmation}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "28px 22px 10px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: "#fef2f2",
                  color: "#dc2626",
                }}
              >
                <Trash2 size={24} />
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                  color: "#172033",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                Are you sure you want to delete
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#dc2626",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                {deleteEmployee.full_name}
              </p>

              <p
                style={{
                  margin: "10px 0 0",
                  color: "#667085",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                This action cannot be undone.
              </p>
            </div>

            <div
              className="employee-view-actions"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={closeDeleteConfirmation}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteEmployee}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                }}
              >
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;

