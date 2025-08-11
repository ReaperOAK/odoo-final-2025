import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

const HostVerification = ({
  host,
  size = "medium",
  showText = true,
  className = "",
}) => {
  if (!host) return null;

  const getVerificationStatus = () => {
    if (host.verified || host.hostProfile?.verified) {
      return "verified";
    }
    if (host.verificationPending || host.hostProfile?.verificationPending) {
      return "pending";
    }
    if (host.verificationRejected || host.hostProfile?.verificationRejected) {
      return "rejected";
    }
    return "unverified";
  };

  const status = getVerificationStatus();

  const statusConfig = {
    verified: {
      icon: ShieldCheckIcon,
      text: "Verified Host",
      shortText: "Verified",
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
    },
    pending: {
      icon: ClockIcon,
      text: "Verification Pending",
      shortText: "Pending",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      borderColor: "border-yellow-200",
    },
    rejected: {
      icon: ExclamationTriangleIcon,
      text: "Verification Rejected",
      shortText: "Rejected",
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-red-200",
    },
    unverified: {
      icon: ShieldExclamationIcon,
      text: "Not Verified",
      shortText: "Unverified",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-200",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    small: {
      icon: "w-3 h-3",
      text: "text-xs",
      padding: "px-2 py-1",
      badge: "px-1.5 py-0.5",
    },
    medium: {
      icon: "w-4 h-4",
      text: "text-sm",
      padding: "px-3 py-1.5",
      badge: "px-2 py-1",
    },
    large: {
      icon: "w-5 h-5",
      text: "text-base",
      padding: "px-4 py-2",
      badge: "px-3 py-1.5",
    },
  };

  const sizes = sizeClasses[size];

  if (!showText) {
    // Badge/Icon only version
    return (
      <div
        className={clsx(
          "inline-flex items-center rounded-full border",
          config.bgColor,
          config.borderColor,
          sizes.badge,
          className
        )}
        title={config.text}
      >
        <Icon className={clsx(sizes.icon, config.color)} />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "inline-flex items-center space-x-1.5 rounded-full border",
        config.bgColor,
        config.borderColor,
        sizes.padding,
        className
      )}
    >
      <Icon className={clsx(sizes.icon, config.color)} />
      <span className={clsx(sizes.text, config.color, "font-medium")}>
        {size === "small" ? config.shortText : config.text}
      </span>
    </div>
  );
};

export default HostVerification;
