import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listingsAPI } from "../api/listings";
import ImageUpload from "../components/ImageUpload";
import toast from "react-hot-toast";
import {
  PhotoIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  TagIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

const CreateListing = () => {
  const { user, isHost } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    customCategory: "",
    basePrice: "",
    unitType: "day",
    depositType: "percent",
    depositValue: "20",
    totalQuantity: "1",
    location: "",
    images: [],
    availability: {
      alwaysAvailable: true,
      customSchedule: [],
    },
    policies: {
      cancellationPolicy: "moderate",
      minimumBookingPeriod: "1",
      maximumBookingPeriod: "30",
      instantBooking: false,
    },
    features: [],
    customFeatures: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isHost()) {
      navigate("/become-host");
      return;
    }
  }, [isHost, navigate]);

  const categories = [
    "Electronics & Gadgets",
    "Camera & Photography",
    "Audio & Music",
    "Sports & Fitness",
    "Outdoor & Adventure",
    "Transportation",
    "Tools & Equipment",
    "Party & Events",
    "Gaming",
    "Home & Garden",
    "Fashion & Accessories",
    "Books & Media",
    "Other",
  ];

  const unitTypes = [
    {
      value: "hour",
      label: "Per Hour",
      description: "Ideal for short-term rentals",
    },
    {
      value: "day",
      label: "Per Day",
      description: "Most common pricing model",
    },
    { value: "week", label: "Per Week", description: "For longer rentals" },
  ];

  const depositTypes = [
    {
      value: "percent",
      label: "Percentage",
      description: "Percentage of total cost",
    },
    {
      value: "flat",
      label: "Fixed Amount",
      description: "Fixed deposit amount",
    },
  ];

  const steps = [
    { id: 1, title: "Basic Info", icon: DocumentTextIcon },
    { id: 2, title: "Pricing", icon: CurrencyDollarIcon },
    { id: 3, title: "Images", icon: PhotoIcon },
    { id: 4, title: "Details", icon: TagIcon },
    { id: 5, title: "Review", icon: CheckCircleIcon },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImagesChange = (images) => {
    setFormData((prev) => ({ ...prev, images }));
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.description.trim())
          newErrors.description = "Description is required";
        if (!formData.category) newErrors.category = "Category is required";
        if (formData.category === "Other" && !formData.customCategory.trim()) {
          newErrors.customCategory = "Custom category is required";
        }
        if (!formData.location.trim())
          newErrors.location = "Location is required";
        break;

      case 2:
        if (!formData.basePrice || formData.basePrice <= 0) {
          newErrors.basePrice = "Valid price is required";
        }
        if (!formData.totalQuantity || formData.totalQuantity <= 0) {
          newErrors.totalQuantity = "Valid quantity is required";
        }
        if (!formData.depositValue || formData.depositValue < 0) {
          newErrors.depositValue = "Valid deposit is required";
        }
        if (formData.depositType === "percent" && formData.depositValue > 100) {
          newErrors.depositValue = "Percentage cannot exceed 100%";
        }
        break;

      case 3:
        if (formData.images.length === 0) {
          newErrors.images = "At least one image is required";
        }
        break;

      case 4:
        // Optional validation for policies
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);

    try {
      // Prepare form data
      const listingData = {
        ...formData,
        category:
          formData.category === "Other"
            ? formData.customCategory
            : formData.category,
        basePrice: parseFloat(formData.basePrice),
        depositValue: parseFloat(formData.depositValue),
        totalQuantity: parseInt(formData.totalQuantity),
        policies: {
          ...formData.policies,
          minimumBookingPeriod: parseInt(
            formData.policies.minimumBookingPeriod
          ),
          maximumBookingPeriod: parseInt(
            formData.policies.maximumBookingPeriod
          ),
        },
      };

      // Remove custom category field if not needed
      if (formData.category !== "Other") {
        delete listingData.customCategory;
      }

      const response = await listingsAPI.createListing(listingData);

      if (response.success) {
        toast.success("Listing created successfully!");
        navigate("/host/dashboard");
      } else {
        throw new Error(response.message || "Failed to create listing");
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error(error.message || "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Canon DSLR Camera with Lens Kit"
                className={clsx(
                  "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  errors.title && "border-red-500"
                )}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe your item in detail..."
                className={clsx(
                  "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  errors.description && "border-red-500"
                )}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={clsx(
                  "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  errors.category && "border-red-500"
                )}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            {formData.category === "Other" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Category *
                </label>
                <input
                  type="text"
                  name="customCategory"
                  value={formData.customCategory}
                  onChange={handleInputChange}
                  placeholder="Enter custom category"
                  className={clsx(
                    "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                    errors.customCategory && "border-red-500"
                  )}
                />
                {errors.customCategory && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.customCategory}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Mumbai, Maharashtra"
                  className={clsx(
                    "w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                    errors.location && "border-red-500"
                  )}
                />
              </div>
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price *
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="1"
                    step="1"
                    className={clsx(
                      "w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                      errors.basePrice && "border-red-500"
                    )}
                  />
                </div>
                {errors.basePrice && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.basePrice}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Unit *
                </label>
                <select
                  name="unitType"
                  value={formData.unitType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {unitTypes.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Available *
              </label>
              <input
                type="number"
                name="totalQuantity"
                value={formData.totalQuantity}
                onChange={handleInputChange}
                placeholder="1"
                min="1"
                className={clsx(
                  "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  errors.totalQuantity && "border-red-500"
                )}
              />
              {errors.totalQuantity && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.totalQuantity}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Type *
                </label>
                <select
                  name="depositType"
                  value={formData.depositType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {depositTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Value *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="depositValue"
                    value={formData.depositValue}
                    onChange={handleInputChange}
                    placeholder="20"
                    min="0"
                    max={formData.depositType === "percent" ? "100" : undefined}
                    className={clsx(
                      "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                      errors.depositValue && "border-red-500"
                    )}
                  />
                  <div className="absolute right-3 top-3 text-gray-500 text-sm">
                    {formData.depositType === "percent" ? "%" : "₹"}
                  </div>
                </div>
                {errors.depositValue && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.depositValue}
                  </p>
                )}
              </div>
            </div>

            {/* Pricing Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Pricing Preview
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span>
                    ₹{formData.basePrice || 0}/{formData.unitType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Deposit:</span>
                  <span>
                    {formData.depositType === "percent"
                      ? `${formData.depositValue || 0}% of total`
                      : `₹${formData.depositValue || 0}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Images
              </h3>
              <p className="text-gray-600 mb-4">
                Add high-quality images to showcase your item. The first image
                will be the primary image.
              </p>
              <ImageUpload
                images={formData.images}
                onImagesChange={handleImagesChange}
                maxImages={10}
              />
              {errors.images && (
                <p className="text-red-500 text-sm mt-2">{errors.images}</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Booking Policies
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Booking Period
                  </label>
                  <select
                    name="policies.minimumBookingPeriod"
                    value={formData.policies.minimumBookingPeriod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="1">1 {formData.unitType}</option>
                    <option value="2">2 {formData.unitType}s</option>
                    <option value="3">3 {formData.unitType}s</option>
                    <option value="7">1 week</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Booking Period
                  </label>
                  <select
                    name="policies.maximumBookingPeriod"
                    value={formData.policies.maximumBookingPeriod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="7">1 week</option>
                    <option value="14">2 weeks</option>
                    <option value="30">1 month</option>
                    <option value="90">3 months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Policy
                </label>
                <select
                  name="policies.cancellationPolicy"
                  value={formData.policies.cancellationPolicy}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="flexible">
                    Flexible - Full refund until 24h before
                  </option>
                  <option value="moderate">
                    Moderate - Full refund until 48h before
                  </option>
                  <option value="strict">
                    Strict - Full refund until 7 days before
                  </option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="policies.instantBooking"
                  checked={formData.policies.instantBooking}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Enable instant booking (no approval required)
                </label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Review Your Listing
            </h3>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Preview of the listing */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {formData.title}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {formData.category} • {formData.location}
                  </p>
                </div>

                <p className="text-gray-700">{formData.description}</p>

                <div className="flex items-center space-x-4 text-sm">
                  <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded">
                    ₹{formData.basePrice}/{formData.unitType}
                  </span>
                  <span className="text-gray-600">
                    {formData.totalQuantity} available
                  </span>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {formData.images.slice(0, 4).map((image, index) => (
                      <img
                        key={index}
                        src={image.preview || image.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <ClockIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-yellow-800 font-medium">Almost ready!</h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    Your listing will be live once you submit it. You can always
                    edit it later from your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isHost()) {
    return null; // Will redirect
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Listing
        </h1>
        <p className="text-gray-600">
          Share your item with the community and start earning
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={clsx(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200",
                  currentStep >= step.id
                    ? "bg-primary-600 border-primary-600 text-white"
                    : "border-gray-300 text-gray-400"
                )}
              >
                {currentStep > step.id ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={clsx(
                    "w-full h-0.5 mx-4 transition-colors duration-200",
                    currentStep > step.id ? "bg-primary-600" : "bg-gray-300"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <div key={step.id} className="text-xs text-gray-600 text-center">
              {step.title}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={clsx(
            "px-6 py-3 rounded-lg font-medium transition-colors duration-200",
            currentStep === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          )}
        >
          Previous
        </button>

        {currentStep < 5 ? (
          <button
            onClick={nextStep}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200"
          >
            {isSubmitting ? "Creating..." : "Create Listing"}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateListing;
