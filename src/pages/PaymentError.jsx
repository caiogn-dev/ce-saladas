import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as storeApi from '../services/storeApi';

const PaymentError = () => {
  const router = useRouter();
  
  // Support both token-based (secure) and legacy order-based access
  const tokenParam = router.query.token;
  const orderParam = router.query.order;
  const errorParam = router.query.error;
  
  const accessToken = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const orderNumber = Array.isArray(orderParam) ? orderParam[0] : orderParam;
  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        let orderData = null;
        
        if (accessToken) {
          orderData = await storeApi.getOrderByToken(accessToken);
        } else if (orderNumber) {
          orderData = await storeApi.getOrder(orderNumber);
        }
        
        if (orderData) {
          setOrderDetails(orderData);
        }
      } catch {
        // Order details fetch failed
      }
    };

    if (router.isReady && (accessToken || orderNumber)) {
      fetchOrderDetails();
    }
  }, [router.isReady, accessToken, orderNumber]);

  const displayOrderNumber = orderDetails?.order_number || orderNumber;

  const getErrorMessage = (code) => {
    const errorMessages = {
      cc_rejected_bad_filled_card_number: 'Número do cartão inválido',
      cc_rejected_bad_filled_date: 'Data de validade inválida',
      cc_rejected_bad_filled_other: 'Dados do cartão incorretos',
      cc_rejected_bad_filled_security_code: 'Código de segurança inválido',
      cc_rejected_blacklist: 'Cartão não autorizado',
      cc_rejected_call_for_authorize: 'Autorização necessária - entre em contato com seu banco',
      cc_rejected_card_disabled: 'Cartão desabilitado',
      cc_rejected_duplicated_payment: 'Pagamento duplicado',
      cc_rejected_high_risk: 'Pagamento recusado por segurança',
      cc_rejected_insufficient_amount: 'Saldo insuficiente',
      cc_rejected_invalid_installments: 'Parcelas inválidas',
      cc_rejected_max_attempts: 'Limite de tentativas excedido',
      cc_rejected_other_reason: 'Pagamento recusado',
    };
    return errorMessages[code] || 'Ocorreu um erro ao processar seu pagamento';
  };

  return (
    <div className="status-page">
      <div className="status-card status-error">
        <div className="status-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h1 className="status-title">Pagamento não aprovado</h1>
        <p className="status-subtitle">{getErrorMessage(errorCode)}</p>

        {displayOrderNumber && (
          <div className="status-order">
            <span className="status-label">Pedido:</span>
            <span className="status-value">{displayOrderNumber}</span>
          </div>
        )}

        <div className="status-info status-info-warning">
          <h3 className="status-info-title">O que você pode fazer:</h3>
          <ul className="status-info-list">
            <li>Verificar os dados do cartão</li>
            <li>Tentar outro método de pagamento</li>
            <li>Entrar em contato com seu banco</li>
            <li>Tentar novamente em alguns minutos</li>
          </ul>
        </div>

        <div className="status-actions">
          <Link href="/checkout" className="status-button status-button-primary">
            Tentar novamente
          </Link>
          <Link href="/cardapio" className="status-button status-button-secondary">
            Voltar ao cardápio
          </Link>
        </div>

        <p className="status-note">Precisa de ajuda? Entre em contato pelo WhatsApp</p>
      </div>
    </div>
  );
};

export default PaymentError;
