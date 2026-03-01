import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({
            email: payload.sub,
            role: payload.role,
            name: localStorage.getItem('name') || '',
          });
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('name');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('name');
      }
    }
    setLoading(false);
  }, []);

  // ✅ Accept name + role from login response
  const login = (token, name, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('name', name);
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser({
      email: payload.sub,
      role: role || payload.role,
      name: name || '',
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
