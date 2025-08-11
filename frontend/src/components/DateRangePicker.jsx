import { CalendarIcon } from '@heroicons/react/24/outline'

export default function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  className = "",
  disabled = false 
}) {
  const today = new Date().toISOString().slice(0, 16)

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CalendarIcon className="w-4 h-4 inline mr-1" />
          Start Date & Time
        </label>
        <input
          type="datetime-local"
          value={startDate}
          min={today}
          onChange={(e) => onStartDateChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-brand focus:border-brand transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CalendarIcon className="w-4 h-4 inline mr-1" />
          End Date & Time
        </label>
        <input
          type="datetime-local"
          value={endDate}
          min={startDate || today}
          onChange={(e) => onEndDateChange(e.target.value)}
          disabled={disabled || !startDate}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-brand focus:border-brand transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
      </div>

      {startDate && endDate && (
        <div className="p-3 bg-brand-50 rounded-lg">
          <p className="text-sm text-brand font-medium">
            Duration: {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} day(s)
          </p>
        </div>
      )}
    </div>
  )
}
