import { createContext, useContext, useEffect, useState } from 'react';

import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(data) {
    const currentUser = await api.login(data);

    setUser(currentUser);

    return currentUser;
  }

  async function register(data) {
    const currentUser = await api.register(data);

    setUser(currentUser);

    return currentUser;
  }

  async function logout() {
    await api.logout();

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}