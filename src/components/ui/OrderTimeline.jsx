import React from 'react';

/**
 * Order status timeline component
 * Shows the progression of an order through different statuses
 */

const ORDER_STATUSES = [
  { key: 'pending', label: 'Pendente', icon: '📋' },
  { key: 'confirmed', label: 'Confirmado', icon: '✓' },
  { key: 'awaiting_payment', label: 'Aguardando Pagamento', icon: '💳' },
  { key: 'paid', label: 'Pago', icon: '💰' },
  { key: 'preparing', label: 'Preparando', icon: '👨‍🍳' },
  { key: 'shipped', label: 'Enviado', icon: '🚚' },
  { key: 'delivered', label: 'Entregue', icon: '✅' },
];

const CANCELLED_STATUS = { key: 'cancelled', label: 'Cancelado', icon: '❌' };

const getStatusIndex = (status) => {
  const index = ORDER_STATUSES.findIndex(s => s.key === status);
  return index === -1 ? 0 : index;
};

const OrderTimeline = ({ 
  currentStatus = 'pending',
  updatedAt,
  events = [],
  compact = false,
  className = '',
}) => {
  const isCancelled = currentStatus === 'cancelled';
  const currentIndex = getStatusIndex(currentStatus);

  // For compact mode, show only key statuses
  const displayStatuses = compact 
    ? ORDER_STATUSES.filter((_, i) => i === 0 || i === currentIndex || i === ORDER_STATUSES.length - 1)
    : ORDER_STATUSES;

  if (isCancelled) {
    return (
      <div className={`order-timeline order-timeline--cancelled ${className}`}>
        <div className="order-timeline__item order-timeline__item--cancelled">
          <div className="order-timeline__icon">
            <span>{CANCELLED_STATUS.icon}</span>
          </div>
          <div className="order-timeline__content">
            <span className="order-timeline__label">{CANCELLED_STATUS.label}</span>
            {updatedAt && (
              <span className="order-timeline__date">
                {new Date(updatedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`order-timeline ${compact ? 'order-timeline--compact' : ''} ${className}`}>
      {displayStatuses.map((status, index) => {
        const originalIndex = ORDER_STATUSES.findIndex(s => s.key === status.key);
        const isCompleted = originalIndex < currentIndex;
        const isCurrent = originalIndex === currentIndex;
        const isPending = originalIndex > currentIndex;

        // Find event for this status
        const event = events.find(e => e.status === status.key);

        return (
          <div 
            key={status.key}
            className={`order-timeline__item ${
              isCompleted ? 'order-timeline__item--completed' : ''
            } ${isCurrent ? 'order-timeline__item--current' : ''} ${
              isPending ? 'order-timeline__item--pending' : ''
            }`}
          >
            {/* Connector line */}
            {index > 0 && (
              <div className={`order-timeline__connector ${
                isCompleted || isCurrent ? 'order-timeline__connector--active' : ''
              }`} />
            )}

            {/* Icon */}
            <div className="order-timeline__icon">
              {isCompleted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span>{status.icon}</span>
              )}
            </div>

            {/* Content */}
            <div className="order-timeline__content">
              <span className="order-timeline__label">{status.label}</span>
              {event?.created_at && (
                <span className="order-timeline__date">
                  {new Date(event.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
              {isCurrent && !event?.created_at && updatedAt && (
                <span className="order-timeline__date">
                  {new Date(updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Simple status badge for order status
 */
const OrderStatusBadge = ({ status }) => {
  const statusConfig = ORDER_STATUSES.find(s => s.key === status) || CANCELLED_STATUS;
  
  const getVariant = () => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'pending':
      case 'awaiting_payment':
        return 'warning';
      case 'paid':
      case 'confirmed':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <span className={`order-status-badge order-status-badge--${getVariant()}`}>
      <span className="order-status-badge__icon">{statusConfig.icon}</span>
      <span className="order-status-badge__label">{statusConfig.label}</span>
    </span>
  );
};

OrderTimeline.StatusBadge = OrderStatusBadge;

export default OrderTimeline;
