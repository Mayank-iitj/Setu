import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (role) => {
    if (role === 'shipper') {
      setUser({ name: 'Adani Logistics', role: 'shipper', token: 'mock-jwt-token' });
    } else {
      setUser({ name: 'Ramesh Patel', role: 'carrier', token: 'mock-jwt-token' });
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
