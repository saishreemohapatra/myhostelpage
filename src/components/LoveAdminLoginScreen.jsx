import React, { useState } from "react";
import { validateAdminCredentials } from "../services/loveAdminAuth";
import "../styles/loveadmin.css";

/**
 * Shared Love Form admin login UI (full page on /love-admin, modal on /).
 * @param {"page"|"modal"} variant
 */
const LoveAdminLoginScreen = ({ onLogin, variant = "page" }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const isModal = variant === "modal";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAdminCredentials(username, password)) {
      onLogin();
    } else {
      setError("Invalid username or password.");
    }
  };

  const shellClass = isModal
    ? "la-login-shell la-login-shell--modal"
    : "la-login-bg";

  return (
    <div className={shellClass}>
      {!isModal && (
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

      <div
        className={`la-login-card${isModal ? " la-login-card--modal" : ""}`}
      >
        <div className="la-login-icon la-login-icon--pulse">🔐</div>
        <h1 className="la-login-title" id="admin-login-title">
          Admin Panel
        </h1>
        <p className="la-login-sub">Saishree Love Form — Private Access</p>

        <form className="la-login-form" onSubmit={handleSubmit}>
          <div className="la-field-group la-field-group--animate">
            <label className="la-label" htmlFor="admin-username">
              Username
            </label>
            <input
              id="admin-username"
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
          <div className="la-field-group la-field-group--animate">
            <label className="la-label" htmlFor="admin-password">
              Password
            </label>
            <div className="la-pass-wrap">
              <input
                id="admin-password"
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
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          {error && (
            <div className="la-login-error la-login-error--shake">{error}</div>
          )}
          <button type="submit" className="la-btn-login la-btn-login--shine">
            Login →
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoveAdminLoginScreen;
