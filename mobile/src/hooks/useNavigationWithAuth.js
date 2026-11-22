import { useEffect } from 'react';
import { useSession } from '../context/SessionContext.js';
import { registrarSesionExpirada } from '../api/client.js';

function useNavigationWithAuth() {
  const { cerrarSesionConAviso } = useSession();

  useEffect(() => {
    registrarSesionExpirada(cerrarSesionConAviso);
  }, [cerrarSesionConAviso]);
}

export default useNavigationWithAuth;
