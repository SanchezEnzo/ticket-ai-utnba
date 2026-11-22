import { createContext, useState, useContext } from 'react';
import { login as apiLogin } from '../api/auth.js';

const SessionContext = createContext(null);

function SessionProvider({ children, onLoginSuccess, onLogout }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [avisoSesion, setAvisoSesion] = useState(null);

  const login = async (email, password) => {
    try {
      const { token: newToken, usuario: newUser } = await apiLogin(email, password);
      setToken(newToken);
      setUsuario(newUser);
      setAvisoSesion(null);
      if (onLoginSuccess) {
        onLoginSuccess(newToken);
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUsuario(null);
    setToken(null);
    if (onLogout) {
      onLogout();
    }
  };

  const cerrarSesionConAviso = () => {
    setUsuario(null);
    setToken(null);
    setAvisoSesion('Tu sesión expiró. Ingresá nuevamente.');
    if (onLogout) {
      onLogout();
    }
  };

  const value = {
    usuario,
    token,
    avisoSesion,
    login,
    logout,
    setAvisoSesion,
    cerrarSesionConAviso,
    isLoggedIn: !!token,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de un SessionProvider');
  }
  return context;
}

export { SessionProvider, useSession };
