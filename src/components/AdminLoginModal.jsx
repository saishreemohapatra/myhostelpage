import React, { useEffect, useState, useCallback } from "react";
import LoveAdminLoginScreen from "./LoveAdminLoginScreen";

const CLOSE_MS = 320;

const AdminLoginModal = ({ open, onClose, onLogin }) => {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = setTimeout(() => setMounted(false), CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!mounted) return undefined;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, handleKeyDown]);

  if (!mounted) return null;

  const handleLogin = () => {
    onLogin();
    onClose();
  };

  return (
    <div
      className={`admin-login-modal${visible ? " admin-login-modal--visible" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
    >
      <button
        type="button"
        className="admin-login-modal__backdrop"
        aria-label="Close admin login"
        onClick={onClose}
      />

      <div className="admin-login-modal__panel">
        <div className="admin-login-modal__glow" aria-hidden="true" />
        <div className="admin-login-modal__floats" aria-hidden="true">
          {["❤️", "💖", "🔐", "💌", "✨", "🌹", "💫", "🌸"].map((emoji, i) => (
            <span
              key={i}
              className="admin-login-modal__float"
              style={{
                "--delay": `${i * 0.7}s`,
                "--x": `${8 + i * 11}%`,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <button
          type="button"
          className="admin-login-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          <i className="bi bi-x-lg" />
        </button>

        <div className="admin-login-modal__content">
          <LoveAdminLoginScreen variant="modal" onLogin={handleLogin} />
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;
