import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format, parseISO } from "date-fns";
import clsx from "clsx";

const Calendar = ({
  events = [],
  onDateSelect,
  onEventClick,
  onEventDrop,
  selectable = true,
  editable = false,
  height = "auto",
  className = "",
  view = "dayGridMonth",
  showWeekends = true,
}) => {
  const [currentEvents, setCurrentEvents] = useState([]);

  useEffect(() => {
    // Transform events to FullCalendar format
    const transformedEvents = events.map((event) => ({
      id: event.id || event._id,
      title: event.title,
      start: event.start || event.startDate,
      end: event.end || event.endDate,
      backgroundColor: getEventColor(event.type || event.status),
      borderColor: getEventColor(event.type || event.status, true),
      textColor: getTextColor(event.type || event.status),
      extendedProps: {
        ...event,
        description: event.description,
        status: event.status,
        type: event.type,
        orderId: event.orderId,
        listingId: event.listingId,
        renterId: event.renterId,
        amount: event.amount,
      },
    }));

    setCurrentEvents(transformedEvents);
  }, [events]);

  const getEventColor = (type, isBorder = false) => {
    const colors = {
      booked: isBorder ? "#059669" : "#10b981", // Green
      reserved: isBorder ? "#d97706" : "#f59e0b", // Amber
      confirmed: isBorder ? "#0891b2" : "#06b6d4", // Cyan
      in_progress: isBorder ? "#7c3aed" : "#8b5cf6", // Purple
      pickup: isBorder ? "#7c3aed" : "#8b5cf6", // Purple
      active: isBorder ? "#dc2626" : "#ef4444", // Red
      returned: isBorder ? "#059669" : "#10b981", // Green
      completed: isBorder ? "#374151" : "#6b7280", // Gray
      cancelled: isBorder ? "#991b1b" : "#dc2626", // Dark Red
      blocked: isBorder ? "#991b1b" : "#dc2626", // Dark Red
      maintenance: isBorder ? "#92400e" : "#d97706", // Orange
      default: isBorder ? "#4b5563" : "#6b7280", // Gray
    };

    return colors[type] || colors.default;
  };

  const getTextColor = (type) => {
    const lightTypes = ["reserved", "maintenance"];
    return lightTypes.includes(type) ? "#000" : "#fff";
  };

  const handleDateSelect = (selectInfo) => {
    if (onDateSelect) {
      onDateSelect({
        start: selectInfo.start,
        end: selectInfo.end,
        startStr: selectInfo.startStr,
        endStr: selectInfo.endStr,
        allDay: selectInfo.allDay,
      });
    }
  };

  const handleEventClick = (clickInfo) => {
    if (onEventClick) {
      onEventClick({
        event: clickInfo.event,
        eventData: clickInfo.event.extendedProps,
        jsEvent: clickInfo.jsEvent,
        view: clickInfo.view,
      });
    }
  };

  const handleEventDrop = (dropInfo) => {
    if (onEventDrop) {
      onEventDrop({
        event: dropInfo.event,
        oldEvent: dropInfo.oldEvent,
        delta: dropInfo.delta,
        revert: dropInfo.revert,
      });
    }
  };

  const calendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: view,
    events: currentEvents,
    selectable,
    editable,
    height,
    weekends: showWeekends,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,dayGridWeek",
    },
    buttonText: {
      today: "Today",
      month: "Month",
      week: "Week",
    },
    select: handleDateSelect,
    eventClick: handleEventClick,
    eventDrop: handleEventDrop,
    dayCellClassNames: (arg) => {
      // Add custom classes for special dates
      const today = new Date();
      const cellDate = arg.date;

      if (
        cellDate.getDate() === today.getDate() &&
        cellDate.getMonth() === today.getMonth() &&
        cellDate.getFullYear() === today.getFullYear()
      ) {
        return ["today-cell"];
      }

      return [];
    },
    eventClassNames: (arg) => {
      const status = arg.event.extendedProps.status;
      return [`event-${status}`, "custom-event"];
    },
    eventContent: (arg) => {
      const { event } = arg;
      const props = event.extendedProps;

      return {
        html: `
          <div class="fc-event-content-custom">
            <div class="fc-event-title-custom">${event.title}</div>
            ${
              props.amount
                ? `<div class="fc-event-amount">₹${props.amount}</div>`
                : ""
            }
            ${
              props.customerName
                ? `<div class="fc-event-customer">${props.customerName}</div>`
                : ""
            }
          </div>
        `,
      };
    },
    dayMaxEvents: 3,
    moreLinkClick: "popover",
    eventDidMount: (info) => {
      // Add tooltip functionality
      const tooltip = document.createElement("div");
      tooltip.className = "calendar-tooltip";
      tooltip.style.cssText = `
        position: absolute;
        background: #374151;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        max-width: 200px;
      `;

      const eventEl = info.el;
      const props = info.event.extendedProps;

      eventEl.addEventListener("mouseenter", (e) => {
        tooltip.innerHTML = `
          <div><strong>${info.event.title}</strong></div>
          ${
            props.customerName
              ? `<div>Customer: ${props.customerName}</div>`
              : ""
          }
          ${props.amount ? `<div>Amount: ₹${props.amount}</div>` : ""}
          ${props.status ? `<div>Status: ${props.status}</div>` : ""}
          ${props.description ? `<div>${props.description}</div>` : ""}
        `;

        document.body.appendChild(tooltip);

        const rect = eventEl.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
        tooltip.style.transform = "translateX(-50%)";
        tooltip.style.opacity = "1";
      });

      eventEl.addEventListener("mouseleave", () => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      });
    },
  };

  return (
    <div className={clsx("calendar-container", className)}>
      <style jsx>{`
        .calendar-container {
          --fc-border-color: #e5e7eb;
          --fc-today-bg-color: #fef3c7;
          --fc-event-border-color: transparent;
        }

        .fc-event-content-custom {
          padding: 2px 4px;
        }

        .fc-event-title-custom {
          font-weight: 600;
          font-size: 11px;
          line-height: 1.2;
        }

        .fc-event-amount {
          font-size: 10px;
          opacity: 0.9;
        }

        .fc-event-customer {
          font-size: 10px;
          opacity: 0.8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fc-toolbar-title {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          color: #111827 !important;
        }

        .fc-button {
          background-color: #6366f1 !important;
          border-color: #6366f1 !important;
          color: white !important;
          font-weight: 500 !important;
          padding: 6px 12px !important;
          border-radius: 6px !important;
        }

        .fc-button:hover {
          background-color: #4f46e5 !important;
          border-color: #4f46e5 !important;
        }

        .fc-button:disabled {
          background-color: #9ca3af !important;
          border-color: #9ca3af !important;
        }

        .fc-day-today {
          background-color: #fef3c7 !important;
        }

        .fc-daygrid-event {
          border-radius: 4px !important;
          font-size: 11px !important;
          margin: 1px 2px !important;
        }

        .fc-daygrid-event:hover {
          opacity: 0.8;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }

        .custom-event {
          cursor: pointer;
        }

        .fc-more-link {
          background-color: #f3f4f6 !important;
          color: #6b7280 !important;
          border-radius: 4px !important;
          font-size: 10px !important;
          padding: 2px 6px !important;
        }
      `}</style>

      <FullCalendar {...calendarOptions} />
    </div>
  );
};

export default Calendar;
