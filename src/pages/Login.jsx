import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Login = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const returnToParam = router.query.returnTo;
  const returnTo = Array.isArray(returnToParam)
    ? returnToParam[0]
    : returnToParam || '/cardapio';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn(formData.login, formData.password);

    if (result.success) {
      router.replace(returnTo);
    } else {
      setError(result.error || 'E-mail, celular ou senha inválidos.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Link href="/" className="auth-logo">Cê Saladas</Link>
            <p>Entre apenas se quiser acompanhar seus dados com mais praticidade.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="E-mail ou celular"
              type="text"
              value={formData.login}
              onChange={(event) => setFormData({ ...formData, login: event.target.value })}
              placeholder="seu@email.com ou 11999999999"
              fullWidth
              required
            />

            <Input
              label="Senha"
              type="password"
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
              fullWidth
              required
            />

            <Button type="submit" variant="primary" fullWidth isLoading={loading} className="auth-submit">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="auth-footer">
            <p>
              Ainda não tem conta? <Link href="/registro">Criar conta</Link>
            </p>
          </div>
        </div>

        <Link href="/" className="auth-back">&lt; Voltar ao início</Link>
      </div>
    </div>
  );
};

export default Login;
