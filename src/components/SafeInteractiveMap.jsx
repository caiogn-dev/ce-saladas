'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f7f5', color: '#51614a', borderRadius: 12 }}>
      Carregando mapa...
    </div>
  ),
});

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (typeof window !== 'undefined') {
      try {
        const errors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
        errors.push({
          timestamp: new Date().toISOString(),
          message: error?.message || String(error),
          stack: error?.stack,
          context: { component: 'SafeInteractiveMap' },
        });
        sessionStorage.setItem('app_errors', JSON.stringify(errors.slice(-50)));
      } catch {
        // Ignore storage failures.
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: 220, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', padding: 20, background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74', borderRadius: 12 }}>
          <strong>O mapa não pôde ser exibido.</strong>
          <span style={{ textAlign: 'center' }}>Você ainda pode informar o endereço manualmente ou tentar novamente.</span>
          <button type="button" onClick={this.handleRetry} style={{ border: 0, borderRadius: 999, padding: '10px 16px', background: '#f97316', color: '#fff', cursor: 'pointer' }}>
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function SafeInteractiveMap(props) {
  return (
    <MapErrorBoundary>
      <InteractiveMap {...props} />
    </MapErrorBoundary>
  );
}
