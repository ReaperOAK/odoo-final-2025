import React, { useState } from "react";
import { authAPI } from "../api/auth";
import { listingsAPI } from "../api/listings";
import { ordersAPI } from "../api/orders";
import { paymentsAPI } from "../api/payments";
import { payoutsAPI } from "../api/payouts";
import { hostsAPI } from "../api/hosts";
import { adminAPI } from "../api/admin";
import toast from "react-hot-toast";

const APITester = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (api, endpoint, success, data, error) => {
    setResults((prev) => [
      ...prev,
      {
        id: Date.now(),
        api,
        endpoint,
        success,
        data,
        error,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const testAPI = async (apiFunc, apiName, endpoint) => {
    try {
      const data = await apiFunc();
      addResult(apiName, endpoint, true, data, null);
      return true;
    } catch (error) {
      addResult(apiName, endpoint, false, null, error.message);
      return false;
    }
  };

  const testHealthCheck = async () => {
    try {
      const response = await fetch("http://localhost:5000/health");
      const data = await response.json();
      addResult("Health", "GET /health", true, data, null);
      return true;
    } catch (error) {
      addResult("Health", "GET /health", false, null, error.message);
      return false;
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);

    // First test server health
    await testHealthCheck();

    const tests = [
      // Auth API Tests
      () => testAPI(() => authAPI.getProfile(), "Auth", "GET /auth/profile"),

      // Listings API Tests
      () =>
        testAPI(
          () => listingsAPI.getListings({ limit: 5 }),
          "Listings",
          "GET /listings"
        ),

      // Orders API Tests
      () =>
        testAPI(
          () => ordersAPI.getMyOrders({ limit: 5 }),
          "Orders",
          "GET /orders/my"
        ),

      // Host API Tests
      () =>
        testAPI(
          () => hostsAPI.getHostDashboard(),
          "Hosts",
          "GET /host/dashboard"
        ),
      () =>
        testAPI(
          () => hostsAPI.getHostEarnings(),
          "Hosts",
          "GET /host/earnings"
        ),

      // Payouts API Tests
      () =>
        testAPI(
          () => payoutsAPI.getHostPayouts({ limit: 5 }),
          "Payouts",
          "GET /payouts"
        ),
      () =>
        testAPI(
          () => payoutsAPI.getAvailableBalance(),
          "Payouts",
          "GET /payouts/balance"
        ),

      // Admin API Tests (might fail due to permissions)
      () =>
        testAPI(
          () => adminAPI.getPlatformOverview(),
          "Admin",
          "GET /admin/platform-overview"
        ),
      () =>
        testAPI(
          () => adminAPI.getAllUsers({ limit: 5 }),
          "Admin",
          "GET /admin/users"
        ),

      // Host API Tests
      () =>
        testAPI(
          () => hostsAPI.getHostDashboard(),
          "Host",
          "GET /host/dashboard"
        ),

      // Payments API Tests (might fail if no payment ID, that's expected)
      () =>
        testAPI(
          () => paymentsAPI.getPaymentHistory({ limit: 5 }),
          "Payments",
          "GET /payments/history"
        ),

      // Payouts API Tests
      () =>
        testAPI(
          () => payoutsAPI.getAvailableBalance(),
          "Payouts",
          "GET /payouts/balance"
        ),

      // Admin API Tests (might fail if not admin, that's expected)
      () =>
        testAPI(
          () => adminAPI.getPlatformOverview(),
          "Admin",
          "GET /admin/platform-overview"
        ),
    ];

    for (const test of tests) {
      await test();
      // Add small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setLoading(false);
    toast.success("API testing completed!");
  };

  const testSpecificEndpoint = async (category) => {
    setLoading(true);

    switch (category) {
      case "auth":
        await testAPI(() => authAPI.getProfile(), "Auth", "GET /auth/profile");
        break;
      case "listings":
        await testAPI(
          () => listingsAPI.getListings({ limit: 10 }),
          "Listings",
          "GET /listings"
        );
        break;
      case "orders":
        await testAPI(
          () => ordersAPI.getMyOrders(),
          "Orders",
          "GET /orders/my"
        );
        break;
      case "host":
        await testAPI(
          () => hostsAPI.getHostDashboard(),
          "Host",
          "GET /host/dashboard"
        );
        break;
      case "admin":
        await testAPI(
          () => adminAPI.getAllUsers({ limit: 10 }),
          "Admin",
          "GET /admin/users"
        );
        break;
      default:
        break;
    }

    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          API Integration Tester
        </h1>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
          >
            {loading ? "Testing..." : "Run All Tests"}
          </button>

          <button
            onClick={() => testSpecificEndpoint("auth")}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
          >
            Test Auth
          </button>

          <button
            onClick={() => testSpecificEndpoint("listings")}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
          >
            Test Listings
          </button>

          <button
            onClick={() => testSpecificEndpoint("orders")}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
          >
            Test Orders
          </button>

          <button
            onClick={() => testSpecificEndpoint("host")}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
          >
            Test Host
          </button>

          <button
            onClick={() => testSpecificEndpoint("admin")}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
          >
            Test Admin
          </button>

          <button
            onClick={clearResults}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Clear Results
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Test Results ({results.length})
          </h2>

          {results.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No tests run yet. Click "Run All Tests" to start testing all APIs.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 rounded-md border-l-4 ${
                    result.success
                      ? "bg-green-50 border-green-400"
                      : "bg-red-50 border-red-400"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.success
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {result.success ? "✓" : "✗"}
                        </span>
                        <span className="font-medium text-gray-900">
                          {result.api} API
                        </span>
                        <span className="text-gray-500">{result.endpoint}</span>
                      </div>

                      {result.success ? (
                        <div className="mt-2">
                          <p className="text-sm text-green-700">
                            Success! Data received:
                          </p>
                          <details className="mt-1">
                            <summary className="text-xs text-green-600 cursor-pointer hover:text-green-700">
                              View response data
                            </summary>
                            <pre className="mt-2 text-xs bg-green-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <p className="text-sm text-red-700">
                            Error: {result.error}
                          </p>
                        </div>
                      )}
                    </div>

                    <span className="text-xs text-gray-500 ml-4">
                      {result.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {results.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-md font-medium text-gray-900 mb-2">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Tests:</span>
                <span className="ml-2 font-medium">{results.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Passed:</span>
                <span className="ml-2 font-medium text-green-600">
                  {results.filter((r) => r.success).length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Failed:</span>
                <span className="ml-2 font-medium text-red-600">
                  {results.filter((r) => !r.success).length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Success Rate:</span>
                <span className="ml-2 font-medium">
                  {Math.round(
                    (results.filter((r) => r.success).length / results.length) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APITester;
