import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHome, FaFileAlt, FaClipboardList, FaChartBar, FaSignOutAlt, FaBars, FaTimes, FaMoon, FaSun, FaKey, FaBell } from 'react-icons/fa';
import Notificaciones from './Notificaciones';
import api from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const [temaOscuro, setTemaOscuro] = React.useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [mostrarNotificaciones, setMostrarNotificaciones] = React.useState(false);
  const [contadorNotificaciones, setContadorNotificaciones] = React.useState(0);

  React.useEffect(() => {
    if (temaOscuro) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [temaOscuro]);

  // Cargar contador de notificaciones
  React.useEffect(() => {
    const cargarContador = async () => {
      try {
        const response = await api.get('/notificaciones/no-leidas/contador');
        setContadorNotificaciones(response.data.contador);
      } catch (error) {
        console.error('Error al cargar contador:', error);
      }
    };

    if (usuario) {
      cargarContador();
      // Actualizar cada 30 segundos
      const interval = setInterval(cargarContador, 30000);
      return () => clearInterval(interval);
    }
  }, [usuario]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  const toggleTema = () => {
    setTemaOscuro(!temaOscuro);
  };

  const toggleNotificaciones = () => {
    setMostrarNotificaciones(!mostrarNotificaciones);
  };

  const handleCountUpdate = (nuevoContador) => {
    setContadorNotificaciones(nuevoContador);
  };

  if (!usuario) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={cerrarMenu}>
          <FaHome />
          <span>Licencias de Construcción</span>
        </Link>

        <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          {menuAbierto ? <FaTimes /> : <FaBars />}
        </button>

        <ul className={`navbar-menu ${menuAbierto ? 'active' : ''}`}>
          <li className="navbar-item">
            <Link to="/" className="navbar-link" onClick={cerrarMenu}>
              <FaHome />
              <span>Inicio</span>
            </Link>
          </li>

          {usuario.rol === 'USUARIO_EXTERNO' && (
            <li className="navbar-item">
              <Link to="/nuevo-expediente" className="navbar-link" onClick={cerrarMenu}>
                <FaFileAlt />
                <span>Nueva Solicitud</span>
              </Link>
            </li>
          )}

          <li className="navbar-item">
            <Link to="/expedientes" className="navbar-link" onClick={cerrarMenu}>
              <FaClipboardList />
              <span>Expedientes</span>
            </Link>
          </li>

          {usuario.rol === 'INSPECTOR' && (
            <li className="navbar-item">
              <Link to="/inspecciones" className="navbar-link" onClick={cerrarMenu}>
                <FaClipboardList />
                <span>Inspecciones</span>
              </Link>
            </li>
          )}

          {(usuario.rol === 'GERENTE' || usuario.rol === 'MESA_PARTES') && (
            <li className="navbar-item">
              <Link to="/reportes" className="navbar-link" onClick={cerrarMenu}>
                <FaChartBar />
                <span>Reportes</span>
              </Link>
            </li>
          )}

          <li className="navbar-item">
            <button onClick={toggleNotificaciones} className="notificaciones-toggle" aria-label="Ver notificaciones">
              <FaBell />
              {contadorNotificaciones > 0 && (
                <span className="notificaciones-badge">{contadorNotificaciones}</span>
              )}
              <span>Notificaciones</span>
            </button>
          </li>

          <li className="navbar-item">
            <button onClick={toggleTema} className="theme-toggle" aria-label="Cambiar tema">
              {temaOscuro ? <FaSun /> : <FaMoon />}
              <span>{temaOscuro ? 'Claro' : 'Oscuro'}</span>
            </button>
          </li>

          <li className="navbar-item">
            <Link to="/cambiar-contrasena" className="navbar-link" onClick={cerrarMenu}>
              <FaKey />
              <span>Cambiar Contraseña</span>
            </Link>
          </li>

          <li className="navbar-item navbar-user">
            <div className="user-info">
              <span className="user-name">{usuario.nombres} {usuario.apellidos}</span>
              <span className="user-role">{usuario.rol.replace('_', ' ')}</span>
            </div>
            <button onClick={handleLogout} className="btn-logout" aria-label="Cerrar sesión">
              <FaSignOutAlt />
              <span>Salir</span>
            </button>
          </li>
        </ul>
      </div>

      <Notificaciones 
        isOpen={mostrarNotificaciones} 
        onClose={() => setMostrarNotificaciones(false)}
        onCountUpdate={handleCountUpdate}
      />
    </nav>
  );
};

export default Navbar;
