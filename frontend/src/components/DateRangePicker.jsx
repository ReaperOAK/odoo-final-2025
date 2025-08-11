const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Date
        </label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          End Date
        </label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="input-field"
        />
      </div>
    </div>
  )
}

export default DateRangePicker
