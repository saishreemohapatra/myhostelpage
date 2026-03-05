import React, { useState } from "react";
import "../styles/login.css";

import logo from "../assets/Photo-1.jpeg";
import photo1 from "../assets/Photo-1.jpeg";
import photo2 from "../assets/Photo-2.jpeg";
import photo3 from "../assets/Photo-3.jpeg";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
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

  return (
    <div className="login-wrapper">
      {/* HEADER */}

      <div className="container header">
        <div className="header-content">
          <img src={logo} className="logo-img" alt="logo" />

          <h2 className="app-title">Saishree Mess Expenditure</h2>
        </div>
      </div>

      {/* BODY */}

      <div className="container body-section">
        <div className="row justify-content-center align-items-center g-5">
          {/* PHOTO SLIDER */}

          <div className="col-lg-7 col-md-12">
            <div className="photo-card">
              <div className="slider-track">
                <img src={photo1} alt="img" />
                <img src={photo2} alt="img" />
                <img src={photo3} alt="img" />

                {/* repeat images for animation */}

                <img src={photo1} alt="img" />
                <img src={photo2} alt="img" />
                <img src={photo3} alt="img" />
              </div>
            </div>
          </div>

          {/* LOGIN BOX */}

          <div className="col-lg-5 col-md-12">
            <div className="login-card">
              <h4 className="text-center mb-4">Login Here</h4>

              {/* EMAIL */}

              <input
                type="email"
                className="form-control mb-3"
                placeholder="Email ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* PASSWORD WITH SHOW / HIDE */}

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

              {/* LOGIN BUTTON */}

              <button className="btn btn-primary w-100" onClick={handleLogin}>
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}

      <footer className="footer">Copyright © 2026 LLC Gourab</footer>
    </div>
  );
};

export default LoginPage;
