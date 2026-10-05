import { useEffect, useState } from "react";
import {
  Eye,
  FileText,
  Clock3,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/common/PageHeader";
import "./Leaves.css";

function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const [statusData, setStatusData] = useState({
    leaveId: null,
    status: "",
    hr_comment: "",
  });

  const [statusModal, setStatusModal] = useState({
    leave: null,
    status: "",
    hr_comment: "",
  });

  const [selectedLeave, setSelectedLeave] = useState(null);

  const [selectedRevokedLeave, setSelectedRevokedLeave] =
    useState(null);

  const [approvingRevoked, setApprovingRevoked] =
    useState(false);

  const [revokeLeave, setRevokeLeave] = useState(null);

  // ============================================================
  // TOAST MESSAGE
  // ============================================================

  const showToast = (message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // ============================================================
  // LOAD USER
  // ============================================================

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadLeaves();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const response = await api.get("/api/auth/me");
      setUser(response.data);
    } catch (err) {
      console.error("Failed to load user:", err);
      setError("Failed to load user information.");
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD LEAVES
  // ============================================================

  const loadLeaves = async () => {
    try {
      setLoading(true);
      setError("");

      const isHR = user?.role?.toLowerCase() === "hr";

      const response = await api.get(
        isHR ? "/api/leaves/all" : "/api/leaves"
      );

      setLeaves(response.data || []);
    } catch (err) {
      console.error("Failed to load leaves:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to load leave requests."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORM INPUT
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // EMPLOYEE - APPLY LEAVE
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.start_date || !formData.end_date) {
      showToast("Please select start date and end date.");
      return;
    }

    if (formData.end_date < formData.start_date) {
      showToast("End date cannot be before start date.");
      return;
    }

    if (!formData.reason.trim()) {
      showToast("Please enter leave reason.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/api/leaves", {
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason.trim(),
      });

      showToast("Leave request submitted successfully.");

      setFormData({
        start_date: "",
        end_date: "",
        reason: "",
      });

      await loadLeaves();
    } catch (err) {
      console.error("Failed to submit leave:", err);

      showToast(
        err.response?.data?.detail ||
          "Failed to submit leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // HR - OPEN APPROVE / REJECT CONFIRMATION
  // ============================================================

  const handleStatusChange = (leave, status) => {
    setStatusModal({
      leave,
      status,
      hr_comment: "",
    });
  };

  // ============================================================
  // HR - CONFIRM APPROVE / REJECT
  // ============================================================

  const confirmStatusChange = async () => {
    if (!statusModal.leave || !statusModal.status) {
      return;
    }

    try {
      const status = statusModal.status;

      await api.patch(
        `/api/leaves/${statusModal.leave.id}/status`,
        {
          status,
          hr_comment:
            statusModal.hr_comment.trim() || null,
        }
      );

      setStatusModal({
        leave: null,
        status: "",
        hr_comment: "",
      });

      showToast(
        `Leave request ${status} successfully.`
      );

      setStatusData({
        leaveId: null,
        status: "",
        hr_comment: "",
      });

      await loadLeaves();
    } catch (err) {
      console.error(
        "Failed to update leave status:",
        err
      );

      showToast(
        err.response?.data?.detail ||
          "Failed to update leave status."
      );
    }
  };

  // ============================================================
  // HR - OPEN REVOKE CONFIRMATION
  // ============================================================

  const handleRevoke = (leave) => {
    setRevokeLeave(leave);
  };

  // ============================================================
  // HR - CONFIRM REVOKE APPROVED LEAVE
  // ============================================================

  const confirmRevoke = async () => {
    if (!revokeLeave) {
      return;
    }

    try {
      await api.patch(
        `/api/leaves/${revokeLeave.id}/revoke`
      );

      setRevokeLeave(null);

      showToast("Leave revoked successfully.");

      await loadLeaves();
    } catch (err) {
      console.error(
        "Failed to revoke leave:",
        err
      );

      setRevokeLeave(null);

      showToast(
        err.response?.data?.detail ||
          "Failed to revoke leave."
      );
    }
  };

  // ============================================================
  // HR - APPROVE REVOKED LEAVE AGAIN
  // ============================================================

  const handleApproveRevoked = async () => {
    if (!selectedRevokedLeave) {
      return;
    }

    try {
      setApprovingRevoked(true);

      await api.patch(
        `/api/leaves/${selectedRevokedLeave.id}/approve-revoked`
      );

      showToast(
        "Revoked leave approved again successfully."
      );

      setSelectedRevokedLeave(null);

      await loadLeaves();
    } catch (err) {
      console.error(
        "Failed to approve revoked leave:",
        err
      );

      showToast(
        err.response?.data?.detail ||
          "Failed to approve revoked leave."
      );
    } finally {
      setApprovingRevoked(false);
    }
  };

  // ============================================================
  // EMPLOYEE - CANCEL LEAVE
  // ============================================================

  const handleCancel = async (leaveId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this leave request?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/api/leaves/${leaveId}`);

      showToast(
        "Leave request cancelled successfully."
      );

      await loadLeaves();
    } catch (err) {
      console.error(
        "Failed to cancel leave:",
        err
      );

      showToast(
        err.response?.data?.detail ||
          "Failed to cancel leave request."
      );
    }
  };

  // ============================================================
  // COUNTS
  // ============================================================

  const totalLeaves = leaves.length;

  const pendingLeaves = leaves.filter(
    (leave) =>
      leave.status?.toLowerCase() === "pending"
  ).length;

  const approvedLeaves = leaves.filter(
    (leave) =>
      leave.status?.toLowerCase() === "approved"
  ).length;

  const rejectedLeaves = leaves.filter(
    (leave) =>
      leave.status?.toLowerCase() === "rejected"
  ).length;

  const revokedLeaves = leaves.filter(
    (leave) =>
      leave.status?.toLowerCase() === "revoked"
  ).length;

  const isHR =
    user?.role?.toLowerCase() === "hr";

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="leaves-page">
        <div className="loading">
          Loading leave requests...
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="leaves-page">

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
            ? "Leave Management"
            : "My Leaves"
        }
        description={
          isHR
            ? "View and manage employee leave requests."
            : "View and manage your leave requests."
        }
      />

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!isHR && (
        <div className="card leave-form-card">
          <h2>Apply for Leave</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Start Date</label>

                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date</label>

                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={
                    formData.start_date ||
                    undefined
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Reason</label>

              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Enter leave reason"
                rows="4"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="primary-button"
            >
              {submitting
                ? "Submitting..."
                : "Apply Leave"}
            </button>
          </form>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon total">
            <FileText size={19} />
          </div>

          <div className="stat-card-content">
            <h3>Total Requests</h3>
            <strong>{totalLeaves}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon pending">
            <Clock3 size={19} />
          </div>

          <div className="stat-card-content">
            <h3>Pending</h3>
            <strong>{pendingLeaves}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon approved">
            <CheckCircle2 size={19} />
          </div>

          <div className="stat-card-content">
            <h3>Approved</h3>
            <strong>{approvedLeaves}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon rejected">
            <XCircle size={19} />
          </div>

          <div className="stat-card-content">
            <h3>Rejected</h3>
            <strong>{rejectedLeaves}</strong>
          </div>
        </div>

        {isHR && (
          <div className="stat-card">
            <div className="stat-card-icon revoked">
              <RotateCcw size={19} />
            </div>

            <div className="stat-card-content">
              <h3>Revoked</h3>
              <strong>{revokedLeaves}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="card leave-list-card">
        <div className="card-header">
          <h2>
            {isHR
              ? "All Leave Requests"
              : "My Leave Requests"}
          </h2>
        </div>

        {leaves.length === 0 ? (
          <div className="empty-state">
            No leave requests found.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {isHR && <th>Employee</th>}
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>HR Comment</th>
                  <th>Actions</th>
                  <th>View</th>
                </tr>
              </thead>

              <tbody>
                {leaves.map((leave) => {
                  const status =
                    leave.status?.toLowerCase();

                  return (
                    <tr key={leave.id}>
                      {isHR && (
                        <td>
                          <strong>
                            {leave.employee_name ||
                              `Employee #${leave.employee_id}`}
                          </strong>
                        </td>
                      )}

                      <td>
                        {formatDate(
                          leave.start_date
                        )}
                      </td>

                      <td>
                        {formatDate(
                          leave.end_date
                        )}
                      </td>

                      <td>
                        <div className="reason-cell">
                          <span className="reason-text">
                            {leave.reason}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`status-badge status-${status}`}
                        >
                          {leave.status}
                        </span>
                      </td>

                      <td>
                        {leave.hr_comment || "-"}
                      </td>

                      <td>
                        {isHR &&
                          status === "pending" && (
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="approve-button"
                                onClick={() =>
                                  handleStatusChange(
                                    leave,
                                    "approved"
                                  )
                                }
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                className="reject-button"
                                onClick={() =>
                                  handleStatusChange(
                                    leave,
                                    "rejected"
                                  )
                                }
                              >
                                Reject
                              </button>
                            </div>
                          )}

                        {isHR &&
                          status === "approved" && (
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="revoke-button"
                                onClick={() =>
                                  handleRevoke(leave)
                                }
                              >
                                Revoke
                              </button>
                            </div>
                          )}

                        {isHR &&
                          status === "revoked" && (
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="approve-button"
                                onClick={() =>
                                  setSelectedRevokedLeave(
                                    leave
                                  )
                                }
                              >
                                Approve
                              </button>
                            </div>
                          )}

                        {!isHR &&
                          status === "pending" && (
                            <button
                              type="button"
                              className="cancel-button"
                              onClick={() =>
                                handleCancel(
                                  leave.id
                                )
                              }
                            >
                              Cancel
                            </button>
                          )}

                        {!isHR &&
                          status === "approved" && (
                            <span className="reviewed-text">
                              No action
                            </span>
                          )}

                        {status !== "pending" &&
                          status !== "approved" &&
                          status !== "revoked" && (
                            <span className="reviewed-text">
                              {isHR
                                ? "Reviewed"
                                : "No action"}
                            </span>
                          )}

                        {!isHR &&
                          status === "revoked" && (
                            <span className="reviewed-text">
                              No action
                            </span>
                          )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="leave-view-button"
                          title="View leave details"
                          onClick={() =>
                            setSelectedLeave(leave)
                          }
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================
          APPROVE / REJECT LEAVE CONFIRMATION
          ============================================================ */}

      {statusModal.leave && (
        <div
          className="leave-modal-overlay"
          onClick={() =>
            setStatusModal({
              leave: null,
              status: "",
              hr_comment: "",
            })
          }
        >
          <div
            className="leave-modal status-action-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="leave-modal-header">
              <div>
                <h2>
                  {statusModal.status === "approved"
                    ? "Approve Leave"
                    : "Reject Leave"}
                </h2>

                <p className="status-modal-subtitle">
                  Review the leave request before
                  taking action.
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={() =>
                  setStatusModal({
                    leave: null,
                    status: "",
                    hr_comment: "",
                  })
                }
              >
                ×
              </button>
            </div>

            <div className="leave-modal-body">
              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Employee
                </span>

                <strong>
                  {statusModal.leave.employee_name ||
                    `Employee #${statusModal.leave.employee_id}`}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Leave ID
                </span>

                <strong>
                  #{statusModal.leave.id}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Start Date
                </span>

                <strong>
                  {formatDate(
                    statusModal.leave.start_date
                  )}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  End Date
                </span>

                <strong>
                  {formatDate(
                    statusModal.leave.end_date
                  )}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Reason
                </span>

                <p>
                  {statusModal.leave.reason || "-"}
                </p>
              </div>

              <div className="status-comment-group">
                <label htmlFor="hr-comment">
                  HR Comment
                  <span className="optional-label">
                    Optional
                  </span>
                </label>

                <textarea
                  id="hr-comment"
                  value={statusModal.hr_comment}
                  onChange={(event) =>
                    setStatusModal((previous) => ({
                      ...previous,
                      hr_comment: event.target.value,
                    }))
                  }
                  placeholder={
                    statusModal.status === "approved"
                      ? "Enter approval comment..."
                      : "Enter rejection comment..."
                  }
                  rows="4"
                />
              </div>

              <div
                className={`status-confirmation-box ${
                  statusModal.status === "approved"
                    ? "approve-confirmation"
                    : "reject-confirmation"
                }`}
              >
                {statusModal.status === "approved"
                  ? "Are you sure you want to approve this leave request?"
                  : "Are you sure you want to reject this leave request?"}
              </div>
            </div>

            <div className="leave-modal-footer">
              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  setStatusModal({
                    leave: null,
                    status: "",
                    hr_comment: "",
                  })
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  statusModal.status === "approved"
                    ? "approve-modal-button"
                    : "reject-modal-button"
                }
                onClick={confirmStatusChange}
              >
                {statusModal.status === "approved"
                  ? "Approve Leave"
                  : "Reject Leave"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLeave && (
        <div
          className="leave-modal-overlay"
          onClick={() =>
            setSelectedLeave(null)
          }
        >
          <div
            className="leave-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="leave-modal-header">
              <h2>Leave Details</h2>

              <button
                type="button"
                className="modal-close-button"
                onClick={() =>
                  setSelectedLeave(null)
                }
              >
                ×
              </button>
            </div>

            <div className="leave-modal-body">
              {isHR && (
                <div className="leave-detail-item">
                  <span className="leave-detail-label">
                    Employee
                  </span>

                  <strong>
                    {selectedLeave.employee_name ||
                      `Employee #${selectedLeave.employee_id}`}
                  </strong>
                </div>
              )}

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Leave ID
                </span>

                <strong>
                  #{selectedLeave.id}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Start Date
                </span>

                <strong>
                  {formatDate(
                    selectedLeave.start_date
                  )}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  End Date
                </span>

                <strong>
                  {formatDate(
                    selectedLeave.end_date
                  )}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Status
                </span>

                <span
                  className={`status-badge status-${selectedLeave.status?.toLowerCase()}`}
                >
                  {selectedLeave.status}
                </span>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Reason
                </span>

                <p>
                  {selectedLeave.reason || "-"}
                </p>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  HR Comment
                </span>

                <p>
                  {selectedLeave.hr_comment || "-"}
                </p>
              </div>
            </div>

            <div className="leave-modal-footer">
              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setSelectedLeave(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRevokedLeave && (
        <div
          className="leave-modal-overlay"
          onClick={() => {
            if (!approvingRevoked) {
              setSelectedRevokedLeave(null);
            }
          }}
        >
          <div
            className="leave-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="leave-modal-header">
              <h2>Approve Leave</h2>

              <button
                type="button"
                className="modal-close-button"
                disabled={approvingRevoked}
                onClick={() =>
                  setSelectedRevokedLeave(null)
                }
              >
                ×
              </button>
            </div>

            <div className="leave-modal-body">
              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Employee
                </span>

                <strong>
                  {selectedRevokedLeave.employee_name ||
                    `Employee #${selectedRevokedLeave.employee_id}`}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Leave ID
                </span>

                <strong>
                  #{selectedRevokedLeave.id}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Start Date
                </span>

                <strong>
                  {formatDate(
                    selectedRevokedLeave.start_date
                  )}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  End Date
                </span>

                <strong>
                  {formatDate(
                    selectedRevokedLeave.end_date
                  )}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Status
                </span>

                <span className="status-badge status-revoked">
                  {selectedRevokedLeave.status}
                </span>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Reason
                </span>

                <p>
                  {selectedRevokedLeave.reason ||
                    "-"}
                </p>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  HR Comment
                </span>

                <p>
                  {selectedRevokedLeave.hr_comment ||
                    "-"}
                </p>
              </div>
            </div>

            <div className="leave-modal-footer">
              <button
                type="button"
                className="cancel-button"
                disabled={approvingRevoked}
                onClick={() =>
                  setSelectedRevokedLeave(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                disabled={approvingRevoked}
                onClick={handleApproveRevoked}
              >
                {approvingRevoked
                  ? "Approving..."
                  : "Approve Leave"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          REVOKE LEAVE CONFIRMATION
          ============================================================ */}

      {revokeLeave && (
        <div
          className="leave-modal-overlay"
          onClick={() => setRevokeLeave(null)}
        >
          <div
            className="leave-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="leave-modal-header">
              <div>
                <h2>Revoke Leave</h2>

                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#667085",
                    fontSize: "13px",
                  }}
                >
                  Review the leave details before
                  revoking.
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={() =>
                  setRevokeLeave(null)
                }
              >
                ×
              </button>
            </div>

            <div className="leave-modal-body">
              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Employee
                </span>

                <strong>
                  {revokeLeave.employee_name ||
                    `Employee #${revokeLeave.employee_id}`}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Leave ID
                </span>

                <strong>
                  #{revokeLeave.id}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Start Date
                </span>

                <strong>
                  {formatDate(
                    revokeLeave.start_date
                  )}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  End Date
                </span>

                <strong>
                  {formatDate(
                    revokeLeave.end_date
                  )}
                </strong>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Status
                </span>

                <span className="status-badge status-approved">
                  {revokeLeave.status}
                </span>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  Reason
                </span>

                <p>
                  {revokeLeave.reason || "-"}
                </p>
              </div>

              <div className="leave-detail-item">
                <span className="leave-detail-label">
                  HR Comment
                </span>

                <p>
                  {revokeLeave.hr_comment || "-"}
                </p>
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
                Are you sure you want to revoke this
                approved leave?
              </div>
            </div>

            <div className="leave-modal-footer">
              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  setRevokeLeave(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="revoke-button"
                onClick={confirmRevoke}
              >
                Revoke Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaves;