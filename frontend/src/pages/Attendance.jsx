import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Clock,
  LogIn,
  LogOut,
  CalendarDays,
  CheckCircle,
  AlertCircle,
  FileEdit,
  X,
  Check,
  XCircle,
  ClipboardList,
  UserCheck,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Attendance.css";
import PageHeader from "../components/common/PageHeader";


// ============================================================
// GET TODAY DATE - INDIA TIME
// ============================================================

const getTodayDate = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};


// ============================================================
// FORMAT TIME
// ============================================================

const formatTime = (time) => {
  if (!time) {
    return "-";
  }

  const parts = time.split(":");

  if (parts.length < 2) {
    return time;
  }

  const hour = Number(parts[0]);
  const minute = parts[1];

  const period = hour >= 12 ? "PM" : "AM";

  const displayHour =
    hour % 12 === 0
      ? 12
      : hour % 12;

  return `${displayHour}:${minute} ${period}`;
};


// ============================================================
// FORMAT DATE
// ============================================================

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  const value = new Date(
    `${date}T00:00:00`
  );

  return value.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


// ============================================================
// FORMAT WORKING HOURS
// ============================================================

const formatWorkingHours = (hours) => {
  if (
    hours === null ||
    hours === undefined ||
    Number.isNaN(Number(hours))
  ) {
    return "-";
  }

  const totalMinutes = Math.round(
    Number(hours) * 60
  );

  if (totalMinutes < 1) {
    return "0 mins";
  }

  const hrs = Math.floor(
    totalMinutes / 60
  );

  const mins = totalMinutes % 60;

  if (hrs === 0) {
    return `${mins} min${
      mins !== 1 ? "s" : ""
    }`;
  }

  if (mins === 0) {
    return `${hrs} hr${
      hrs !== 1 ? "s" : ""
    }`;
  }

  return `${hrs} hr${
    hrs !== 1 ? "s" : ""
  } ${mins} min${
    mins !== 1 ? "s" : ""
  }`;
};


// ============================================================
// NORMALIZE CORRECTION STATUS
// ============================================================

const formatCorrectionStatus = (status) => {
  if (!status) {
    return "-";
  }

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
};


// ============================================================
// ATTENDANCE COMPONENT
// ============================================================

