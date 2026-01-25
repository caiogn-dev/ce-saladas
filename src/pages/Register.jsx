import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as storeApi from '../services/storeApi';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    coupon_code: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Celular é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Celular inválido (10-11 dígitos)';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { level: 0, text: '', color: '#ccc' };

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    if (strength <= 2) return { level: strength, text: 'Fraca', color: '#dc2626' };
    if (strength <= 3) return { level: strength, text: 'Média', color: '#d97706' };
    return { level: strength, text: 'Forte', color: '#16a34a' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      await storeApi.registerUser({
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ''),
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        coupon_code: formData.coupon_code.trim(),
        store_slug: storeApi.STORE_SLUG  // Send store slug for email automation
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      if (err.response?.data) {
        const backendErrors = {};
        Object.entries(err.response.data).forEach(([key, value]) => {
          if (key === 'email' && Array.isArray(value)) {
            backendErrors.email = value[0].includes('exists')
              ? 'Este e-mail já está cadastrado'
              : value[0];
          } else if (key === 'phone' && Array.isArray(value)) {
            backendErrors.phone = value[0].includes('exists')
              ? 'Este celular já está cadastrado'
              : value[0];
          } else if (Array.isArray(value)) {
            backendErrors[key] = value[0];
          }
        });

        if (Object.keys(backendErrors).length > 0) {
          setErrors(backendErrors);
        } else {
          setErrors({ general: 'Erro ao cadastrar. Tente novamente.' });
        }
      } else {
        setErrors({ general: 'Erro ao conectar com o servidor.' });
      }
    }
    setLoading(false);
  };

  const passwordStrength = getPasswordStrength();

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card auth-success">
            <div className="auth-success-icon">OK</div>
            <h2>Conta criada!</h2>
            <p>Redirecionando para o login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Link href="/" className="auth-logo">PASTITA</Link>
            <p>Crie sua conta para fazer pedidos</p>
          </div>

          {errors.general && <div className="auth-error">{errors.general}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-grid">
              <Input
                label="Nome"
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="João"
                fullWidth
              />
              <Input
                label="Sobrenome"
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Silva"
                fullWidth
              />
            </div>

            <Input
              label="E-mail *"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="seu@email.com"
              error={errors.email}
              fullWidth
              required
            />

            <Input
              label="Celular *"
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setFormData({ ...formData, phone: formatted });
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              placeholder="(11) 99999-9999"
              error={errors.phone}
              fullWidth
              required
            />

            <div>
              <Input
                label="Senha *"
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                placeholder="Mínimo 8 caracteres"
                error={errors.password}
                fullWidth
                required
              />
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="strength-bar"
                        style={{
                          backgroundColor: i <= passwordStrength.level ? passwordStrength.color : '#e5e5e5'
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ color: passwordStrength.color }}>
                    Força: {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>

            <Input
              label="Confirmar senha *"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              placeholder="Digite a senha novamente"
              error={errors.confirmPassword}
              fullWidth
              required
            />

            <Input
              label="Cupom (opcional)"
              type="text"
              value={formData.coupon_code}
              onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })}
              placeholder="PASTITA10"
              fullWidth
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              className="auth-submit"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>


          <div className="auth-footer">
            <p>
              Já tem conta? <Link href="/login">Faça login</Link>
            </p>
          </div>
        </div>

        <Link href="/" className="auth-back">&lt; Voltar ao início</Link>
      </div>
    </div>
  );
};

export default Register;
