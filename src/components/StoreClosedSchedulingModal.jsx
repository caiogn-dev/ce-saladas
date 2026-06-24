import Modal from './ui/Modal';

/**
 * Modal informativo exibido 1x por dispositivo quando o cliente adiciona
 * ao carrinho enquanto a loja está fechada.
 * Informa que é possível agendar o pedido no checkout — nunca bloqueia o add.
 */
export default function StoreClosedSchedulingModal({ isOpen, onClose, onGoCheckout }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Estamos fechados agora"
      size="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontSize: '2rem', lineHeight: 1, margin: 0 }}>🗓️</p>
        <p style={{ margin: 0 }}>
          Mas você pode <strong>agendar</strong> seu pedido — é só escolher a data
          e o horário no checkout.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="ui-btn ui-btn--secondary ui-btn--md"
            onClick={onClose}
          >
            Continuar comprando
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--primary ui-btn--md"
            onClick={onGoCheckout}
          >
            Ir pro checkout
          </button>
        </div>
      </div>
    </Modal>
  );
}
