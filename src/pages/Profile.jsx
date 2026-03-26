import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import * as storeApi from '../services/storeApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import PageTransition, { StaggeredList, AnimatedCard } from '../components/ui/PageTransition';
import {
  BRAZILIAN_STATES,
  formatCPF, formatPhone, formatCEP, formatMoney,
  ORDER_STATUS_CONFIG as STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '../utils/brazil';
// CSS is imported globally in _app.js



const buildFormData = (profile) => ({
  first_name: profile?.first_name || '',
  last_name: profile?.last_name || '',
  email: profile?.email || '',
  phone: profile?.phone ? formatPhone(profile.phone) : '',
  cpf: profile?.cpf ? formatCPF(profile.cpf) : '',
  address: profile?.address || '',
  number: profile?.number || '',
  complement: profile?.complement || '',
  neighborhood: profile?.neighborhood || '',
  city: profile?.city || '',
  state: profile?.state || '',
  zip_code: profile?.zip_code ? formatCEP(profile.zip_code) : ''
});

// Order Detail Modal Component
const OrderDetailModal = ({ order, onClose, onReorder }) => {
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  
  useEffect(() => {
    const fetchDetails = async () => {
      if (!order?.id) return;
      setLoading(true);
      try {
        const details = await storeApi.getOrder(order.id);
        setOrderDetails(details);
      } catch (err) {
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [order?.id]);

  if (!order) return null;

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const paymentConfig = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.pending;
  const items = orderDetails?.items || order.items || [];
  const createdAt = order.created_at ? new Date(order.created_at) : null;
  
  // Check if payment is pending and has access_token for payment link
  const isPendingPayment = order.payment_status === 'pending' || orderDetails?.payment_status === 'pending';
  const accessToken = orderDetails?.access_token || order.access_token;
  const hasPixCode = orderDetails?.pix_code || order.pix_code;
  
  // Generate payment link using secure access_token
  const getPaymentLink = () => {
    if (accessToken) {
      return `https://ce-saladas.com.br/pendente?token=${accessToken}`;
    }
    return null;
  };
  
  const paymentLink = getPaymentLink();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
        
        <div className="order-modal-header">
          <div>
            <h2>Pedido {order.order_number}</h2>
            {createdAt && (
              <p className="order-modal-date">
                {createdAt.toLocaleDateString('pt-BR', { 
                  day: '2-digit', month: 'long', year: 'numeric', 
                  hour: '2-digit', minute: '2-digit' 
                })}
              </p>
            )}
          </div>
          <div 
            className="order-status-badge"
            style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
          >
            <span>{statusConfig.icon}</span>
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {loading ? (
          <div className="order-modal-loading">
            <div className="spinner"></div>
            <p>Carregando detalhes...</p>
          </div>
        ) : (
          <>
            {/* Payment Status */}
            <div className="order-modal-section">
              <h3>💳 Pagamento</h3>
              <div className="order-payment-info">
                <div className="payment-status" style={{ color: paymentConfig.color }}>
                  <span>{paymentConfig.icon}</span>
                  <span>{paymentConfig.label}</span>
                </div>
                {/* Show payment link button ONLY if payment is pending */}
                {isPendingPayment && paymentLink && (
                  <a 
                    href={paymentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-payment-link"
                  >
                    {hasPixCode ? '📱 Ver QR Code PIX' : '💳 Pagar agora'} →
                  </a>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="order-modal-section">
              <h3>🛒 Itens do pedido</h3>
              <div className="order-items-list">
                {items.length > 0 ? items.map((item, idx) => (
                  <div key={item.id || idx} className="order-item-row">
                    <div className="order-item-info">
                      <span className="order-item-qty">{item.quantity}x</span>
                      <span className="order-item-name">{item.product_name}</span>
                      {item.variant_name && (
                        <span className="order-item-variant">({item.variant_name})</span>
                      )}
                    </div>
                    <span className="order-item-price">
                      R$ {formatMoney(item.subtotal || (item.unit_price * item.quantity))}
                    </span>
                  </div>
                )) : (
                  <p className="order-items-empty">Nenhum item encontrado</p>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-modal-section order-summary">
              <div className="order-summary-row">
                <span>Subtotal</span>
                <span>R$ {formatMoney(orderDetails?.subtotal || order.subtotal || 0)}</span>
              </div>
              {(orderDetails?.delivery_fee || order.delivery_fee) > 0 && (
                <div className="order-summary-row">
                  <span>Entrega</span>
                  <span>R$ {formatMoney(orderDetails?.delivery_fee || order.delivery_fee)}</span>
                </div>
              )}
              {(orderDetails?.discount || order.discount) > 0 && (
                <div className="order-summary-row discount">
                  <span>Desconto</span>
                  <span>-R$ {formatMoney(orderDetails?.discount || order.discount)}</span>
                </div>
              )}
              <div className="order-summary-row total">
                <span>Total</span>
                <span>R$ {formatMoney(orderDetails?.total || order.total || order.total_amount || 0)}</span>
              </div>
            </div>

            {/* Delivery Info */}
            {(orderDetails?.delivery_method === 'delivery' || order.delivery_method === 'delivery') && (
              <div className="order-modal-section">
                <h3>📍 Entrega</h3>
                <p className="order-delivery-address">
                  {orderDetails?.delivery_address?.label || 
                   orderDetails?.delivery_address?.street ||
                   order.shipping_address || 
                   'Endereço não informado'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="order-modal-actions">
              <button className="btn-secondary" onClick={onClose}>
                Fechar
              </button>
              {/* Show payment link button ONLY if payment is pending */}
              {isPendingPayment && paymentLink && (
                <a 
                  href={paymentLink}
                  className="btn-warning"
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  💳 Link de Pagamento
                </a>
              )}
              <button className="btn-primary" onClick={() => onReorder(order)}>
                🔄 Pedir novamente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Preferences defaults
const DEFAULT_PREFERENCES = {
  notifications_email: true,
  notifications_whatsapp: true,
  notifications_push: false,
  marketing_emails: false,
  order_updates: true,
  delivery_instructions: '',
  preferred_payment: 'pix',
};

const Profile = () => {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(() => buildFormData(profile));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({ total_orders: 0, total_spent: 0 });
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Preferences state
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesSuccess, setPreferencesSuccess] = useState('');

  useEffect(() => {
    setFormData(buildFormData(profile));
  }, [profile]);

  useEffect(() => {
    if (activeTab !== 'orders' || ordersLoaded) {
      return;
    }

    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError('');
      try {
        const data = await storeApi.getUserOrders();
        const ordersList = data.results || data.recent_orders || data || [];
        const ordersArray = Array.isArray(ordersList) ? ordersList : [];
        setOrders(ordersArray);
        
        // Calculate stats
        const totalSpent = ordersArray.reduce((sum, o) => sum + (o.total || o.total_amount || 0), 0);
        setOrderStats({ 
          total_orders: ordersArray.length, 
          total_spent: totalSpent 
        });
        setOrdersLoaded(true);
      } catch {
        setOrdersError('Não foi possível carregar seus pedidos.');
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab, ordersLoaded]);

  // Load addresses when tab is active
  useEffect(() => {
    if (activeTab !== 'addresses') return;
    
    const loadAddresses = async () => {
      setAddressesLoading(true);
      try {
        // Try to get addresses from profile or API
        const savedAddresses = profile?.addresses || [];
        setAddresses(savedAddresses);
      } catch (err) {
        console.error('Error loading addresses:', err);
      } finally {
        setAddressesLoading(false);
      }
    };
    
    loadAddresses();
  }, [activeTab, profile]);

  // Load preferences when tab is active
  useEffect(() => {
    if (activeTab !== 'preferences') return;
    
    const loadPreferences = async () => {
      setPreferencesLoading(true);
      try {
        // Try to get preferences from profile
        const savedPrefs = profile?.preferences || {};
        setPreferences({ ...DEFAULT_PREFERENCES, ...savedPrefs });
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setPreferencesLoading(false);
      }
    };
    
    loadPreferences();
  }, [activeTab, profile]);

  // Handle preference change
  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setPreferencesSuccess('');
  };

  // Save preferences
  const handleSavePreferences = async () => {
    setPreferencesSaving(true);
    setPreferencesSuccess('');
    try {
      await updateProfile({ preferences });
      setPreferencesSuccess('Preferências salvas com sucesso!');
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setPreferencesSaving(false);
    }
  };

  // Handle address form change
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    if (editingAddress) {
      setEditingAddress(prev => ({ ...prev, [name]: val }));
    } else {
      setNewAddress(prev => ({ ...prev, [name]: val }));
    }
  };

  // Save address
  const handleSaveAddress = async () => {
    const addressData = editingAddress || newAddress;
    
    try {
      let updatedAddresses;
      if (editingAddress) {
        updatedAddresses = addresses.map(a => 
          a.id === editingAddress.id ? { ...addressData } : a
        );
      } else {
        const newId = Date.now().toString();
        updatedAddresses = [...addresses, { ...addressData, id: newId }];
      }
      
      // If this is default, unset others
      if (addressData.is_default) {
        updatedAddresses = updatedAddresses.map(a => ({
          ...a,
          is_default: a.id === (editingAddress?.id || updatedAddresses[updatedAddresses.length - 1].id)
        }));
      }
      
      await updateProfile({ addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      setEditingAddress(null);
      setShowAddressForm(false);
      setNewAddress({
        label: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
        is_default: false
      });
    } catch (err) {
      console.error('Error saving address:', err);
    }
  };

  // Delete address
  const handleDeleteAddress = async (addressId) => {
    try {
      const updatedAddresses = addresses.filter(a => a.id !== addressId);
      await updateProfile({ addresses: updatedAddresses });
      setAddresses(updatedAddresses);
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  const formattedAddress = useMemo(() => {
    if (!profile) return 'Não informado';
    const street = [profile.address, profile.number].filter(Boolean).join(', ');
    const streetWithComplement = profile.complement ? `${street} - ${profile.complement}` : street;
    const parts = [
      streetWithComplement || null,
      profile.neighborhood,
      profile.city,
      profile.state,
      profile.zip_code ? formatCEP(profile.zip_code) : null,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Não informado';
  }, [profile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    let formattedValue = value;

    if (name === 'phone') formattedValue = formatPhone(value);
    if (name === 'cpf') formattedValue = formatCPF(value);
    if (name === 'zip_code') formattedValue = formatCEP(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleCancel = () => {
    setFormData(buildFormData(profile));
    setIsEditing(false);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      await updateProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        cpf: formData.cpf.replace(/\D/g, ''),
        address: formData.address.trim(),
        number: formData.number.trim(),
        complement: formData.complement.trim(),
        neighborhood: formData.neighborhood.trim(),
        city: formData.city.trim(),
        state: formData.state,
        zip_code: formData.zip_code.replace(/\D/g, '')
      });
      setSaveSuccess('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch {
      setSaveError('Não foi possível atualizar o perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = useCallback(async (order) => {
    try {
      // Fetch full order details if needed
      const details = await storeApi.getOrder(order.id);
      const items = details?.items || [];
      
      // Add items to cart
      for (const item of items) {
        // We need product data to add to cart - redirect to menu for now
        // In a full implementation, we'd fetch product details and add directly
      }
      
      // Navigate to menu with a message
      router.push('/cardapio');
    } catch (err) {
      console.error('Error reordering:', err);
      router.push('/cardapio');
    }
  }, [router]);

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container">
        <PageTransition animation="fadeUp" delay={0}>
          <div className="profile-header">
            <h1>Minha conta</h1>
            <p>Gerencie seus dados e acompanhe seus pedidos.</p>
          </div>
        </PageTransition>

        <PageTransition animation="fadeUp" delay={100}>
          <div className="profile-tabs" role="tablist" aria-label="Perfil e pedidos">
            <button
              type="button"
              className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
              role="tab"
              aria-selected={activeTab === 'profile'}
            >
              👤 Perfil
            </button>
            <button
              type="button"
              className={`profile-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
              role="tab"
              aria-selected={activeTab === 'orders'}
            >
              📦 Pedidos
            </button>
            <button
              type="button"
              className={`profile-tab ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
              role="tab"
              aria-selected={activeTab === 'addresses'}
            >
              📍 Endereços
            </button>
            <button
              type="button"
              className={`profile-tab ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
              role="tab"
              aria-selected={activeTab === 'preferences'}
            >
              ⚙️ Preferências
            </button>
          </div>
        </PageTransition>

        {activeTab === 'profile' && (
          <div className="profile-card">
            {!isEditing ? (
              <>
                <div className="profile-info-grid">
                  <div>
                    <span className="profile-label">Nome</span>
                    <span className="profile-value">
                      {profile?.first_name || profile?.last_name
                        ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
                        : 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="profile-label">E-mail</span>
                    <span className="profile-value">{profile?.email || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="profile-label">Telefone</span>
                    <span className="profile-value">
                      {profile?.phone ? formatPhone(profile.phone) : 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="profile-label">CPF</span>
                    <span className="profile-value">
                      {profile?.cpf ? formatCPF(profile.cpf) : 'Não informado'}
                    </span>
                  </div>
                  <div className="profile-info-full">
                    <span className="profile-label">Endereço</span>
                    <span className="profile-value">{formattedAddress}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary profile-edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  Editar informações
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">Nome</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Nome"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Sobrenome</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Sobrenome"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">Telefone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">CPF</label>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Rua / Logradouro</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Rua das Flores"
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">Número</label>
                    <input
                      type="text"
                      name="number"
                      value={formData.number}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="123"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Complemento</label>
                    <input
                      type="text"
                      name="complement"
                      value={formData.complement}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Apto 4, Bloco B"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Bairro</label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Centro"
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">Cidade</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Estado</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="form-input"
                    >
                      <option value="">Selecione</option>
                      {BRAZILIAN_STATES.map((state) => (
                        <option key={state.value} value={state.value}>{state.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">CEP</label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="00000-000"
                  />
                </div>

                {saveError && <div className="profile-alert">{saveError}</div>}
                {saveSuccess && <div className="profile-alert profile-alert-success">{saveSuccess}</div>}

                <div className="profile-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="profile-card">
            <div className="orders-summary">
              <div>
                <span className="profile-label">Total de pedidos</span>
                <span className="profile-value">{orderStats.total_orders || 0}</span>
              </div>
              <div>
                <span className="profile-label">Total gasto</span>
                <span className="profile-value">R$ {formatMoney(orderStats.total_spent)}</span>
              </div>
            </div>

            {ordersLoading && (
              <div className="profile-loading">Carregando pedidos...</div>
            )}

            {ordersError && (
              <div className="profile-alert">{ordersError}</div>
            )}

            {!ordersLoading && !ordersError && orders.length === 0 && (
              <div className="profile-empty">Você ainda não realizou pedidos.</div>
            )}

            {!ordersLoading && orders.length > 0 && (
              <div className="orders-list">
                {orders.map((order) => {
                  const itemCount = order.items_count || (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
                  const createdAt = order.created_at ? new Date(order.created_at) : null;
                  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const paymentConfig = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.pending;
                  
                  return (
                    <div 
                      key={order.id} 
                      className="order-card"
                      onClick={() => setSelectedOrder(order)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedOrder(order)}
                    >
                      <div className="order-header">
                        <div className="order-header-left">
                          <span className="order-number">{order.order_number}</span>
                          {createdAt && (
                            <span className="order-date">
                              {createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                        <div 
                          className="order-status-pill"
                          style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </div>
                      </div>
                      
                      <div className="order-body">
                        <div className="order-info-row">
                          <div className="order-detail">
                            <span className="order-detail-label">Itens</span>
                            <span className="order-detail-value">{itemCount}</span>
                          </div>
                          <div className="order-detail">
                            <span className="order-detail-label">Total</span>
                            <span className="order-detail-value order-total">
                              R$ {formatMoney(order.total || order.total_amount)}
                            </span>
                          </div>
                          <div className="order-detail">
                            <span className="order-detail-label">Pagamento</span>
                            <span 
                              className="order-detail-value"
                              style={{ color: paymentConfig.color }}
                            >
                              {paymentConfig.icon} {paymentConfig.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="order-footer">
                        <span className="order-view-details">
                          Ver detalhes →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <PageTransition animation="fadeUp" delay={150}>
            <div className="profile-card">
              <div className="addresses-header">
                <h2>Meus Endereços</h2>
                <button 
                  type="button" 
                  className="btn-primary btn-sm"
                  onClick={() => { setShowAddressForm(true); setEditingAddress(null); }}
                >
                  + Adicionar
                </button>
              </div>

              {addressesLoading && (
                <div className="profile-loading">Carregando endereços...</div>
              )}

              {!addressesLoading && addresses.length === 0 && !showAddressForm && (
                <div className="profile-empty">
                  <span className="empty-icon">📍</span>
                  <p>Você ainda não cadastrou nenhum endereço.</p>
                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={() => setShowAddressForm(true)}
                  >
                    Adicionar primeiro endereço
                  </button>
                </div>
              )}

              {/* Address List */}
              {!addressesLoading && addresses.length > 0 && !showAddressForm && !editingAddress && (
                <div className="addresses-list">
                  <StaggeredList staggerDelay={50} animation="fadeUp">
                    {addresses.map((addr) => (
                      <AnimatedCard key={addr.id} hover={true}>
                        <div className="address-card">
                          <div className="address-card-header">
                            <span className="address-label">
                              {addr.label || 'Endereço'}
                              {addr.is_default && <span className="default-badge">Padrão</span>}
                            </span>
                            <div className="address-actions">
                              <button 
                                type="button" 
                                className="btn-icon"
                                onClick={() => setEditingAddress(addr)}
                                aria-label="Editar"
                              >
                                ✏️
                              </button>
                              <button 
                                type="button" 
                                className="btn-icon btn-danger"
                                onClick={() => handleDeleteAddress(addr.id)}
                                aria-label="Excluir"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <p className="address-text">
                            {addr.street}, {addr.number}
                            {addr.complement && ` - ${addr.complement}`}
                          </p>
                          <p className="address-text-secondary">
                            {addr.neighborhood} - {addr.city}/{addr.state}
                          </p>
                          <p className="address-text-secondary">
                            CEP: {formatCEP(addr.zip_code || '')}
                          </p>
                        </div>
                      </AnimatedCard>
                    ))}
                  </StaggeredList>
                </div>
              )}

              {/* Address Form */}
              {(showAddressForm || editingAddress) && (
                <div className="address-form">
                  <h3>{editingAddress ? 'Editar Endereço' : 'Novo Endereço'}</h3>
                  
                  <div className="form-field">
                    <label className="form-label">Nome do endereço</label>
                    <input
                      type="text"
                      name="label"
                      value={editingAddress?.label || newAddress.label}
                      onChange={handleAddressChange}
                      className="form-input"
                      placeholder="Ex: Casa, Trabalho"
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">Rua/Avenida</label>
                    <input
                      type="text"
                      name="street"
                      value={editingAddress?.street || newAddress.street}
                      onChange={handleAddressChange}
                      className="form-input"
                      placeholder="Nome da rua"
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label className="form-label">Número</label>
                      <input
                        type="text"
                        name="number"
                        value={editingAddress?.number || newAddress.number}
                        onChange={handleAddressChange}
                        className="form-input"
                        placeholder="Nº"
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Complemento</label>
                      <input
                        type="text"
                        name="complement"
                        value={editingAddress?.complement || newAddress.complement}
                        onChange={handleAddressChange}
                        className="form-input"
                        placeholder="Apto, Bloco..."
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label">Bairro</label>
                    <input
                      type="text"
                      name="neighborhood"
                      value={editingAddress?.neighborhood || newAddress.neighborhood}
                      onChange={handleAddressChange}
                      className="form-input"
                      placeholder="Bairro"
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label className="form-label">Cidade</label>
                      <input
                        type="text"
                        name="city"
                        value={editingAddress?.city || newAddress.city}
                        onChange={handleAddressChange}
                        className="form-input"
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Estado</label>
                      <select
                        name="state"
                        value={editingAddress?.state || newAddress.state}
                        onChange={handleAddressChange}
                        className="form-input"
                      >
                        <option value="">Selecione</option>
                        {BRAZILIAN_STATES.map((state) => (
                          <option key={state.value} value={state.value}>{state.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label">CEP</label>
                    <input
                      type="text"
                      name="zip_code"
                      value={formatCEP(editingAddress?.zip_code || newAddress.zip_code)}
                      onChange={handleAddressChange}
                      className="form-input"
                      placeholder="00000-000"
                    />
                  </div>

                  <div className="form-field checkbox-field">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_default"
                        checked={editingAddress?.is_default || newAddress.is_default}
                        onChange={handleAddressChange}
                      />
                      <span>Definir como endereço padrão</span>
                    </label>
                  </div>

                  <div className="profile-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => { setShowAddressForm(false); setEditingAddress(null); }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSaveAddress}
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </PageTransition>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <PageTransition animation="fadeUp" delay={150}>
            <div className="profile-card">
              <h2 className="preferences-title">Preferências</h2>

              {preferencesLoading && (
                <div className="profile-loading">Carregando preferências...</div>
              )}

              {!preferencesLoading && (
                <div className="preferences-sections">
                  {/* Notifications Section */}
                  <div className="preferences-section">
                    <h3>🔔 Notificações</h3>
                    <div className="preferences-options">
                      <label className="preference-toggle">
                        <span className="preference-label">
                          <span className="preference-icon">📧</span>
                          Notificações por e-mail
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.notifications_email}
                          onChange={(e) => handlePreferenceChange('notifications_email', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>

                      <label className="preference-toggle">
                        <span className="preference-label">
                          <span className="preference-icon">📱</span>
                          Notificações por WhatsApp
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.notifications_whatsapp}
                          onChange={(e) => handlePreferenceChange('notifications_whatsapp', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>

                      <label className="preference-toggle">
                        <span className="preference-label">
                          <span className="preference-icon">🔔</span>
                          Notificações push
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.notifications_push}
                          onChange={(e) => handlePreferenceChange('notifications_push', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {/* Order Updates Section */}
                  <div className="preferences-section">
                    <h3>📦 Atualizações de Pedidos</h3>
                    <div className="preferences-options">
                      <label className="preference-toggle">
                        <span className="preference-label">
                          <span className="preference-icon">✅</span>
                          Receber atualizações de status
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.order_updates}
                          onChange={(e) => handlePreferenceChange('order_updates', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>

                      <label className="preference-toggle">
                        <span className="preference-label">
                          <span className="preference-icon">📣</span>
                          Receber promoções e novidades
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.marketing_emails}
                          onChange={(e) => handlePreferenceChange('marketing_emails', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {/* Delivery Section */}
                  <div className="preferences-section">
                    <h3>🚗 Entrega</h3>
                    <div className="form-field">
                      <label className="form-label">Instruções de entrega padrão</label>
                      <textarea
                        className="form-input form-textarea"
                        value={preferences.delivery_instructions}
                        onChange={(e) => handlePreferenceChange('delivery_instructions', e.target.value)}
                        placeholder="Ex: Tocar interfone 101, deixar na portaria..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Payment Section */}
                  <div className="preferences-section">
                    <h3>💳 Pagamento</h3>
                    <div className="form-field">
                      <label className="form-label">Método de pagamento preferido</label>
                      <select
                        className="form-input"
                        value={preferences.preferred_payment}
                        onChange={(e) => handlePreferenceChange('preferred_payment', e.target.value)}
                      >
                        <option value="pix">PIX</option>
                        <option value="credit_card">Cartão de Crédito</option>
                        <option value="cash">Dinheiro</option>
                      </select>
                    </div>
                  </div>

                  {preferencesSuccess && (
                    <div className="profile-alert profile-alert-success">{preferencesSuccess}</div>
                  )}

                  <div className="profile-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSavePreferences}
                      disabled={preferencesSaving}
                    >
                      {preferencesSaving ? 'Salvando...' : 'Salvar Preferências'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </PageTransition>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onReorder={handleReorder}
        />
      )}
    </div>
  );
};

export default Profile;
