import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";
import "../styles/maintenance.css";

import logo from "../assets/Photo-1.jpeg";

import { db } from "../services/firebase";
import { ref, set, onValue } from "firebase/database";

import { useNavigate } from "react-router-dom";

const Maintenance = () => {
  const navigate = useNavigate();

  const year = new Date().getFullYear();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const [data, setData] = useState({});
  const [filter, setFilter] = useState("");

  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState(400);
  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [status, setStatus] = useState("Unpaid");

  /* LOAD DATA */

  useEffect(() => {
    const maintenanceRef = ref(db, `maintenance/${year}`);

    onValue(maintenanceRef, (snapshot) => {
      const result = snapshot.val();

      if (result) {
        setData(result);
      } else {
        setData({});
      }
    });
  }, [year]);

  /* SAVE OR UPDATE */

  const saveMaintenance = () => {
    if (!month) {
      alert("Select month");
      return;
    }

    set(ref(db, `maintenance/${year}/${month}`), {
      amount: Number(amount),
      paidAmount: Number(paidAmount),
      paidDate,
      status,
    });

    setMonth("");
    setPaidAmount("");
    setPaidDate("");
  };

  /* FILTER */

  const filteredMonths = filter ? [filter] : months;

  return (
    <div className="dashboard-wrapper">
      {/* HEADER */}

      <div className="container header">
        <div className="header-content">
          <div className="header-left">
            <img src={logo} className="logo-img" alt="logo" />

            <h3 className="app-title">Saishree Mess Expenditure</h3>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/dashboard")}
            >
              Home
            </button>

            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}

      <div className="container dashboard-body">
        {/* ADD / UPDATE CARD */}

        <div className="card shadow-sm mb-4">
          <div className="card-header bg-success text-white">
            Add / Update Maintenance
          </div>

          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  <option>Select Month</option>

                  {months.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                />
              </div>

              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Paid Amount"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <input
                  type="date"
                  className="form-control"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option>Paid</option>
                  <option>Unpaid</option>
                  <option>Processing</option>
                </select>
              </div>

              <div className="col-md-12">
                <button
                  className="btn btn-success w-100"
                  onClick={saveMaintenance}
                >
                  Save Maintenance
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MONTH FILTER */}

        <div className="mb-3">
          <select
            className="form-select"
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Months</option>

            {months.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* TABLE */}

        <div className="card shadow-sm">
          <div className="card-header">Maintenance ({year})</div>

          <div className="card-body table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Paid Amount</th>
                  <th>Paid Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredMonths.map((m) => {
                  const entry = data[m] || {};

                  return (
                    <tr key={m}>
                      <td>{m}</td>

                      <td>₹ {entry.amount || 400}</td>

                      <td>₹ {entry.paidAmount || 0}</td>

                      <td>{entry.paidDate || "-"}</td>

                      <td>
                        <span
                          className={`badge 
${
  entry.status === "Paid"
    ? "bg-success"
    : entry.status === "Processing"
      ? "bg-warning"
      : "bg-danger"
}`}
                        >
                          {entry.status || "Unpaid"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FOOTER */}

      <footer className="footer">Copyright © 2026 LLC Gourab</footer>
    </div>
  );
};

export default Maintenance;
