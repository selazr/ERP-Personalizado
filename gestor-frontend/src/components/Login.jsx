import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/Auth.css"; // ✅ Asegúrate de que esta ruta sea correcta
import { apiUrl } from '@/utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(apiUrl('auth/login'), {
        email,
        contraseña,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('rol', res.data.rol);
      localStorage.setItem('username', res.data.nombre);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <section className="hero-panel">
          <video className="hero-video" autoPlay loop muted>
            <source src="/video.mp4" type="video/mp4" />
            Tu navegador no soporta videos HTML5.
          </video>
          <div className="hero-overlay">
            <img src="/logo.png" alt="LXH" className="hero-logo" />
            <p className="hero-kicker">LXH Operations</p>
            <h1>
              Hola, equipo LXH <span role="img" aria-label="saludo">👋</span>
            </h1>
            <p className="hero-description">
              Automatiza, coordina y gestiona tus operaciones desde un solo lugar.
              Mantén la visibilidad de tus turnos y toma decisiones en segundos.
            </p>
          </div>
        </section>

        <section className="form-panel">
          <header>
            <p className="app-name">LXH ERP</p>
            <h2>¡Bienvenido de vuelta!</h2>
            <p className="subtitle">
              Ingresa tus credenciales para continuar con la administración diaria.
            </p>
          </header>

          {error && <p className="error-message">{error}</p>}

          <form onSubmit={handleSubmit} className="login-form">
            <label className="input-label" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="nombre@lxh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              ref={emailRef}
              required
            />
            <label className="input-label" htmlFor="password">
              Contraseña
            </label>
            <div className="password-container">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="form-footer">
            <p>¿Olvidaste tu contraseña? Ponte en contacto con soporte LXH.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
