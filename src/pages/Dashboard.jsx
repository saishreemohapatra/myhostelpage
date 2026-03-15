import React from "react";
import "../styles/dashboard.css";

import logo from "../assets/Photo-1.jpeg";

import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="dashboard-wrapper">
      {/* HEADER */}
      <div className="container header">
        <div className="header-content">
          <div className="header-left">
            <img src={logo} className="logo-img" alt="logo" />

            <h3 className="app-title">Saishree Mess Expenditure</h3>
          </div>

          <button className="btn btn-danger logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="container dashboard-body">
        <div className="row g-4">
          {/* PERIOD COUNTER */}
          <div className="col-lg-4 col-md-6 col-12">
            <div className="dashboard-card">
              <h5>Period Counter</h5>
              <p className="mb-3">Track monthly period cycle</p>

              <button
                className="btn btn-danger w-100 fw-semibold"
                onClick={() => navigate("/period")}
              >
                Open
              </button>
            </div>
          </div>

          {/* FOOD */}
          <div className="col-lg-4 col-md-6 col-12">
            <div className="dashboard-card">
              <h5>Food Section</h5>
              <p>Manage daily food entries</p>
              <button
                className="btn btn-primary w-100"
                onClick={() => navigate("/food")}
              >
                Open
              </button>
            </div>
          </div>

          {/* MAINTENANCE */}
          <div className="col-lg-4 col-md-6 col-12">
            <div className="dashboard-card">
              <h5>Maintenance</h5>
              <p>Track maintenance expenses</p>
              <button
                className="btn btn-success w-100"
                onClick={() => navigate("/maintenance")}
              >
                Open
              </button>
            </div>
          </div>

          {/* ROOM RENT */}
          <div className="col-lg-4 col-md-6 col-12">
            <div className="dashboard-card">
              <h5>Room Rent</h5>
              <p>Manage room rent payments</p>
              <button
                className="btn btn-warning w-100"
                onClick={() => navigate("/room-rent")}
              >
                Open
              </button>
            </div>
          </div>

          {/* DAILY EXPENDITURE */}
          <div className="col-lg-4 col-md-6 col-12">
            <div className="dashboard-card">
              <h5>Daily Expenditure</h5>
              <p>Track daily expenses</p>
              <button
                className="btn btn-info w-100"
                onClick={() => navigate("/daily-expenditure")}
              >
                Open
              </button>
            </div>
          </div>

          {/* EMI */}
          <div className="col-lg-4 col-md-6 col-12">
            <div className="dashboard-card">
              <h5>EMI</h5>
              <p>Manage EMI payment records</p>
              <button
                className="btn btn-dark w-100"
                onClick={() => navigate("/borrowers")}
              >
                Open
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

export default Dashboard;
