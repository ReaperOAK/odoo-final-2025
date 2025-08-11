import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Header = () => {
  const { user, logout, isAdmin } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-brand">
            RentalSystem
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/products" className="text-gray-700 hover:text-brand transition-colors">
              Products
            </Link>
            {user && (
              <Link to="/my-bookings" className="text-gray-700 hover:text-brand transition-colors">
                My Bookings
              </Link>
            )}
            {isAdmin() && (
              <>
                <Link to="/admin/products" className="text-gray-700 hover:text-brand transition-colors">
                  Manage Products
                </Link>
                <Link to="/admin/rentals" className="text-gray-700 hover:text-brand transition-colors">
                  Manage Rentals
                </Link>
              </>
            )}
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Hello, {user.name}</span>
                <button
                  onClick={logout}
                  className="btn-secondary"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-brand transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
