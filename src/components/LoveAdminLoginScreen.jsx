import React, { useState } from "react";
import { validateAdminCredentials } from "../services/loveAdminAuth";
import "../styles/loveadmin.css";

/**
 * Shared Love Form admin login UI (used on / and /love-admin).
 */
const LoveAdminLoginScreen = ({ onLogin, embedded = false }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAdminCredentials(username, password)) {
      onLogin();
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div
      className={`la-login-bg${embedded ? " la-login-bg--embedded" : ""}`}
    >
      {!embedded && (
        <div className="la-floating-bg" aria-hidden="true">
          {["❤️", "💖", "🔐", "💌", "✨", "🌹"].map((h, i) => (
            <span
              key={i}
              className="la-float-item"
              style={{ "--delay": `${i * 1.5}s`, "--pos": `${10 + i * 15}%` }}
            >
              {h}
            </span>
          ))}
        </div>
      )}

      <div className="la-login-card">
        <div className="la-login-icon">🔐</div>
        <h1 className="la-login-title">Admin Panel</h1>
        <p className="la-login-sub">Saishree Love Form — Private Access</p>

        <form className="la-login-form" onSubmit={handleSubmit}>
          <div className="la-field-group">
            <label className="la-label">Username</label>
            <input
              className="la-input"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              autoComplete="username"
            />
          </div>
          <div className="la-field-group">
            <label className="la-label">Password</label>
            <div className="la-pass-wrap">
              <input
                className="la-input"
                type={showPass ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="la-show-pass"
                onClick={() => setShowPass((p) => !p)}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          {error && <div className="la-login-error">⚠️ {error}</div>}
          <button type="submit" className="la-btn-login">
            Login →
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoveAdminLoginScreen;
