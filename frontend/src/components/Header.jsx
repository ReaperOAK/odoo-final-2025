import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  PlusIcon,
  HomeIcon,
  ListBulletIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import HostVerification from "./HostVerification";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAdmin, isHost, getWalletBalance } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navigation = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Browse Listings", href: "/listings", icon: ListBulletIcon },
  ];

  const userNavigation = user
    ? [
        { name: "My Bookings", href: "/my-bookings", icon: ShoppingBagIcon },
        ...(isHost()
          ? [
              {
                name: "Host Dashboard",
                href: "/host/dashboard",
                icon: BuildingStorefrontIcon,
              },
              {
                name: "My Listings",
                href: "/my-listings",
                icon: ListBulletIcon,
              },
              { name: "Add Listing", href: "/listings/create", icon: PlusIcon },
            ]
          : []),
        { name: `${user.name}`, href: "/profile", icon: UserCircleIcon },
        ...(isAdmin()
          ? [
              {
                name: "Admin Products",
                href: "/admin/products",
                icon: Cog6ToothIcon,
              },
              {
                name: "Admin Rentals",
                href: "/admin/rentals",
                icon: Cog6ToothIcon,
              },
              {
                name: "Admin Hosts",
                href: "/admin/hosts",
                icon: Cog6ToothIcon,
              },
              {
                name: "Admin Payouts",
                href: "/admin/payouts",
                icon: Cog6ToothIcon,
              },
            ]
          : []),
      ]
    : [];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                P2P Marketplace
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-brand bg-brand-50"
                    : "text-gray-600 hover:text-brand hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-4 h-4 mr-1.5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Host Badge and Wallet */}
                {isHost() && (
                  <div className="flex items-center space-x-3">
                    <HostVerification
                      host={user}
                      size="small"
                      showText={false}
                    />
                    <div className="text-sm">
                      <div className="text-gray-600">Wallet</div>
                      <div className="font-semibold text-green-600">
                        ₹{getWalletBalance().toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-brand bg-brand-50"
                        : "text-gray-600 hover:text-brand hover:bg-gray-50"
                    }`}
                  >
                    {item.icon && <item.icon className="w-4 h-4 mr-1.5" />}
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="bg-brand text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-brand px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-brand text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-brand hover:bg-gray-50"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-brand bg-brand-50"
                      : "text-gray-600 hover:text-brand hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-2" />
                  {item.name}
                </Link>
              ))}

              {user ? (
                <>
                  {/* Host Info on Mobile */}
                  {isHost() && (
                    <div className="px-3 py-2 border-t border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <HostVerification host={user} size="small" />
                        <div className="text-sm">
                          <div className="text-gray-600">Wallet</div>
                          <div className="font-semibold text-green-600">
                            ₹{getWalletBalance().toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive(item.href)
                          ? "text-brand bg-brand-50"
                          : "text-gray-600 hover:text-brand hover:bg-gray-50"
                      }`}
                    >
                      {item.icon && <item.icon className="w-5 h-5 mr-2" />}
                      {item.name}
                    </Link>
                  ))}
                  <div className="px-3 py-2 border-t">
                    <div className="flex items-center mb-2">
                      <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">{user.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full bg-brand text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2 pt-2 border-t">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-center text-gray-600 hover:text-brand px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-center bg-brand text-white px-4 py-2 rounded-md text-base font-medium hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
