import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as storeApi from '../services/storeApi';
import Button from '../components/ui/Button';
import PixPayment from '../components/ui/PixPayment';

const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds
const MAX_AUTO_REFRESH_TIME = 30 * 60 * 1000; // 30 minutes

const formatMoney = (value) => {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '0'));
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00';
};

const PaymentPending = () => {
  const router = useRouter();
  
  // Support both token-based (secure) and legacy order-based access
  const tokenParam = router.isReady ? router.query.token : null;
  const orderParam = router.isReady ? router.query.order : null;
  
  const accessToken = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const orderNumber = Array.isArray(orderParam) ? orderParam[0] : orderParam;
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [checking, setChecking] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [loading, setLoading] = useState(true);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  // Initialize startTime on mount (not during render)
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  // Get PIX data from order details
  const pixCode = orderDetails?.pix_code || orderDetails?.payment?.qr_code || '';
  const pixQrCodeBase64 = orderDetails?.pix_qr_code || orderDetails?.payment?.qr_code_base64 || '';
  const totalAmount = orderDetails?.total || orderDetails?.total_amount || 0;
  const isPixPayment = orderDetails?.payment_method === 'pix' || !!pixCode;
  const displayStatus = orderDetails?.payment_status || 'pending';
  const displayOrderNumber = orderDetails?.order_number || orderNumber;

  // Fetch order data - prefer token-based access for security
  const fetchOrderData = useCallback(async () => {
    try {
      let data;
      if (accessToken) {
        // SECURE: Use token-based access
        data = await storeApi.getOrderByToken(accessToken);
      } else if (orderNumber) {
        // Legacy: Use order number (will require token in query params on backend)
        data = await storeApi.getOrderStatus(orderNumber);
      } else {
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }, [accessToken, orderNumber]);

  const checkStatus = useCallback(async (isAutoRefresh = false) => {
    if (!accessToken && !orderNumber) return;
    if (!isAutoRefresh) setChecking(true);
    
    try {
      const data = await fetchOrderData();
      if (!data) {
        setLoading(false);
        if (!isAutoRefresh) setChecking(false);
        return;
      }
      
      setOrderDetails(data);
      setLastChecked(new Date());
      setLoading(false);
      
      if (data.items) {
        setOrderItems(data.items);
      }
      
      const currentStatus = data.payment_status || data.status;
      const orderNum = data.order_number || orderNumber;

      if (currentStatus === 'completed' || currentStatus === 'approved' || currentStatus === 'paid') {
        setAutoRefreshEnabled(false);
        // Redirect with token if available for security
        const redirectUrl = accessToken 
          ? `/sucesso?token=${accessToken}` 
          : `/sucesso?order=${orderNum}`;
        router.push(redirectUrl);
      } else if (currentStatus === 'failed' || currentStatus === 'rejected' || currentStatus === 'cancelled') {
        setAutoRefreshEnabled(false);
        const redirectUrl = accessToken 
          ? `/erro?token=${accessToken}` 
          : `/erro?order=${orderNum}`;
        router.push(redirectUrl);
      }
    } catch {
      setLoading(false);
    }
    
    if (!isAutoRefresh) setChecking(false);
  }, [accessToken, orderNumber, fetchOrderData, router]);

  // Initial fetch
  useEffect(() => {
    if (!accessToken && !orderNumber) return;
    
    let isMounted = true;
    
    const fetchInitialStatus = async () => {
      try {
        const data = await fetchOrderData();
        if (!isMounted || !data) {
          setLoading(false);
          return;
        }
        
        setOrderDetails(data);
        setLastChecked(new Date());
        setLoading(false);
        
        if (data.items) {
          setOrderItems(data.items);
        }
        
        const currentStatus = data.payment_status || data.status;
        const orderNum = data.order_number || orderNumber;
        
        if (currentStatus === 'completed' || currentStatus === 'approved' || currentStatus === 'paid') {
          setAutoRefreshEnabled(false);
          const redirectUrl = accessToken 
            ? `/sucesso?token=${accessToken}` 
            : `/sucesso?order=${orderNum}`;
          router.push(redirectUrl);
        } else if (currentStatus === 'failed' || currentStatus === 'rejected') {
          setAutoRefreshEnabled(false);
          const redirectUrl = accessToken 
            ? `/erro?token=${accessToken}` 
            : `/erro?order=${orderNum}`;
          router.push(redirectUrl);
        }
      } catch {
        setLoading(false);
      }
    };
    
    fetchInitialStatus();
    
    return () => {
      isMounted = false;
    };
  }, [accessToken, orderNumber, fetchOrderData, router]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled || (!accessToken && !orderNumber)) return;

    intervalRef.current = setInterval(() => {
      // Stop auto-refresh after max time
      if (startTimeRef.current && Date.now() - startTimeRef.current > MAX_AUTO_REFRESH_TIME) {
        setAutoRefreshEnabled(false);
        return;
      }
      checkStatus(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshEnabled, accessToken, orderNumber, checkStatus]);


  return (
    <div className="status-page">
      <div className="status-card status-pending">
        <div className="status-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        </div>

        <h1 className="status-title">Pagamento em análise</h1>
        <p className="status-subtitle">
          Seu pagamento está sendo processado e será confirmado em breve.
        </p>

        {displayOrderNumber && (
          <div className="status-order">
            <span className="status-label">Número do Pedido:</span>
            <span className="status-value">{displayOrderNumber}</span>
          </div>
        )}

        {/* Detalhes do Pedido (Total e Status) */}
        {orderDetails && (
          <div className="status-details">
            <div className="status-row">
              <span>Status:</span>
              <span className="status-badge">{displayStatus}</span>
            </div>
            {orderDetails.subtotal > 0 && (
              <div className="status-row">
                <span>Subtotal:</span>
                <span>R$ {formatMoney(orderDetails.subtotal)}</span>
              </div>
            )}
            {orderDetails.delivery_fee > 0 && (
              <div className="status-row">
                <span>Entrega:</span>
                <span>R$ {formatMoney(orderDetails.delivery_fee)}</span>
              </div>
            )}
            {orderDetails.discount > 0 && (
              <div className="status-row">
                <span>Desconto:</span>
                <span style={{ color: '#16a34a' }}>-R$ {formatMoney(orderDetails.discount)}</span>
              </div>
            )}
            <div className="status-row status-row-total" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
              <span><strong>Total:</strong></span>
              <span className="status-price">
                <strong>R$ {formatMoney(totalAmount)}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Order Items */}
        {orderItems.length > 0 && (
          <div className="status-items">
            <h3 className="status-items-title">Itens do Pedido</h3>
            {orderItems.map((item) => (
              <div key={item.id} className="status-item">
                <div className="status-item-info">
                  <div className="status-item-name">{item.product_name}</div>
                  <div className="status-item-qty">Qtd: {item.quantity}</div>
                </div>
                <div className="status-item-price">
                  R$ {formatMoney(item.subtotal)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PIX Payment */}
        {isPixPayment && (pixCode || pixQrCodeBase64) ? (
          <>
            <PixPayment
              pixCode={pixCode}
              qrCodeBase64={pixQrCodeBase64}
              amount={totalAmount}
              onCopy={() => setPixCopied(true)}
            />
            {pixCopied && (
              <div className="status-info status-info-success" style={{ marginTop: '1rem' }}>
                <p>✅ Código PIX copiado!</p>
              </div>
            )}
          </>
        ) : isPixPayment && orderDetails && !loading ? (
          <div className="status-info status-info-warning" style={{ marginTop: '1rem' }}>
            <p>⏳ Aguardando dados do PIX...</p>
            <p className="text-sm">Se o QR Code não aparecer, tente atualizar a página.</p>
          </div>
        ) : null}

        {/* Loading state */}
        {loading && !orderDetails && (
          <div className="status-loading">
            <div className="status-loading-spinner"></div>
            <p>Carregando dados do pedido...</p>
          </div>
        )}

        {/* Informações */}
        <div className="status-info status-info-info">
          <h3 className="status-info-title">O que acontece agora?</h3>
          <ul className="status-info-list">
            {isPixPayment ? (
              <>
                <li>Pagamentos via PIX são confirmados em minutos.</li>
                <li>Escaneie o QR Code ou copie o código PIX acima.</li>
              </>
            ) : (
              <li>Aguarde a confirmação do pagamento.</li>
            )}
            <li>Você receberá um e-mail assim que o pagamento for confirmado.</li>
            <li>Se houver algum erro, você será notificado aqui.</li>
          </ul>
        </div>

        {/* Auto-refresh indicator */}
        {autoRefreshEnabled && (
          <div className="auto-refresh-indicator">
            <div className="auto-refresh-spinner"></div>
            <span>Verificando automaticamente a cada 5 segundos...</span>
          </div>
        )}

        {lastChecked && (
          <p className="status-last-checked">
            Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
          </p>
        )}

        <div className="status-actions">
           <Button 
             variant="primary" 
             onClick={() => checkStatus(false)} 
             disabled={checking}
             isLoading={checking}
           >
             {checking ? 'Verificando...' : 'Já paguei / Verificar status'}
           </Button>
           <Link href="/cardapio">
             <Button variant="outline">Voltar ao Cardápio</Button>
           </Link>
        </div>

        {!autoRefreshEnabled && (
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => { startTimeRef.current = Date.now(); setAutoRefreshEnabled(true); }}
          >
            Reativar verificação automática
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentPending;
