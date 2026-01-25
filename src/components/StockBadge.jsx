import React from 'react';

const StockBadge = ({ quantity, showQuantity = false }) => {
  if (quantity === undefined || quantity === null) {
    return null;
  }

  const isOutOfStock = quantity <= 0;
  const isLowStock = quantity > 0 && quantity <= 5;
  const isInStock = quantity > 5;

  let statusClass = '';
  let statusText = '';

  if (isOutOfStock) {
    statusClass = 'out-of-stock';
    statusText = 'Esgotado';
  } else if (isLowStock) {
    statusClass = 'low-stock';
    statusText = showQuantity ? `Últimas ${quantity} unidades` : 'Últimas unidades';
  } else if (isInStock) {
    statusClass = 'in-stock';
    statusText = showQuantity ? `${quantity} em estoque` : 'Em estoque';
  }

  return (
    <span className={`stock-badge ${statusClass}`}>
      {statusText}
    </span>
  );
};

export default StockBadge;
