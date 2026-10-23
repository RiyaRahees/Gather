"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getApiUrl } from "@/lib/api";

const AuthContext = createContext({
  user: null,
  loading: true,
  isAdmin: false,
  adminToken: null,
  userToken: null,
  admintoken: null,
  usertoken: null,
  token: null,
  login: async () => {},
  adminLogin: async () => {},
  register: async () => {},
  googleLogin: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const headers = {};
      const savedAdminToken = typeof window !== "undefined" ? localStorage.getItem("admintoken") : null;
      const savedUserToken = typeof window !== "undefined" ? localStorage.getItem("usertoken") : null;
      const pathname = typeof window !== "undefined" ? window.location.pathname : "";

      const isAdminPortal = pathname.startsWith("/admin");

      if (isAdminPortal) {
        // Admin portal: STRICTLY pass admin token only
        if (savedAdminToken) {
          headers["x-admin-token"] = savedAdminToken;
        } else {
          setUser(null);
          setAdminToken(null);
          setLoading(false);
          return;
        }
      } else {
        // User attendee portal: STRICTLY pass user attendee token only
        // NEVER send admin token on user-facing pages
        if (savedUserToken) {
          headers["x-user-token"] = savedUserToken;
        }
      }

      const res = await fetch(getApiUrl("/api/auth/me"), {
        headers,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        const returnedUser = data.user || null;

        if (isAdminPortal) {
          // On admin portal, user MUST have role 'admin'
          if (returnedUser && returnedUser.role === "admin") {
            setUser(returnedUser);
            const aToken = data.admintoken || data.adminToken || savedAdminToken;
            setAdminToken(aToken);
            if (typeof window !== "undefined" && aToken) {
              localStorage.setItem("admintoken", aToken);
            }
          } else {
            setUser(null);
          }
        } else {
          // On user portal, administrators are strictly prohibited
          if (returnedUser && (returnedUser.role === "admin" || returnedUser.email === "admin@gmail.com")) {
            setUser(null);
          } else if (returnedUser) {
            setUser(returnedUser);
            const uToken = data.usertoken || data.userToken || savedUserToken;
            setUserToken(uToken);
            if (typeof window !== "undefined" && uToken) {
              localStorage.setItem("usertoken", uToken);
            }
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      if (pathname.startsWith("/admin")) {
        setAdminToken(localStorage.getItem("admintoken"));
      } else {
        setUserToken(localStorage.getItem("usertoken"));
      }
    }
    refreshUser();
  }, []);

  const login = async (email, password) => {
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (normalizedEmail === "admin@gmail.com") {
      throw new Error(
        "Administrator accounts cannot sign in to the user portal. Please access the system via the Admin Portal at /admin/login."
      );
    }

    const res = await fetch(getApiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned HTTP ${res.status}. Please check your backend connection.`);
    }

    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    if (data.user?.role === "admin" || data.user?.email === "admin@gmail.com") {
      throw new Error(
        "Administrator accounts cannot sign in to the user portal. Please access the system via the Admin Portal at /admin/login."
      );
    }

    const uToken = data.usertoken || data.userToken || data.token;
    if (uToken) {
      setUserToken(uToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("usertoken", uToken);
      }
    }

    setUser(data.user);
    return data;
  };

  const adminLogin = async (email, password) => {
    const res = await fetch(getApiUrl("/api/auth/admin-login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned HTTP ${res.status}. Please check your backend connection.`);
    }

    if (!res.ok) {
      throw new Error(data.error || "Administrator login failed");
    }

    const aToken = data.admintoken || data.adminToken || data.token;
    setAdminToken(aToken);
    if (typeof window !== "undefined" && aToken) {
      localStorage.setItem("admintoken", aToken);
    }

    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const res = await fetch(getApiUrl("/api/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
      credentials: "include",
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned HTTP ${res.status}. Please check your backend connection.`);
    }

    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }

    const uToken = data.usertoken || data.userToken || data.token;
    setUserToken(uToken);
    if (typeof window !== "undefined" && uToken) {
      localStorage.setItem("usertoken", uToken);
    }

    setUser(data.user);
    return data;
  };

  const googleLogin = async ({ credential, userInfo } = {}) => {
    const res = await fetch(getApiUrl("/api/auth/google"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, userInfo }),
      credentials: "include",
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned HTTP ${res.status}. Please check your backend connection.`);
    }

    if (!res.ok) {
      throw new Error(data.error || "Google authentication failed");
    }

    if (data.user?.role === "admin" || data.user?.email === "admin@gmail.com") {
      throw new Error(
        "Administrator accounts cannot sign in to the user portal. Please access the system via the Admin Portal at /admin/login."
      );
    }

    const uToken = data.usertoken || data.userToken || data.token;
    if (uToken) {
      setUserToken(uToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("usertoken", uToken);
      }
    }

    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await fetch(getApiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        if (window.location.pathname.startsWith("/admin")) {
          localStorage.removeItem("admintoken");
          setAdminToken(null);
        } else {
          localStorage.removeItem("usertoken");
          setUserToken(null);
        }
      }
      setUser(null);
    }
  };

  const isUserAdmin = user?.role === "admin" && user?.email === "admin@gmail.com";

  const activeToken = isUserAdmin ? (adminToken || userToken) : userToken;

  const value = {
    user,
    loading,
    isAdmin: Boolean(isUserAdmin),
    adminToken,
    userToken,
    admintoken: adminToken,
    usertoken: userToken,
    token: activeToken,
    login,
    adminLogin,
    register,
    googleLogin,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
