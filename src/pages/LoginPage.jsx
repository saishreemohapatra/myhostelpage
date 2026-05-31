import React, { useState } from "react";
import "../styles/login.css";

import logo from "../assets/Photo-1.jpeg";
import photo1 from "../assets/Photo-1.jpeg";
import photo2 from "../assets/Photo-2.jpeg";
import photo3 from "../assets/Photo-3.jpeg";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import LoveAdminLoginScreen from "../components/LoveAdminLoginScreen";
import { setAdminLoggedIn } from "../services/loveAdminAuth";

const LOGIN_MODES = {
  MESS: "mess",
  ADMIN: "admin",
};

const LoginPage = () => {
  const [mode, setMode] = useState(LOGIN_MODES.MESS);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleMessLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAdminLogin = () => {
    setAdminLoggedIn(true);
    navigate("/love-admin");
  };

  return (
    <div className="login-wrapper">
      <div className="container header">
        <div className="header-content">
          <img src={logo} className="logo-img" alt="logo" />
          <h2 className="app-title">Saishree Mess Expenditure</h2>
        </div>
      </div>

      <div className="container body-section">
        <div className="row justify-content-center align-items-center g-5">
          <div className="col-lg-7 col-md-12">
            <div className="photo-card">
              <div className="slider-track">
                <img src={photo1} alt="img" />
                <img src={photo2} alt="img" />
                <img src={photo3} alt="img" />
                <img src={photo1} alt="img" />
                <img src={photo2} alt="img" />
                <img src={photo3} alt="img" />
              </div>
            </div>
          </div>

          <div className="col-lg-5 col-md-12">
            <div className="login-mode-tabs" role="tablist" aria-label="Login type">
              <button
                type="button"
                role="tab"
                aria-selected={mode === LOGIN_MODES.MESS}
                className={`login-mode-tab${
                  mode === LOGIN_MODES.MESS ? " login-mode-tab--active" : ""
                }`}
                onClick={() => setMode(LOGIN_MODES.MESS)}
              >
                Mess login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === LOGIN_MODES.ADMIN}
                className={`login-mode-tab${
                  mode === LOGIN_MODES.ADMIN ? " login-mode-tab--active" : ""
                }`}
                onClick={() => setMode(LOGIN_MODES.ADMIN)}
              >
                Admin login
              </button>
            </div>

            {mode === LOGIN_MODES.MESS ? (
              <div className="login-card">
                <h4 className="text-center mb-4">Login Here</h4>

                <input
                  type="email"
                  className="form-control mb-3"
                  placeholder="Email ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div className="input-group mb-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <span
                    className="input-group-text"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <i className="bi bi-eye-slash"></i>
                    ) : (
                      <i className="bi bi-eye"></i>
                    )}
                  </span>
                </div>

                <button
                  className="btn btn-primary w-100"
                  onClick={handleMessLogin}
                >
                  Login
                </button>
              </div>
            ) : (
              <div className="login-admin-panel">
                <LoveAdminLoginScreen
                  embedded
                  onLogin={handleAdminLogin}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">Copyright © 2026 LLC Gourab</footer>
    </div>
  );
};

export default LoginPage;
