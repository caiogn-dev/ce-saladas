import React from 'react';
import { useAuth } from '../context/AuthContext';
import WhatsAppOTPModal from './WhatsAppOTPModal';

const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { fetchProfile } = useAuth();

  const handleSuccess = async () => {
    await fetchProfile({ force: true });
    onSuccess?.();
    onClose();
  };

  return (
    <WhatsAppOTPModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={handleSuccess}
      title="Entrar com WhatsApp"
      subtitle="Entre para salvar favoritos e acompanhar seus pedidos."
    />
  );
};

export default LoginModal;
