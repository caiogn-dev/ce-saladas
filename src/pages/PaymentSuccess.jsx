import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as storeApi from '../services/storeApi';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5563992957931';

const PaymentSuccess = () => {
  const router = useRouter();
  
  // Support both token-based (secure) and legacy order-based access
  const tokenParam = router.query.token;
  const orderParam = router.query.order || router.query.external_reference;
  
  const accessToken = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const orderNumber = Array.isArray(orderParam) ? orderParam[0] : orderParam;
  
  const [orderDetails, setOrderDetails] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        let orderData = null;
        
        // Prefer token-based access for security
        if (accessToken) {
          orderData = await storeApi.getOrderByToken(accessToken);
        } else if (orderNumber) {
          orderData = await storeApi.getOrder(orderNumber);
        }
        
        if (orderData) {
          setOrderDetails(orderData);
          
          // Get WhatsApp URL using order ID
          const orderId = orderData.order_id || orderData.id;
          if (orderId) {
            try {
              const whatsappData = await storeApi.getOrderWhatsApp(orderId);
              setWhatsappUrl(whatsappData.whatsapp_url);
            } catch {
              // WhatsApp URL not available - will use generated URL
            }
          }
        }
      } catch {
        // Order details fetch failed - page will show without details
      }
      setLoading(false);
    };

    if (router.isReady) {
      fetchOrderDetails();
    }
  }, [router.isReady, accessToken, orderNumber]);

  // Get display order number
  const displayOrderNumber = orderDetails?.order_number || orderNumber;

  // Generate WhatsApp message if no API URL
  const generateWhatsAppUrl = () => {
    if (whatsappUrl) return whatsappUrl;
    
    const message = displayOrderNumber 
      ? `Olá! Gostaria de confirmar meu pedido #${displayOrderNumber}.`
      : 'Olá! Acabei de fazer um pedido e gostaria de confirmar.';
    
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="status-page">
      <div className="status-card status-success">
        <div className="status-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="22,4 12,14.01 9,11.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="status-title">Pagamento confirmado!</h1>
        <p className="status-subtitle">Seu pedido foi processado com sucesso.</p>

        {orderNumber && (
          <div className="status-order">
            <span className="status-label">Número do Pedido:</span>
            <span className="status-value">#{orderNumber}</span>
          </div>
        )}

        {orderDetails && (
          <div className="status-details">
            <div className="status-row">
              <span>Status:</span>
              <span className="status-badge status-badge-success">
                {orderDetails.status_display || orderDetails.payment_status || 'Aprovado'}
              </span>
            </div>
            <div className="status-row">
              <span>Total:</span>
              <span className="status-price">
                R$ {orderDetails.total ? Number(orderDetails.total).toFixed(2) : 
                    orderDetails.total_amount ? Number(orderDetails.total_amount).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        )}

        {!loading && (
          <p className="status-note">
            Você receberá um e-mail com os detalhes do seu pedido e informações de entrega.
          </p>
        )}

        {/* WhatsApp Confirmation */}
        <div className="whatsapp-confirmation">
          <p className="whatsapp-text">
            <span className="whatsapp-icon">📱</span>
            Confirme seu pedido pelo WhatsApp para agilizar a entrega!
          </p>
          <a 
            href={generateWhatsAppUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="whatsapp-button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Confirmar pelo WhatsApp
          </a>
        </div>

        <div className="status-actions">
          <Link href="/cardapio" className="status-button status-button-primary">
            Continuar comprando
          </Link>
          <Link href="/" className="status-button status-button-secondary">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
