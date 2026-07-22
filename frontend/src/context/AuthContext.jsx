import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import * as api from "../services/api";
import { tokenStorage } from "../services/api";

const AuthContext = createContext(null);

function decodeUserFromToken(token) {
  try {
    const payload = jwtDecode(token);
    return {
      id: payload.user_id,
      username: payload.username || null,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, restore the session from a stored (still-valid) access token.
  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (token) {
      const decoded = decodeUserFromToken(token);
      const isExpired = decoded ? decoded.exp * 1000 < Date.now() : true;
      if (decoded && !isExpired) {
        setUser(decoded);
      } else {
        tokenStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await api.login(username, password);
    tokenStorage.setTokens(data.access, data.refresh);
    setUser(decodeUserFromToken(data.access) || { username });
    return data;
  };

  const logout = async () => {
    const refresh = tokenStorage.getRefresh();
    try {
      if (refresh) await api.logout(refresh);
    } catch {
      // Even if the blacklist call fails (e.g. network issue), still clear
      // local state so the user is logged out client-side.
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}