const Attendance = () => {
  const { user } = useAuth();

  const isHR =
    String(user?.role || "")
      .trim()
      .toLowerCase() === "hr";


  // ==========================================================
  // ATTENDANCE STATE
  // ==========================================================

  const [attendance, setAttendance] =
    useState([]);

  const [todayAttendance, setTodayAttendance] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================================
  // AUTO HIDE SUCCESS / ERROR MESSAGE
  // ==========================================================

  useEffect(() => {
    if (!success && !error) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success, error]);


  // ==========================================================
  // EMPLOYEE CORRECTION STATE
  // ==========================================================

  const [
    myCorrectionRequests,
    setMyCorrectionRequests,
  ] = useState([]);

  const [
    correctionLoading,
    setCorrectionLoading,
  ] = useState(false);

  const [
    correctionModalOpen,
    setCorrectionModalOpen,
  ] = useState(false);

  const [
    correctionSubmitting,
    setCorrectionSubmitting,
  ] = useState(false);

  const [
    requestedCheckIn,
    setRequestedCheckIn,
  ] = useState("");

  const [
    requestedCheckOut,
    setRequestedCheckOut,
  ] = useState("");

  const [
    correctionReason,
    setCorrectionReason,
  ] = useState("");


  // ==========================================================
  // HR CORRECTION STATE
  // ==========================================================

  const [
    correctionRequests,
    setCorrectionRequests,
  ] = useState([]);

  const [
    reviewModalOpen,
    setReviewModalOpen,
  ] = useState(false);

  const [
    selectedCorrection,
    setSelectedCorrection,
  ] = useState(null);

  const [
    reviewStatus,
    setReviewStatus,
  ] = useState("");

  const [
    hrComment,
    setHrComment,
  ] = useState("");

  const [
    reviewLoading,
    setReviewLoading,
  ] = useState(false);


  // ==========================================================
  // LOAD ATTENDANCE
  // ==========================================================

  const loadAttendance = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const endpoint = isHR
          ? "/api/attendance/all"
          : "/api/attendance";

        const response =
          await api.get(endpoint);

        const records =
          response.data || [];

        setAttendance(records);


        // ====================================================
        // EMPLOYEE TODAY ATTENDANCE
        // ====================================================

        if (!isHR) {
          const today =
            getTodayDate();

          const todayRecord =
            records.find(
              (item) =>
                item.attendance_date === today
            );

          setTodayAttendance(
            todayRecord || null
          );
        } else {
          setTodayAttendance(null);
        }

      } catch (err) {
        console.error(
          "Failed to load attendance:",
          err
        );

        console.error(
          "Status:",
          err.response?.status
        );

        console.error(
          "Response:",
          err.response?.data
        );

        setError(
          err.response?.data?.detail ||
          "Failed to load attendance."
        );

      } finally {
        setLoading(false);
      }
    },
    [isHR]
  );


  // ==========================================================
  // LOAD EMPLOYEE CORRECTION REQUESTS
  // ==========================================================

  const loadMyCorrectionRequests =
    useCallback(
      async () => {
        if (isHR) {
          return;
        }

        try {
          setCorrectionLoading(true);

          const response =
            await api.get(
              "/api/attendance/correction-requests/my"
            );

          setMyCorrectionRequests(
            response.data || []
          );

        } catch (err) {
          console.error(
            "Failed to load correction requests:",
            err
          );

          setError(
            err.response?.data?.detail ||
            "Failed to load correction requests."
          );

        } finally {
          setCorrectionLoading(false);
        }
      },
      [isHR]
    );


  // ==========================================================
  // LOAD HR CORRECTION REQUESTS
  // ==========================================================

  const loadCorrectionRequests =
    useCallback(
      async () => {
        if (!isHR) {
          return;
        }

        try {
          setCorrectionLoading(true);

          const response =
            await api.get(
              "/api/attendance/correction-requests"
            );

          setCorrectionRequests(
            response.data || []
          );

        } catch (err) {
          console.error(
            "Failed to load HR correction requests:",
            err
          );

          setError(
            err.response?.data?.detail ||
            "Failed to load correction requests."
          );

        } finally {
          setCorrectionLoading(false);
        }
      },
      [isHR]
    );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);


  // ==========================================================
  // LOAD CORRECTIONS
  // ==========================================================

  useEffect(() => {
    if (isHR) {
      loadCorrectionRequests();
    } else {
      loadMyCorrectionRequests();
    }
  }, [
    isHR,
    loadCorrectionRequests,
    loadMyCorrectionRequests,
  ]);


  // ==========================================================
  // CHECK IN
  // ==========================================================

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response =
        await api.post(
          "/api/attendance/check-in"
        );

      setTodayAttendance(
        response.data
      );

      setSuccess(
        "Check-in successful."
      );

      await loadAttendance();

    } catch (err) {
      console.error(
        "Check-in failed:",
        err
      );

      if (err.response?.data?.detail) {
        setError(
          err.response.data.detail
        );
      } else if (
        err.message === "Network Error"
      ) {
        setError(
          "Cannot connect to HRMS server. Please make sure the backend is running."
        );
      } else {
        setError(
          "Check-in failed. Please try again."
        );
      }

    } finally {
      setActionLoading(false);
    }
  };


  // ==========================================================
  // CHECK OUT
  // ==========================================================

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response =
        await api.post(
          "/api/attendance/check-out"
        );

      setTodayAttendance(
        response.data
      );

      setSuccess(
        "Check-out successful."
      );

      await loadAttendance();

    } catch (err) {
      console.error(
        "Check-out failed:",
        err
      );

      if (err.response?.data?.detail) {
        setError(
          err.response.data.detail
        );
      } else if (
        err.message === "Network Error"
      ) {
        setError(
          "Cannot connect to HRMS server. Please make sure the backend is running."
        );
      } else {
        setError(
          "Check-out failed. Please try again."
        );
      }

    } finally {
      setActionLoading(false);
    }
  };


  // ==========================================================
  // CHECK WHETHER CORRECTION IS ALREADY PENDING
  // ==========================================================

  const pendingCorrection =
    todayAttendance
      ? myCorrectionRequests.find(
          (item) =>
            item.attendance_id ===
              todayAttendance.id &&
            item.status === "pending"
        )
      : null;


  // ==========================================================
  // OPEN CORRECTION MODAL
  // ==========================================================

  const openCorrectionModal = () => {
    if (!todayAttendance) {
      return;
    }

    if (!todayAttendance.check_out) {
      setError(
        "You can request a correction after checking out."
      );
      return;
    }

    if (pendingCorrection) {
      setError(
        "A correction request is already pending for today's attendance."
      );
      return;
    }

    setError("");
    setSuccess("");

    setRequestedCheckIn("");
    setRequestedCheckOut(
      todayAttendance.check_out || ""
    );
    setCorrectionReason("");

    setCorrectionModalOpen(true);
  };


  // ==========================================================
  // CLOSE CORRECTION MODAL
  // ==========================================================

  const closeCorrectionModal = () => {
    if (correctionSubmitting) {
      return;
    }

    setCorrectionModalOpen(false);
    setRequestedCheckIn("");
    setRequestedCheckOut("");
    setCorrectionReason("");
  };


  // ==========================================================
  // SUBMIT CORRECTION REQUEST
  // ==========================================================

  const handleSubmitCorrection =
    async (event) => {
      event.preventDefault();

      if (!todayAttendance) {
        return;
      }

      const hasCheckIn =
        requestedCheckIn.trim() !== "";

      const hasCheckOut =
        requestedCheckOut.trim() !== "";

      if (!hasCheckIn && !hasCheckOut) {
        setError(
          "Please provide a corrected check-in or check-out time."
        );
        return;
      }

      if (!correctionReason.trim()) {
        setError(
          "Please enter a reason for the correction."
        );
        return;
      }

      if (
        hasCheckIn &&
        hasCheckOut &&
        requestedCheckOut <= requestedCheckIn
      ) {
        setError(
          "Requested check-out time must be after check-in time."
        );
        return;
      }

      try {
        setCorrectionSubmitting(true);
        setError("");
        setSuccess("");

        const response =
          await api.post(
            `/api/attendance/correction-request/${todayAttendance.id}`,
            {
              requested_check_in:
                hasCheckIn
                  ? requestedCheckIn
                  : null,

              requested_check_out:
                hasCheckOut
                  ? requestedCheckOut
                  : null,

              reason:
                correctionReason.trim(),
            }
          );

        setMyCorrectionRequests(
          (previous) => [
            response.data,
            ...previous,
          ]
        );

        setCorrectionModalOpen(false);

        setRequestedCheckIn("");
        setRequestedCheckOut("");
        setCorrectionReason("");

        setSuccess(
          "Attendance correction request submitted successfully."
        );

      } catch (err) {
        console.error(
          "Correction request failed:",
          err
        );

        setError(
          err.response?.data?.detail ||
          "Failed to submit correction request."
        );

      } finally {
        setCorrectionSubmitting(false);
      }
    };


  // ==========================================================
  // OPEN HR REVIEW MODAL
  // ==========================================================

  const openReviewModal = (
    correction
  ) => {
    setSelectedCorrection(
      correction
    );

    setReviewStatus("");
    setHrComment("");

    setReviewModalOpen(true);
    setError("");
    setSuccess("");
  };


  // ==========================================================
  // CLOSE HR REVIEW MODAL
  // ==========================================================

  const closeReviewModal = () => {
    if (reviewLoading) {
      return;
    }

    setReviewModalOpen(false);
    setSelectedCorrection(null);
    setReviewStatus("");
    setHrComment("");
  };


  // ==========================================================
  // REVIEW CORRECTION REQUEST
  // ==========================================================

  const handleReviewCorrection =
    async (statusValue) => {
      if (!selectedCorrection) {
        return;
      }

      try {
        setReviewLoading(true);
        setError("");
        setSuccess("");

        const response =
          await api.put(
            `/api/attendance/correction-requests/${selectedCorrection.id}/review`,
            {
              status: statusValue,
              hr_comment:
                hrComment.trim()
                  ? hrComment.trim()
                  : null,
            }
          );

        setCorrectionRequests(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                selectedCorrection.id
                  ? response.data
                  : item
            )
        );

        setReviewModalOpen(false);
        setSelectedCorrection(null);
        setReviewStatus("");
        setHrComment("");

        setSuccess(
          `Correction request ${statusValue} successfully.`
        );

        await loadAttendance();

      } catch (err) {
        console.error(
          "Correction review failed:",
          err
        );

        setError(
          err.response?.data?.detail ||
          "Failed to review correction request."
        );

      } finally {
        setReviewLoading(false);
      }
    };


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalRecords =
    attendance.length;

  const presentRecords =
    attendance.filter(
      (item) =>
        item.status === "present"
    ).length;

  const totalWorkingHours =
    attendance.reduce(
      (total, item) =>
        total +
        Number(
          item.working_hours || 0
        ),
      0
    );


  // ==========================================================
  // GET EMPLOYEE NAME
  // ==========================================================

  const getEmployeeName = (employeeId) => {
    const employee = attendance.find(
      (item) =>
        Number(item.employee_id) ===
        Number(employeeId)
    );

    return (
      employee?.employee_name ||
      employee?.employee?.full_name ||
      employee?.employee?.name ||
      `Employee #${employeeId}`
    );
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="attendance-page">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="attendance-header">

        <PageHeader
          title="Attendance"
          description={
            isHR
              ? "View and monitor employee attendance."
              : "Check in, check out, and view your attendance."
          }
        />

      </div>


      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (
        <div className="attendance-alert attendance-alert-error">

          <AlertCircle
            size={18}
          />

          <span>
            {error}
          </span>

          <button
            className="attendance-alert-close"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* ================================================== */}
      {/* SUCCESS */}
      {/* ================================================== */}

      {success && (
        <div className="attendance-alert attendance-alert-success">

          <CheckCircle
            size={18}
          />

          <span>
            {success}
          </span>

          <button
            className="attendance-alert-close"
            onClick={() => setSuccess("")}
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* ================================================== */}
      {/* EMPLOYEE TODAY ATTENDANCE */}
      {/* ================================================== */}

      {!isHR && (
        <section className="attendance-today-card">

          <div className="attendance-card-header">

            <div>

              <div className="attendance-card-title">

                <CalendarDays
                  size={20}
                />

                Today's Attendance

              </div>

              <p>
                {formatDate(
                  getTodayDate()
                )}
              </p>

            </div>


            <div className="attendance-actions">

              {!todayAttendance && (
                <button
                  className="attendance-checkin-button"
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                >

                  <LogIn
                    size={18}
                  />

                  {actionLoading
                    ? "Processing..."
                    : "Check In"}

                </button>
              )}


              {todayAttendance &&
                !todayAttendance.check_out && (
                  <button
                    className="attendance-checkout-button"
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                  >

                    <LogOut
                      size={18}
                    />

                    {actionLoading
                      ? "Processing..."
                      : "Check Out"}

                  </button>
                )}


              {todayAttendance &&
                todayAttendance.check_out && (
                  <button
                    className="attendance-correction-button"
                    onClick={openCorrectionModal}
                    disabled={
                      correctionSubmitting ||
                      Boolean(pendingCorrection)
                    }
                  >

                    <FileEdit
                      size={18}
                    />

                    {pendingCorrection
                      ? "Correction Pending"
                      : "Request Correction"}

                  </button>
                )}

            </div>

          </div>


          {!todayAttendance && (
            <div className="attendance-empty-today">

              <Clock
                size={38}
              />

              <h3>
                Not Checked In
              </h3>

              <p>
                Click Check In to start
                your workday.
              </p>

            </div>
          )}


          {todayAttendance && (
            <div className="attendance-today-details">

              <div>

                <span>
                  Status
                </span>

                <strong>
                  {todayAttendance.status}
                </strong>

              </div>


              <div>

                <span>
                  Check In
                </span>

                <strong>
                  {formatTime(
                    todayAttendance.check_in
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Check Out
                </span>

                <strong>
                  {formatTime(
                    todayAttendance.check_out
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Working Hours
                </span>

                <strong>
                  {formatWorkingHours(
                    todayAttendance.working_hours
                  )}
                </strong>

              </div>

            </div>
          )}

        </section>
      )}


      {/* ================================================== */}
      {/* EMPLOYEE CORRECTION HISTORY */}
      {/* ================================================== */}

      {!isHR && (
        <section className="attendance-correction-card">

          <div className="attendance-card-header">

            <div>

              <div className="attendance-card-title">

                <FileEdit
                  size={20}
                />

                Attendance Correction Requests

              </div>

              <p>
                Track your attendance correction requests.
              </p>

            </div>

          </div>


          {correctionLoading ? (

            <div className="attendance-loading">
              Loading correction requests...
            </div>

          ) : myCorrectionRequests.length === 0 ? (

            <div className="attendance-empty-corrections">

              <FileEdit
                size={36}
              />

              <h3>
                No correction requests
              </h3>

              <p>
                Your attendance correction requests
                will appear here.
              </p>

            </div>

          ) : (

            <div className="attendance-correction-list">

              {myCorrectionRequests.map(
                (request) => (
                  <div
                    className="attendance-correction-item"
                    key={request.id}
                  >

                    <div className="attendance-correction-main">

                      <div>

                        <span>
                          Attendance Date
                        </span>

                        <strong>
                          {(() => {
                            const record =
                              attendance.find(
                                (item) =>
                                  item.id ===
                                  request.attendance_id
                              );

                            return record
                              ? formatDate(
                                  record.attendance_date
                                )
                              : "-";
                          })()}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Requested Check-in
                        </span>

                        <strong>
                          {formatTime(
                            request.requested_check_in
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Requested Check-out
                        </span>

                        <strong>
                          {formatTime(
                            request.requested_check_out
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Status
                        </span>

                        <strong
                          className={`correction-status correction-status-${request.status}`}
                        >
                          {formatCorrectionStatus(
                            request.status
                          )}
                        </strong>

                      </div>

                    </div>


                    <div className="attendance-correction-reason">

                      <span>
                        Reason
                      </span>

                      <p>
                        {request.reason}
                      </p>

                    </div>


                    {request.hr_comment && (
                      <div className="attendance-correction-comment">

                        <span>
                          HR Comment
                        </span>

                        <p>
                          {request.hr_comment}
                        </p>

                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          )}

        </section>
      )}


      {/* ================================================== */}
      {/* HR TODAY INFORMATION */}
      {/* ================================================== */}

      {isHR && (
        <section className="attendance-today-card">

          <div className="attendance-card-header">

            <div>

              <div className="attendance-card-title">

                <CalendarDays
                  size={20}
                />

                Today's Attendance

              </div>

              <p>
                {formatDate(
                  getTodayDate()
                )}
              </p>

            </div>

          </div>


          <div className="attendance-empty-today">

            <Clock
              size={38}
            />

            <h3>
              Employee Attendance
            </h3>

            <p>
              View today's employee
              attendance records below.
            </p>

          </div>

        </section>
      )}


      {/* ================================================== */}
      {/* HR CORRECTION REQUESTS */}
      {/* ================================================== */}

      {isHR && (
        <section className="attendance-correction-card">

          <div className="attendance-card-header">

            <div>

              <div className="attendance-card-title">

                <FileEdit
                  size={20}
                />

                Attendance Correction Requests

              </div>

              <p>
                Review and manage employee attendance corrections.
              </p>

            </div>

          </div>


          {correctionLoading ? (

            <div className="attendance-loading">
              Loading correction requests...
            </div>

          ) : correctionRequests.length === 0 ? (

            <div className="attendance-empty-corrections">

              <FileEdit
                size={36}
              />

              <h3>
                No correction requests
              </h3>

              <p>
                Employee correction requests will appear here.
              </p>

            </div>

          ) : (

            <div className="attendance-table-wrapper">

              <table className="attendance-table correction-request-table">

                <thead>

                  <tr>

                    <th>
                      Employee
                    </th>

                    <th>
                      Attendance
                    </th>

                    <th>
                      Requested Check-in
                    </th>

                    <th>
                      Requested Check-out
                    </th>

                    <th>
                      Reason
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {correctionRequests.map(
                    (request) => {

                      const relatedAttendance =
                        attendance.find(
                          (item) =>
                            item.id ===
                            request.attendance_id
                        );

                      return (
                        <tr
                          key={request.id}
                        >

                          <td>
                            {getEmployeeName(
                              request.employee_id
                            )}
                          </td>


                          <td>
                            {relatedAttendance
                              ? formatDate(
                                  relatedAttendance.attendance_date
                                )
                              : "-"}
                          </td>


                          <td>
                            {formatTime(
                              request.requested_check_in
                            )}
                          </td>


                          <td>
                            {formatTime(
                              request.requested_check_out
                            )}
                          </td>


                          <td className="correction-reason-cell">
                            {request.reason}
                          </td>


                          <td>

                            <span
                              className={`correction-status correction-status-${request.status}`}
                            >
                              {formatCorrectionStatus(
                                request.status
                              )}
                            </span>

                          </td>


                          <td>

                            {request.status ===
                            "pending" ? (

                              <button
                                className="attendance-review-button"
                                onClick={() =>
                                  openReviewModal(
                                    request
                                  )
                                }
                              >

                                <FileEdit
                                  size={15}
                                />

                                Review

                              </button>

                            ) : (

                              <span className="attendance-reviewed-text">
                                Reviewed
                              </span>

                            )}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>
      )}


      {/* ================================================== */}
      {/* STATISTICS */}
      {/* ================================================== */}

      <section className="attendance-statistics">

        <div className="attendance-stat-card">

          <div className="attendance-stat-icon total">
            <ClipboardList size={20} />
          </div>

          <div className="attendance-stat-content">

            <span>
              Total Records
            </span>

            <strong>
              {totalRecords}
            </strong>

          </div>

        </div>


        <div className="attendance-stat-card">

          <div className="attendance-stat-icon present">
            <UserCheck size={20} />
          </div>

          <div className="attendance-stat-content">

            <span>
              Present
            </span>

            <strong>
              {presentRecords}
            </strong>

          </div>

        </div>


        <div className="attendance-stat-card">

          <div className="attendance-stat-icon hours">
            <Clock size={20} />
          </div>

          <div className="attendance-stat-content">

            <span>
              Total Working Hours
            </span>

            <strong>
              {formatWorkingHours(
                totalWorkingHours
              )}
            </strong>

          </div>

        </div>

      </section>


      {/* ================================================== */}
      {/* HISTORY */}
      {/* ================================================== */}

      <section className="attendance-history-card">

        <div className="attendance-card-header">

          <div>

            <div className="attendance-card-title">

              <CalendarDays
                size={20}
              />

              {isHR
                ? "Employee Attendance History"
                : "My Attendance History"}

            </div>

            <p>
              {isHR
                ? "Attendance records of all employees are shown below."
                : "Your attendance records are shown below."}
            </p>

          </div>

        </div>


        {loading ? (

          <div className="attendance-loading">
            Loading attendance...
          </div>

        ) : attendance.length === 0 ? (

          <div className="attendance-empty-history">

            <Clock
              size={40}
            />

            <h3>
              No attendance records
            </h3>

            <p>
              {isHR
                ? "There are no employee attendance records available yet."
                : "There are no attendance records available yet."}
            </p>

          </div>

        ) : (

          <div className="attendance-table-wrapper">

            <table className="attendance-table">

              <thead>

                <tr>

                  {isHR && (
                    <th>
                      Employee
                    </th>
                  )}

                  <th>
                    Date
                  </th>

                  <th>
                    Check In
                  </th>

                  <th>
                    Check Out
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Working Hours
                  </th>

                </tr>

              </thead>


              <tbody>

                {attendance.map(
                  (record) => (
                    <tr
                      key={record.id}
                    >

                      {isHR && (
                        <td>
                          {getEmployeeName(
                            record.employee_id
                          )}
                        </td>
                      )}


                      <td>
                        {formatDate(
                          record.attendance_date
                        )}
                      </td>


                      <td>
                        {formatTime(
                          record.check_in
                        )}
                      </td>


                      <td>
                        {formatTime(
                          record.check_out
                        )}
                      </td>


                      <td className="attendance-status-cell">
                        {record.status}
                      </td>


                      <td>
                        {formatWorkingHours(
                          record.working_hours
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>


      {/* ================================================== */}
      {/* EMPLOYEE CORRECTION MODAL */}
      {/* ================================================== */}

      {correctionModalOpen && (
        <div className="attendance-modal-overlay">

          <div className="attendance-modal">

            <div className="attendance-modal-header">

              <div>

                <h2>
                  Attendance Correction Request
                </h2>

                <p>
                  Submit corrected attendance details for HR review.
                </p>

              </div>

              <button
                className="attendance-modal-close"
                onClick={closeCorrectionModal}
                disabled={correctionSubmitting}
              >
                <X size={20} />
              </button>

            </div>


            <form
              onSubmit={
                handleSubmitCorrection
              }
            >

              <div className="attendance-modal-body">

                <div className="attendance-modal-info">

                  <div>
                    <span>
                      Attendance Date
                    </span>

                    <strong>
                      {todayAttendance
                        ? formatDate(
                            todayAttendance.attendance_date
                          )
                        : "-"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Current Check-in
                    </span>

                    <strong>
                      {formatTime(
                        todayAttendance?.check_in
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Current Check-out
                    </span>

                    <strong>
                      {formatTime(
                        todayAttendance?.check_out
                      )}
                    </strong>
                  </div>

                </div>


                <div className="attendance-form-grid">

                  <div className="attendance-form-group">

                    <label>
                      Requested Check-in
                    </label>

                    <input
                      type="time"
                      value={
                        requestedCheckIn
                      }
                      onChange={(event) =>
                        setRequestedCheckIn(
                          event.target.value
                        )
                      }
                    />

                    <small>
                      Leave empty if check-in does not need correction.
                    </small>

                  </div>


                  <div className="attendance-form-group">

                    <label>
                      Requested Check-out
                    </label>

                    <input
                      type="time"
                      value={
                        requestedCheckOut
                      }
                      onChange={(event) =>
                        setRequestedCheckOut(
                          event.target.value
                        )
                      }
                    />

                    <small>
                      Enter the correct checkout time.
                    </small>

                  </div>

                </div>


                <div className="attendance-form-group">

                  <label>
                    Reason <span>*</span>
                  </label>

                  <textarea
                    value={
                      correctionReason
                    }
                    onChange={(event) =>
                      setCorrectionReason(
                        event.target.value
                      )
                    }
                    placeholder="Explain why the attendance needs correction..."
                    rows={4}
                    maxLength={1000}
                    required
                  />

                  <small>
                    Minimum 5 characters.
                  </small>

                </div>

              </div>


              <div className="attendance-modal-footer">

                <button
                  type="button"
                  className="attendance-modal-cancel"
                  onClick={closeCorrectionModal}
                  disabled={
                    correctionSubmitting
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="attendance-modal-submit"
                  disabled={
                    correctionSubmitting
                  }
                >

                  <Check
                    size={17}
                  />

                  {correctionSubmitting
                    ? "Submitting..."
                    : "Submit Request"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* ================================================== */}
      {/* HR REVIEW MODAL */}
      {/* ================================================== */}

      {reviewModalOpen &&
        selectedCorrection && (
          <div className="attendance-modal-overlay">

            <div className="attendance-modal attendance-review-modal">

              <div className="attendance-modal-header">

                <div>

                  <h2>
                    Review Attendance Correction
                  </h2>

                  <p>
                    Review the employee's requested attendance change.
                  </p>

                </div>

                <button
                  className="attendance-modal-close"
                  onClick={
                    closeReviewModal
                  }
                  disabled={reviewLoading}
                >
                  <X size={20} />
                </button>

              </div>


              <div className="attendance-modal-body">

                <div className="attendance-review-summary">

                  <div>
                    <span>
                      Employee
                    </span>

                    <strong>
                      Employee #
                      {
                        selectedCorrection.employee_id
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Attendance ID
                    </span>

                    <strong>
                      {
                        selectedCorrection.attendance_id
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Requested Check-in
                    </span>

                    <strong>
                      {formatTime(
                        selectedCorrection.requested_check_in
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Requested Check-out
                    </span>

                    <strong>
                      {formatTime(
                        selectedCorrection.requested_check_out
                      )}
                    </strong>
                  </div>

                </div>


                <div className="attendance-review-reason">

                  <span>
                    Employee Reason
                  </span>

                  <p>
                    {
                      selectedCorrection.reason
                    }
                  </p>

                </div>


                <div className="attendance-form-group">

                  <label>
                    HR Comment
                  </label>

                  <textarea
                    value={hrComment}
                    onChange={(event) =>
                      setHrComment(
                        event.target.value
                      )
                    }
                    placeholder="Enter HR review comment..."
                    rows={4}
                    maxLength={1000}
                  />

                </div>

              </div>


              <div className="attendance-modal-footer">

                <button
                  type="button"
                  className="attendance-reject-button"
                  onClick={() =>
                    handleReviewCorrection(
                      "rejected"
                    )
                  }
                  disabled={
                    reviewLoading
                  }
                >

                  <XCircle
                    size={17}
                  />

                  {reviewLoading &&
                  reviewStatus ===
                    "rejected"
                    ? "Rejecting..."
                    : "Reject"}

                </button>


                <button
                  type="button"
                  className="attendance-approve-button"
                  onClick={() => {
                    setReviewStatus(
                      "approved"
                    );

                    handleReviewCorrection(
                      "approved"
                    );
                  }}
                  disabled={
                    reviewLoading
                  }
                >

                  <CheckCircle
                    size={17}
                  />

                  {reviewLoading &&
                  reviewStatus ===
                    "approved"
                    ? "Approving..."
                    : "Approve"}

                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
};


export default Attendance;