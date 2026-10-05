import {
  Cake,
  CalendarDays,
  PartyPopper,
  Bell,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

function UpcomingEvents({
  notifications = [],
}) {
  const navigate = useNavigate();

  // ---------------------------------------------------------
  // GET ACTIVE NOTIFICATIONS
  // ---------------------------------------------------------

  const activeNotifications =
    notifications.filter(
      (notification) =>
        notification.is_active
    );

  // ---------------------------------------------------------
  // SORT BY DATE
  // ---------------------------------------------------------

  const upcomingEvents = [
    ...activeNotifications,
  ]
    .sort((a, b) => {
      if (
        !a.notification_date &&
        !b.notification_date
      ) {
        return 0;
      }

      if (!a.notification_date) {
        return 1;
      }

      if (!b.notification_date) {
        return -1;
      }

      return (
        new Date(a.notification_date) -
        new Date(b.notification_date)
      );
    })
    .slice(0, 5);

  // ---------------------------------------------------------
  // ICON
  // ---------------------------------------------------------

  const getEventIcon = (type) => {
    const notificationType =
      type?.toLowerCase();

    if (
      notificationType === "birthday"
    ) {
      return Cake;
    }

    if (
      notificationType === "holiday"
    ) {
      return CalendarDays;
    }

    if (
      notificationType === "festival"
    ) {
      return PartyPopper;
    }

    return Bell;
  };

  // ---------------------------------------------------------
  // FORMAT DATE
  // ---------------------------------------------------------

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "No date";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="panel">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="panel-header">

        <div>

          <h2>
            Upcoming Events
          </h2>

          <p>
            Important dates and celebrations
          </p>

        </div>

        <button
          type="button"
          className="text-button"
          onClick={() => navigate("/notifications")}
        >
          View all
        </button>

      </div>

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {upcomingEvents.length === 0 ? (

        <div className="empty-state">
          No upcoming events or notifications.
        </div>

      ) : (

        <div className="event-list">

          {upcomingEvents.map(
            (event) => {

              const Icon =
                getEventIcon(
                  event.notification_type
                );

              return (
                <div
                  className="event-item"
                  key={event.id}
                >

                  <div className="event-icon">

                    <Icon size={19} />

                  </div>

                  <div>

                    <strong>
                      {event.title}
                    </strong>

                    <span>
                      {formatDate(
                        event.notification_date
                      )}
                    </span>

                  </div>

                </div>
              );
            }
          )}

        </div>

      )}

    </div>
  );
}

export default UpcomingEvents;