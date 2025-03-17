import { createContext, useContext, useEffect, useState } from "react";
import { account } from "../../appwriteConfig.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUser = async () => {
    try {
      const userData = await account.get();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  const login = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      await getUser();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    await account.deleteSession("current");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
