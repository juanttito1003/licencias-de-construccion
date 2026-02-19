import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import VerificarEmail from './pages/VerificarEmail';
import Dashboard from './pages/Dashboard';
import NuevoExpediente from './pages/NuevoExpediente';
import ListaExpedientes from './pages/ListaExpedientes';
import DetalleExpediente from './pages/DetalleExpediente';
import Inspecciones from './pages/Inspecciones';
import Reportes from './pages/Reportes';
import CambiarContrasena from './pages/CambiarContrasena';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// Componente de ruta protegida
const PrivateRoute = ({ children }) => {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" />;
};

// Componente interno que maneja la UI
const AppContent = () => {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Cargando...
      </div>
    );
  }

  return (
    <>
      {usuario && <Navbar />}
      <div className="page-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/verificar-email/:token" element={<VerificarEmail />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/nuevo-expediente"
                  element={
                    <PrivateRoute>
                      <NuevoExpediente />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/expedientes"
                  element={
                    <PrivateRoute>
                      <ListaExpedientes />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/expediente/:id"
                  element={
                    <PrivateRoute>
                      <DetalleExpediente />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/cambiar-contrasena"
                  element={
                    <PrivateRoute>
                      <CambiarContrasena />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/inspecciones"
                  element={
                    <PrivateRoute>
                      <Inspecciones />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reportes"
                  element={
                    <PrivateRoute>
                      <Reportes />
                    </PrivateRoute>
                  }
                />
              </Routes>
      </div>
      <Footer />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
