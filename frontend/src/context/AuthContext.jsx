import { useState, useContext, useEffect, useRef, createContext } from "react";
import API from "../API/API";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

const AuthContext = createContext();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside the AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [userID, setUserID] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isFetchingAuth, setFetchingAuth] = useState(true);

  const timeOutRef = useRef(null);
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const id = localStorage.getItem("userID");
    const info = localStorage.getItem("userInfo");

    if (token) setAccessToken(token); 
    if (id) setUserID(id);
    if (info) setUserInfo(JSON.parse(info));

    setFetchingAuth(false);
  }, []);

  useEffect(() => {
    if (accessToken && userID && userInfo) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userID", userID);
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      const { exp } = jwtDecode(accessToken);
      const remainingTime = exp * 1000 - Date.now();
      if (remainingTime <= 0) {
        logout();
        return;
      }

      timeOutRef.current = setTimeout(() => {
        toast.warning("Your session has expired!");
        logout();
      }, remainingTime);
    }

    if (!accessToken || !userID || !userInfo) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userID");
      localStorage.removeItem("userInfo");
    }
    console.log(`Current user id is: ${userID ? userID : "Not found"}`);
    console.log(`Current access token is: ${accessToken ? accessToken : "Not found"}`);

    return () => {
      if (timeOutRef.current) {
        clearTimeout(timeOutRef.current);
        timeOutRef.current = null;
      }
    };
  }, [userID, accessToken, userInfo]);

  async function login(username, password) {
    if (!username.trim()) {
      toast.warning("Vui lòng nhập tài khoản");
      return;
    }
    if (!password.trim()) {
      toast.warning("Vui lòng nhập mật khẩu");
      return;
    }

    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: username.trim(),
        password: password,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 403) 
        throw new Error(body.message || "Tài khoản của bạn đã bị khóa.");
  
      throw new Error(body.message || "Đăng nhập thất bại");
    }

    const { token } = body.data;
    const userId = body.data.user._id;
    const userInfo = body.data.user;

    console.log(userInfo);

    if (!token || !userId)
      throw new Error("Server trả thiếu thông tin người dùng");

    setUserID(userId);
    setAccessToken(token);
    setUserInfo(userInfo);
  }

  function logout() {
    setUserID(null);
    setAccessToken(null);
    setUserInfo(null);
    if (timeOutRef.current) {
      clearTimeout(timeOutRef.current);
      timeOutRef.current = null;
    }

    toast.success("Đăng xuất thành công");
  }

  return (
    <AuthContext.Provider
      value={{ userID, accessToken, login, logout, userInfo, isFetchingAuth}}
    >
      {children}
    </AuthContext.Provider>
  );
}
