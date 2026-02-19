import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <p>
        © {currentYear} <strong>Juan Diego Ttito Valenzuela</strong>. Todos los derechos reservados.
      </p>
      <p style={{fontSize: '11px', marginTop: '4px'}}>
        Contacto: <a href="tel:+51948225929">948 225 929</a>
      </p>
    </footer>
  );
};

export default Footer;
