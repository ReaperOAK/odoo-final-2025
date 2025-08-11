const StatusChip = ({ status }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-chip status-confirmed'
      case 'picked_up':
        return 'status-chip status-picked_up'
      case 'returned':
        return 'status-chip status-returned'
      case 'cancelled':
        return 'status-chip status-cancelled'
      default:
        return 'status-chip status-confirmed'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed'
      case 'picked_up':
        return 'Picked Up'
      case 'returned':
        return 'Returned'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  return (
    <span className={getStatusClass(status)}>
      {getStatusText(status)}
    </span>
  )
}

export default StatusChip
