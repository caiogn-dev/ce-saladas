import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn(formData.username, formData.password);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.error || 'Usuário ou senha inválidos');
    }

    setLoading(false);
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="login-modal-overlay" onClick={handleOverlayClick}>
      <div className="login-modal">
        <button className="login-modal-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <div className="login-modal-header">
          <h2>Faça login</h2>
          <p>Entre para salvar favoritos e acompanhar seus pedidos.</p>
        </div>

        {error && <div className="login-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-modal-form">
          <div className="login-modal-field">
            <label>E-mail ou celular</label>
            <input
              type="text"
              value={formData.username}
              onChange={(event) => setFormData({ ...formData, username: event.target.value })}
              placeholder="Seu e-mail ou celular"
              required
              autoFocus
            />
          </div>

          <div className="login-modal-field">
            <label>Senha</label>
            <input
              type="password"
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
              placeholder="Sua senha"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary login-modal-submit"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-modal-footer">
          <p>
            Não tem conta?{' '}
            <Link href="/registro" onClick={onClose}>Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
