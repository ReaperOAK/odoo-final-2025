import { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  EyeSlashIcon,
  BanknotesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import clsx from "clsx";

const WalletBalance = ({
  balance = 0,
  pendingAmount = 0,
  totalEarnings = 0,
  showDetails = true,
  showControls = true,
  lastUpdated,
  className = "",
  size = "medium",
}) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [animateBalance, setAnimateBalance] = useState(false);

  useEffect(() => {
    // Animate balance when it changes
    setAnimateBalance(true);
    const timer = setTimeout(() => setAnimateBalance(false), 500);
    return () => clearTimeout(timer);
  }, [balance]);

  const formatCurrency = (amount) => {
    if (!isBalanceVisible) return "••••••";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatShortCurrency = (amount) => {
    if (!isBalanceVisible) return "••••••";

    if (amount >= 10000000) {
      // 1 Crore
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      // 1 Lakh
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      // 1 Thousand
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${amount.toFixed(0)}`;
    }
  };

  const sizeClasses = {
    small: {
      container: "p-4",
      title: "text-lg font-semibold",
      balance: "text-2xl font-bold",
      subtitle: "text-sm",
      icon: "w-5 h-5",
      button: "p-2",
    },
    medium: {
      container: "p-6",
      title: "text-xl font-semibold",
      balance: "text-3xl font-bold",
      subtitle: "text-base",
      icon: "w-6 h-6",
      button: "p-2",
    },
    large: {
      container: "p-8",
      title: "text-2xl font-semibold",
      balance: "text-4xl font-bold",
      subtitle: "text-lg",
      icon: "w-8 h-8",
      button: "p-3",
    },
  };

  const sizes = sizeClasses[size];

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const getBalanceChangeColor = () => {
    if (balance > pendingAmount) return "text-green-600";
    if (balance < pendingAmount) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div
      className={clsx(
        "bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200",
        sizes.container,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-primary-600 rounded-lg">
            <CurrencyDollarIcon className={clsx(sizes.icon, "text-white")} />
          </div>
          <h3 className={clsx(sizes.title, "text-gray-900")}>Wallet Balance</h3>
        </div>

        {showControls && (
          <button
            onClick={toggleBalanceVisibility}
            className={clsx(
              "text-gray-600 hover:text-gray-900 transition-colors duration-200",
              sizes.button
            )}
            title={isBalanceVisible ? "Hide balance" : "Show balance"}
          >
            {isBalanceVisible ? (
              <EyeSlashIcon className={sizes.icon} />
            ) : (
              <EyeIcon className={sizes.icon} />
            )}
          </button>
        )}
      </div>

      {/* Main Balance */}
      <div className="mb-6">
        <div
          className={clsx(
            "transition-all duration-300",
            animateBalance && "scale-105",
            sizes.balance,
            "text-gray-900 mb-2"
          )}
        >
          {formatCurrency(balance)}
        </div>

        {lastUpdated && (
          <p className="text-sm text-gray-600">
            Last updated: {format(new Date(lastUpdated), "MMM dd, yyyy HH:mm")}
          </p>
        )}
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className="space-y-4">
          {/* Pending Amount */}
          <div className="flex items-center justify-between py-3 px-4 bg-white/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-700">Pending</span>
            </div>
            <span className="font-semibold text-orange-600">
              {formatShortCurrency(pendingAmount)}
            </span>
          </div>

          {/* Total Earnings */}
          <div className="flex items-center justify-between py-3 px-4 bg-white/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <BanknotesIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">Total Earnings</span>
            </div>
            <span className="font-semibold text-green-600">
              {formatShortCurrency(totalEarnings)}
            </span>
          </div>

          {/* Balance Change Indicator */}
          {balance !== pendingAmount && (
            <div className="flex items-center justify-center py-2">
              <div
                className={clsx(
                  "flex items-center space-x-1 text-sm font-medium",
                  getBalanceChangeColor()
                )}
              >
                {balance > pendingAmount ? (
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4" />
                )}
                <span>
                  {balance > pendingAmount ? "+" : ""}
                  {formatShortCurrency(Math.abs(balance - pendingAmount))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {showControls && (
        <div className="mt-6 pt-4 border-t border-primary-200">
          <div className="grid grid-cols-2 gap-3">
            <button className="px-4 py-2 bg-white text-primary-600 text-sm font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200 border border-primary-200">
              Request Payout
            </button>
            <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200">
              View History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletBalance;
