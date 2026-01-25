import React from 'react';
import Button from './Button';

/**
 * Empty State component for when there's no data to display
 * @param {Object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} props.actionLabel
 * @param {Function} props.onAction
 * @param {'sm' | 'md' | 'lg'} props.size
 */
const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  size = 'md',
  className = '',
  children,
}) => {
  const classes = [
    'ui-empty-state',
    `ui-empty-state--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {icon && (
        <div className="ui-empty-state__icon">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="ui-empty-state__title">{title}</h3>
      )}
      {description && (
        <p className="ui-empty-state__description">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button 
          variant="primary" 
          size={size === 'sm' ? 'sm' : 'md'}
          onClick={onAction}
          className="ui-empty-state__action"
        >
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
};

// Pre-built empty states
EmptyState.Cart = ({ onAction }) => (
  <EmptyState
    icon={
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
    }
    title="Seu carrinho está vazio"
    description="Adicione produtos deliciosos ao seu carrinho para continuar."
    actionLabel="Ver Cardápio"
    onAction={onAction}
  />
);

EmptyState.Orders = ({ onAction }) => (
  <EmptyState
    icon={
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    }
    title="Nenhum pedido encontrado"
    description="Você ainda não fez nenhum pedido. Que tal experimentar nossas delícias?"
    actionLabel="Fazer Pedido"
    onAction={onAction}
  />
);

EmptyState.Products = ({ onAction }) => (
  <EmptyState
    icon={
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    }
    title="Nenhum produto disponível"
    description="No momento não há produtos disponíveis. Volte em breve!"
    actionLabel={onAction ? "Voltar ao Início" : undefined}
    onAction={onAction}
  />
);

EmptyState.Search = ({ query, onAction }) => (
  <EmptyState
    icon={
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    }
    title="Nenhum resultado encontrado"
    description={query ? `Não encontramos resultados para "${query}".` : "Tente buscar por outro termo."}
    actionLabel="Limpar Busca"
    onAction={onAction}
  />
);

EmptyState.Error = ({ onAction }) => (
  <EmptyState
    icon={
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    }
    title="Algo deu errado"
    description="Ocorreu um erro ao carregar os dados. Por favor, tente novamente."
    actionLabel="Tentar Novamente"
    onAction={onAction}
  />
);

export default EmptyState;
