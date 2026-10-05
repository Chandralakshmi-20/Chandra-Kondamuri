import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Plus,
  CalendarDays,
  Megaphone,
  Gift,
  PartyPopper,
  Power,
  X,
} from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Notifications.css";

const initialForm = {
  title: "",
  message: "",
  notification_type: "announcement",
  notification_date: "",
};

const notificationTypes = [
  {
    value: "announcement",
    label: "Announcement",
  },
  {
    value: "holiday",
    label: "Public Holiday",
  },
  {
    value: "birthday",
    label: "Birthday",
  },
  {
    value: "festival",
    label: "Festival",
  },
];

function getTypeIcon(type) {
  switch (type?.toLowerCase()) {
    case "holiday":
      return <CalendarDays size={20} />;

    case "birthday":
      return <Gift size={20} />;

    case "festival":
      return <PartyPopper size={20} />;

    default:
      return <Megaphone size={20} />;
  }
}

function formatDate(date) {
  if (!date) {
    return "Date not specified";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function Notifications() {
  const { user } = useAuth();

  const isHR =
    user?.role?.toLowerCase() === "hr";

  const [notifications, setNotifications] =
    useState([]);

  const [form, setForm] =
    useState(initialForm);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // =========================================================
  // AUTO CLOSE SUCCESS / ERROR POPUP
  // =========================================================

  useEffect(() => {
    if (!success && !error) return;

    const timer = setTimeout(() => {
      setSuccess("");
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [success, error]);


  // =========================================================
  // FETCH NOTIFICATIONS
  // =========================================================

  const fetchNotifications =
    useCallback(async () => {

      setLoading(true);
      setError("");

      try {

        const endpoint = isHR
          ? "/api/notifications/all"
          : "/api/notifications";

        const response =
          await api.get(endpoint);

        console.log(
          "Notifications response:",
          response.data
        );

        if (Array.isArray(response.data)) {

          setNotifications(
            response.data
          );

        } else {

          setNotifications([]);

          console.error(
            "Unexpected notifications response:",
            response.data
          );
        }

      } catch (err) {

        console.error(
          "Failed to load notifications:",
          err
        );

        setNotifications([]);

        setError(
          err.response?.data?.detail ||
            "Unable to load notifications. Please try again."
        );

      } finally {

        setLoading(false);
      }

    }, [isHR]);


  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  useEffect(() => {

    if (user) {
      fetchNotifications();
    }

  }, [user, fetchNotifications]);


  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // =========================================================
  // CREATE NOTIFICATION
  // =========================================================

  const handleCreate = async (event) => {

    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {

      // Date is required by backend.
      if (!form.notification_date) {

        setError(
          "Please select a notification date."
        );

        setSaving(false);

        return;
      }

      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        notification_type:
          form.notification_type,
        notification_date:
          form.notification_date,
        is_active: true,
      };

      console.log(
        "Creating notification:",
        payload
      );

      const response =
        await api.post(
          "/api/notifications",
          payload
        );

      console.log(
        "Notification created:",
        response.data
      );

      setForm(initialForm);
      setShowForm(false);

      setSuccess(
        "Notification created successfully."
      );

      // Reload HR notification list
      await fetchNotifications();

    } catch (err) {

      console.error(
        "Create notification error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to create notification. Please try again."
      );

    } finally {

      setSaving(false);
    }
  };


  // =========================================================
  // ACTIVATE / DEACTIVATE
  // =========================================================

  const handleStatusToggle =
    async (notification) => {

      if (
        updatingId === notification.id
      ) {
        return;
      }

      setUpdatingId(
        notification.id
      );

      setError("");
      setSuccess("");

      try {

        const payload = {
          is_active:
            !notification.is_active,
        };

        console.log(
          "Updating notification:",
          notification.id,
          payload
        );

        await api.patch(
          `/api/notifications/${notification.id}/status`,
          payload
        );

        setSuccess(
          notification.is_active
            ? "Notification deactivated."
            : "Notification activated."
        );

        await fetchNotifications();

      } catch (err) {

        console.error(
          "Notification status error:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Unable to update notification status."
        );

      } finally {

        setUpdatingId(null);
      }
    };


  // =========================================================
  // CLOSE FORM
  // =========================================================

  const handleCloseForm = () => {

    setShowForm(false);

    setForm(initialForm);

    setError("");
  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="notifications-page">

      <PageHeader
        title="Notifications"
        description="Birthdays, holidays, festivals and HR updates."
      />


      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="notifications-toolbar">

        <div className="notifications-heading">

          <div className="notifications-heading-icon">
            <Bell size={22} />
          </div>

          <div>

            <h2>
              Notifications Center
            </h2>

            <p>
              {isHR
                ? "Create and manage company notifications."
                : "Stay updated with the latest company announcements."}
            </p>

          </div>

        </div>


        {isHR && (

          <button
            type="button"
            className="notification-primary-btn"
            onClick={() => {

              if (showForm) {

                handleCloseForm();

              } else {

                setShowForm(true);
                setError("");
                setSuccess("");
              }

            }}
          >

            {showForm ? (
              <X size={18} />
            ) : (
              <Plus size={18} />
            )}

            {showForm
              ? "Close Form"
              : "Create Notification"}

          </button>

        )}

      </div>


      {/* =====================================================
          ALERTS
      ===================================================== */}

      {error && (

        <div className="notification-alert error">
          {error}
        </div>

      )}

      {success && (

        <div className="notification-alert success">
          {success}
        </div>

      )}


      {/* =====================================================
          CREATE FORM
      ===================================================== */}

      {isHR && showForm && (

        <form
          className="notification-form"
          onSubmit={handleCreate}
        >

          <h3>
            Create New Notification
          </h3>


          <div className="notification-form-grid">


            {/* TITLE */}

            <div className="notification-field">

              <label htmlFor="notification-title">
                Title
              </label>

              <input
                id="notification-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter notification title"
                required
                maxLength={200}
              />

            </div>


            {/* TYPE */}

            <div className="notification-field">

              <label htmlFor="notification-type">
                Notification Type
              </label>

              <select
                id="notification-type"
                name="notification_type"
                value={form.notification_type}
                onChange={handleChange}
                required
              >

                {notificationTypes.map(
                  (type) => (

                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* MESSAGE */}

            <div className="notification-field notification-field-full">

              <label htmlFor="notification-message">
                Message
              </label>

              <textarea
                id="notification-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Write your notification message..."
                rows={4}
                required
              />

            </div>


            {/* DATE */}

            <div className="notification-field">

              <label htmlFor="notification-date">
                Notification Date
              </label>

              <input
                id="notification-date"
                name="notification_date"
                type="date"
                value={form.notification_date}
                onChange={handleChange}
                required
              />

            </div>

          </div>


          {/* FORM ACTIONS */}

          <div className="notification-form-actions">

            <button
              type="button"
              className="notification-secondary-btn"
              onClick={handleCloseForm}
              disabled={saving}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="notification-primary-btn"
              disabled={saving}
            >

              {saving
                ? "Creating..."
                : "Publish Notification"}

            </button>

          </div>

        </form>

      )}


      {/* =====================================================
          LIST HEADER
      ===================================================== */}

      <div className="notification-list-header">

        <h3>
          {isHR
            ? "All Notifications"
            : "Notifications"}
        </h3>

        <span>

          {notifications.length}{" "}

          {notifications.length === 1
            ? "notification"
            : "notifications"}

        </span>

      </div>


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (

        <div className="notification-empty">

          <p>
            Loading notifications...
          </p>

        </div>

      ) : notifications.length === 0 ? (

        <div className="notification-empty">

          <div className="notification-empty-icon">
            <Bell size={30} />
          </div>

          <h3>
            No notifications yet
          </h3>

          <p>
            {isHR
              ? "Create a notification to share updates with employees."
              : "Company announcements and updates will appear here."}
          </p>

        </div>

      ) : (

        <div className="notification-list">

          {notifications.map(
            (notification) => {

              const isUpdating =
                updatingId ===
                notification.id;

              return (

                <article
                  className={`notification-card ${
                    notification.is_active
                      ? ""
                      : "notification-inactive"
                  }`}
                  key={notification.id}
                >

                  {/* ICON */}

                  <div className="notification-card-icon">

                    {getTypeIcon(
                      notification.notification_type
                    )}

                  </div>


                  {/* CONTENT */}

                  <div className="notification-card-content">


                    {/* TOP */}

                    <div className="notification-card-top">

                      <span
                        className={`notification-type-badge ${
                          notification.notification_type?.toLowerCase()
                        }`}
                      >
                        {notification.notification_type}
                      </span>


                      {isHR && (

                        <span
                          className={`notification-status ${
                            notification.is_active
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {notification.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      )}

                    </div>


                    {/* TITLE */}

                    <h3>
                      {notification.title}
                    </h3>


                    {/* MESSAGE */}

                    <p className="notification-message">
                      {notification.message}
                    </p>


                    {/* FOOTER */}

                    <div className="notification-card-footer">

                      <span>

                        <CalendarDays
                          size={15}
                        />

                        {formatDate(
                          notification.notification_date
                        )}

                      </span>


                      {/* HR ACTION */}

                      {isHR && (

                        <button
                          type="button"
                          className={`notification-toggle-btn ${
                            notification.is_active
                              ? "deactivate"
                              : "activate"
                          }`}
                          onClick={() =>
                            handleStatusToggle(
                              notification
                            )
                          }
                          disabled={isUpdating}
                          title={
                            notification.is_active
                              ? "Deactivate notification"
                              : "Activate notification"
                          }
                        >

                          <Power size={16} />

                          {isUpdating
                            ? "Updating..."
                            : notification.is_active
                            ? "Deactivate"
                            : "Activate"}

                        </button>

                      )}

                    </div>

                  </div>

                </article>

              );
            }
          )}

        </div>

      )}

    </div>
  );
}

export default Notifications;