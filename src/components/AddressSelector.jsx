'use client';

import { useState, useCallback, useEffect } from 'react';
import InteractiveMap from './InteractiveMap';
import { lookupCEP, geocodeBrazilianAddress } from '../services/hereMapService';

const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' }, { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' }, { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' }, { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' }, { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' }, { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

const formatCEP = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

/**
 * Address Selector Component
 * 
 * Combines an interactive map with address form fields.
 * Allows users to:
 * - Select location on map
 * - Use current location
 * - Search for address
 * - Enter address manually
 * - Auto-fill from CEP
 */
export default function AddressSelector({
  initialAddress = {},
  onAddressChange,
  onLocationChange,
  showMap = true,
  mapHeight = '300px',
  required = false,
  errors = {},
  disabled = false,
}) {
  const [address, setAddress] = useState({
    address: initialAddress.address || '',
    number: initialAddress.number || '',
    complement: initialAddress.complement || '',
    neighborhood: initialAddress.neighborhood || '',
    city: initialAddress.city || '',
    state: initialAddress.state || '',
    zip_code: initialAddress.zip_code || '',
    latitude: initialAddress.latitude || null,
    longitude: initialAddress.longitude || null,
  });

  const [loadingCEP, setLoadingCEP] = useState(false);
  const [selectionMode, setSelectionMode] = useState('map'); // 'map' or 'manual'
  const [mapLocation, setMapLocation] = useState(
    initialAddress.latitude && initialAddress.longitude
      ? { latitude: initialAddress.latitude, longitude: initialAddress.longitude }
      : null
  );

  // Notify parent of address changes
  useEffect(() => {
    onAddressChange?.(address);
  }, [address, onAddressChange]);

  // Handle form field changes
  const handleFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'zip_code') {
      formattedValue = formatCEP(value);
    }

    setAddress(prev => ({
      ...prev,
      [name]: formattedValue,
    }));
  }, []);

  // Handle CEP blur - auto-fill address
  const handleCEPBlur = useCallback(async () => {
    const cleanCEP = address.zip_code.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    setLoadingCEP(true);
    try {
      const cepData = await lookupCEP(cleanCEP);
      if (cepData) {
        setAddress(prev => ({
          ...prev,
          address: cepData.address || prev.address,
          neighborhood: cepData.neighborhood || prev.neighborhood,
          city: cepData.city || prev.city,
          state: cepData.state || prev.state,
        }));

        // Try to geocode the address
        const location = await geocodeBrazilianAddress(cleanCEP, {
          address: cepData.address,
          city: cepData.city,
          state: cepData.state,
        });

        if (location) {
          setAddress(prev => ({
            ...prev,
            latitude: location.latitude,
            longitude: location.longitude,
          }));
          setMapLocation({
            latitude: location.latitude,
            longitude: location.longitude,
          });
          onLocationChange?.({
            latitude: location.latitude,
            longitude: location.longitude,
          });
        }
      }
    } catch {
      // CEP lookup failed - user can enter address manually
    } finally {
      setLoadingCEP(false);
    }
  }, [address.zip_code, onLocationChange]);

  // Handle map location selection
  const handleMapLocationSelect = useCallback((location) => {
    setMapLocation(location);
    setAddress(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
    onLocationChange?.(location);
  }, [onLocationChange]);

  // Handle map address change (from reverse geocoding)
  const handleMapAddressChange = useCallback((addressData) => {
    if (!addressData) return;

    setAddress(prev => ({
      ...prev,
      address: addressData.address || prev.address,
      city: addressData.city || prev.city,
      state: addressData.state || prev.state,
      zip_code: addressData.zip_code ? formatCEP(addressData.zip_code) : prev.zip_code,
    }));
  }, []);

  return (
    <div className="address-selector">
      {/* Selection mode tabs */}
      {showMap && (
        <div className="selection-tabs">
          <button
            type="button"
            className={`tab ${selectionMode === 'map' ? 'active' : ''}`}
            onClick={() => setSelectionMode('map')}
            disabled={disabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Selecionar no Mapa
          </button>
          <button
            type="button"
            className={`tab ${selectionMode === 'manual' ? 'active' : ''}`}
            onClick={() => setSelectionMode('manual')}
            disabled={disabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Digitar Endereço
          </button>
        </div>
      )}

      {/* Map section */}
      {showMap && selectionMode === 'map' && (
        <div className="map-section">
          <InteractiveMap
            initialLocation={mapLocation}
            onLocationSelect={handleMapLocationSelect}
            onAddressChange={handleMapAddressChange}
            height={mapHeight}
            showSearch={true}
            showGeolocation={true}
            placeholder="Buscar endereço ou CEP..."
          />
          <p className="map-hint">
            Clique no mapa para selecionar o local de entrega ou use sua localização atual.
          </p>
        </div>
      )}

      {/* Address form fields */}
      <div className={`address-form ${selectionMode === 'map' && showMap ? 'collapsed' : ''}`}>
        <div className="form-row">
          <div className="form-group cep-group">
            <label htmlFor="zip_code">
              CEP {required && <span className="required">*</span>}
            </label>
            <div className="input-with-loader">
              <input
                type="text"
                id="zip_code"
                name="zip_code"
                value={address.zip_code}
                onChange={handleFieldChange}
                onBlur={handleCEPBlur}
                placeholder="00000-000"
                maxLength={9}
                disabled={disabled || loadingCEP}
                className={errors.zip_code ? 'error' : ''}
              />
              {loadingCEP && <div className="input-loader"></div>}
            </div>
            {errors.zip_code && <span className="error-message">{errors.zip_code}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group address-group">
            <label htmlFor="address">
              Endereço {required && <span className="required">*</span>}
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={address.address}
              onChange={handleFieldChange}
              placeholder="Rua, Avenida..."
              disabled={disabled}
              className={errors.address ? 'error' : ''}
            />
            {errors.address && <span className="error-message">{errors.address}</span>}
          </div>

          <div className="form-group number-group">
            <label htmlFor="number">Número</label>
            <input
              type="text"
              id="number"
              name="number"
              value={address.number}
              onChange={handleFieldChange}
              placeholder="Nº"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="complement">Complemento</label>
            <input
              type="text"
              id="complement"
              name="complement"
              value={address.complement}
              onChange={handleFieldChange}
              placeholder="Apto, Bloco, etc."
              disabled={disabled}
            />
          </div>

          <div className="form-group">
            <label htmlFor="neighborhood">Bairro</label>
            <input
              type="text"
              id="neighborhood"
              name="neighborhood"
              value={address.neighborhood}
              onChange={handleFieldChange}
              placeholder="Bairro"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group city-group">
            <label htmlFor="city">
              Cidade {required && <span className="required">*</span>}
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={address.city}
              onChange={handleFieldChange}
              placeholder="Cidade"
              disabled={disabled}
              className={errors.city ? 'error' : ''}
            />
            {errors.city && <span className="error-message">{errors.city}</span>}
          </div>

          <div className="form-group state-group">
            <label htmlFor="state">
              Estado {required && <span className="required">*</span>}
            </label>
            <select
              id="state"
              name="state"
              value={address.state}
              onChange={handleFieldChange}
              disabled={disabled}
              className={errors.state ? 'error' : ''}
            >
              <option value="">Selecione</option>
              {BRAZILIAN_STATES.map(state => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
            {errors.state && <span className="error-message">{errors.state}</span>}
          </div>
        </div>

        {/* Show coordinates if available */}
        {address.latitude && address.longitude && (
          <div className="coordinates-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>Localização confirmada no mapa</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .address-selector {
          width: 100%;
        }

        .selection-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f5f5f5;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          transition: all 0.2s;
        }

        .tab:hover:not(:disabled) {
          background: #e8e8e8;
        }

        .tab.active {
          background: #e8f5e9;
          border-color: #4CAF50;
          color: #2e7d32;
        }

        .tab:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .map-section {
          margin-bottom: 16px;
        }

        .map-hint {
          margin-top: 8px;
          font-size: 13px;
          color: #666;
          text-align: center;
        }

        .address-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .address-form.collapsed {
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
        }

        .form-row {
          display: flex;
          gap: 12px;
        }

        .form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cep-group {
          max-width: 150px;
        }

        .number-group {
          max-width: 100px;
        }

        .state-group {
          max-width: 180px;
        }

        label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .required {
          color: #e53935;
        }

        .input-with-loader {
          position: relative;
        }

        input, select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #4CAF50;
        }

        input.error, select.error {
          border-color: #e53935;
        }

        input:disabled, select:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .input-loader {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }

        .error-message {
          font-size: 12px;
          color: #e53935;
        }

        .coordinates-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #e8f5e9;
          border-radius: 8px;
          font-size: 13px;
          color: #2e7d32;
        }

        @media (max-width: 600px) {
          .form-row {
            flex-direction: column;
          }

          .cep-group,
          .number-group,
          .state-group {
            max-width: none;
          }

          .selection-tabs {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
