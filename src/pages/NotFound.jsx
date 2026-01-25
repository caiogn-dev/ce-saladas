import React from 'react';
import Link from 'next/link';

const NotFound = () => {
  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-number">404</div>

        <h1 className="status-title">Página não encontrada</h1>
        <p className="status-subtitle">
          A página que você está procurando não existe ou foi movida.
        </p>

        <div className="status-actions">
          <Link href="/" className="status-button status-button-primary">
            Voltar ao início
          </Link>
          <Link href="/cardapio" className="status-button status-button-secondary">
            Ver cardápio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
