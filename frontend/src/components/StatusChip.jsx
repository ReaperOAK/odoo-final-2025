export default function StatusChip({ status }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case "confirmed":
        return {
          label: "Confirmed",
          className: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "picked_up":
        return {
          label: "Picked Up",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "returned":
        return {
          label: "Returned",
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          className: "bg-red-100 text-red-800 border-red-200",
        };
      default:
        return {
          label: status || "Unknown",
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
