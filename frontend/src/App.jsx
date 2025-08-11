import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";

// Core Pages (load immediately)
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Lazy loaded pages for better performance
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Listings = lazy(() => import("./pages/Listings"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const CreateListing = lazy(() => import("./pages/CreateListing"));
const HostDashboard = lazy(() => import("./pages/HostDashboard"));
const MyListings = lazy(() => import("./pages/MyListings"));
const HostProfile = lazy(() => import("./pages/HostProfile"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminRentals = lazy(() => import("./pages/AdminRentals"));
const AdminHosts = lazy(() => import("./pages/AdminHosts"));
const AdminPayouts = lazy(() => import("./pages/AdminPayouts"));
const APITester = lazy(() => import("./pages/APITester"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      <p className="text-gray-600 text-sm">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-bg flex flex-col">
          <Header />
          <main className="flex-1">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* P2P Marketplace Routes */}
                <Route path="/listings" element={<Listings />} />
                <Route path="/listings/:id" element={<ListingDetail />} />

                {/* Legacy Product Routes (redirect to listings) */}
                <Route path="/products" element={<Listings />} />
                <Route path="/products/:id" element={<ListingDetail />} />

                {/* Protected User Routes */}
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Host Routes */}
                <Route
                  path="/host/dashboard"
                  element={
                    <ProtectedRoute>
                      <HostDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/profile"
                  element={
                    <ProtectedRoute>
                      <HostProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-listings"
                  element={
                    <ProtectedRoute>
                      <MyListings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/listings/create"
                  element={
                    <ProtectedRoute>
                      <CreateListing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/listings/:id/edit"
                  element={
                    <ProtectedRoute>
                      <CreateListing />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminProducts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/rentals"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminRentals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/hosts"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminHosts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/payouts"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminPayouts />
                    </ProtectedRoute>
                  }
                />
                
                {/* Developer/Testing Routes */}
                <Route
                  path="/api-tester"
                  element={
                    <ProtectedRoute>
                      <APITester />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </main>
          <Footer />

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
