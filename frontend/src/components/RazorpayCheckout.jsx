import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { paymentsAPI } from "../api/payments";
import toast from "react-hot-toast";

const RazorpayCheckout = ({
  orderData,
  onSuccess,
  onFailure,
  onCancel,
  disabled = false,
  buttonText = "Pay Now",
  className = "",
  mockMode = false,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const loadRazorpayScript = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        toast.error("Payment system unavailable. Please try again.");
      };
      document.body.appendChild(script);
    };

    if (!mockMode) {
      loadRazorpayScript();
    } else {
      setRazorpayLoaded(true);
    }
  }, [mockMode]);

  const handlePayment = async () => {
    if (!orderData) {
      toast.error("Order data is required");
      return;
    }

    setIsLoading(true);

    try {
      if (mockMode) {
        // Mock payment for demo/development
        await handleMockPayment();
      } else {
        // Real Razorpay payment
        await handleRazorpayPayment();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");

      if (onFailure) {
        onFailure(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockPayment = async () => {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock payment data
    const mockPaymentData = {
      orderId: orderData.orderId,
      paymentId: `mock_pay_${Date.now()}`,
      razorpayOrderId: `mock_order_${Date.now()}`,
      amount: orderData.amount,
      currency: "INR",
      status: "success",
    };

    try {
      const response = await paymentsAPI.processMockPayment(mockPaymentData);

      if (response.success) {
        toast.success("Payment successful!");

        if (onSuccess) {
          onSuccess({
            paymentId: mockPaymentData.paymentId,
            orderId: mockPaymentData.orderId,
            amount: mockPaymentData.amount,
            response: response.data,
          });
        }
      } else {
        throw new Error(response.message || "Mock payment failed");
      }
    } catch (error) {
      throw new Error("Mock payment processing failed");
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      // Create Razorpay order
      const orderResponse = await paymentsAPI.createRazorpayOrder({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        customerInfo: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || user?.hostProfile?.phone,
        },
      });

      if (!orderResponse.success) {
        throw new Error(
          orderResponse.message || "Failed to create payment order"
        );
      }

      const { razorpayOrderId, amount, currency } = orderResponse.data;

      // Razorpay checkout options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount * 100, // Amount in paise
        currency: currency,
        name: "P2P Marketplace",
        description: `Payment for Order #${orderData.orderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || user?.hostProfile?.phone || "",
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: () => {
            if (onCancel) {
              onCancel();
            }
          },
        },
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verificationResponse = await paymentsAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderData.orderId,
            });

            if (verificationResponse.success) {
              toast.success("Payment successful!");

              if (onSuccess) {
                onSuccess({
                  paymentId: response.razorpay_payment_id,
                  orderId: orderData.orderId,
                  amount: amount,
                  response: verificationResponse.data,
                });
              }
            } else {
              throw new Error(
                verificationResponse.message || "Payment verification failed"
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed");

            if (onFailure) {
              onFailure(error);
            }
          }
        },
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);

        if (onFailure) {
          onFailure(response.error);
        }
      });

      rzp.open();
    } catch (error) {
      throw error;
    }
  };

  const isButtonDisabled =
    disabled || isLoading || (!razorpayLoaded && !mockMode);

  return (
    <button
      onClick={handlePayment}
      disabled={isButtonDisabled}
      className={`
        relative px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg
        hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        disabled:bg-gray-400 disabled:cursor-not-allowed
        transition-all duration-200 transform hover:scale-105 active:scale-95
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {mockMode ? "Processing..." : "Loading..."}
        </div>
      ) : (
        <>
          {mockMode && (
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
              DEMO
            </span>
          )}
          {buttonText}
        </>
      )}
    </button>
  );
};

export default RazorpayCheckout;
