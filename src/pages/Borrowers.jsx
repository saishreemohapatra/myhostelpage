import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";

import logo from "../assets/Photo-1.jpeg";

import { db } from "../services/firebase";
import { ref, push, onValue } from "firebase/database";

import { useNavigate } from "react-router-dom";

const Borrowers = () => {
  const navigate = useNavigate();

  const [borrowers, setBorrowers] = useState([]);
  const [payments, setPayments] = useState({});

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  /* LOAD BORROWERS */

  useEffect(() => {
    const borrowersRef = ref(db, "borrowers");

    onValue(borrowersRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        setBorrowers(list);
      }
    });
  }, []);

  /* LOAD PAYMENTS */

  useEffect(() => {
    const paymentsRef = ref(db, "borrowPayments");

    onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setPayments(data);
      }
    });
  }, []);

  /* ADD BORROWER */

  const addBorrower = () => {
    if (!name || !mobile || !email || !amount || !date) {
      alert("Fill all fields");

      return;
    }

    push(ref(db, "borrowers"), {
      name,
      mobile,
      email,
      totalAmount: Number(amount),
      startDate: date,
    });

    setName("");
    setMobile("");
    setEmail("");
    setAmount("");
    setDate("");
  };

  /* CALCULATE STATUS */

  const getStatus = (borrower) => {
    const borrowerPayments = payments[borrower.id] || {};

    const paidAmount = Object.values(borrowerPayments).reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    const remaining = borrower.totalAmount - paidAmount;

    const today = new Date().toISOString().split("T")[0];

    if (remaining <= 0) {
      return { text: "Closed", color: "success" };
    }

    if (paidAmount > 0) {
      return { text: "Ongoing", color: "warning" };
    }

    if (today === borrower.startDate) {
      return { text: "Started", color: "primary" };
    }

    return { text: "Pending", color: "secondary" };
  };

  return (
    <div className="dashboard-wrapper">
      <div className="container header">
        <div className="header-content">
          <div className="header-left">
            <img src={logo} className="logo-img" alt="logo" />

            <h3 className="app-title">Saishree Mess Expenditure</h3>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/borrowers")}
            >
              Home
            </button>

            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="container dashboard-body">
        <h3 className="text-center mb-2">Add Person</h3>

        <p className="text-center text-muted mb-4">
          Do you want to give money to someone?
        </p>

        {/* ADD PERSON */}

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <input
              type="text"
              placeholder="Person Name"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <input
              type="text"
              placeholder="Mobile"
              className="form-control"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <input
              type="email"
              placeholder="Email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <input
              type="number"
              placeholder="Amount"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="col-md-12">
            <button className="btn btn-success w-100" onClick={addBorrower}>
              Add Person
            </button>
          </div>
        </div>

        {/* BORROWER TABLE */}

        <div className="row text-center mb-4">
          <div className="col-md-3 col-6 mb-2">
            <div className="status-card bg-primary text-white">
              Started
              <br />
              {borrowers.filter((b) => getStatus(b).text === "Started").length}
            </div>
          </div>

          <div className="col-md-3 col-6 mb-2">
            <div className="status-card bg-warning text-dark">
              Ongoing
              <br />
              {borrowers.filter((b) => getStatus(b).text === "Ongoing").length}
            </div>
          </div>

          <div className="col-md-3 col-6 mb-2">
            <div className="status-card bg-success text-white">
              Closed
              <br />
              {borrowers.filter((b) => getStatus(b).text === "Closed").length}
            </div>
          </div>

          <div className="col-md-3 col-6 mb-2">
            <div className="status-card bg-secondary text-white">
              Pending
              <br />
              {borrowers.filter((b) => getStatus(b).text === "Pending").length}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Total Amount</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {borrowers.map((b) => {
                const borrowerPayments = payments[b.id] || {};

                const paidAmount = Object.values(borrowerPayments).reduce(
                  (sum, p) => sum + p.amount,
                  0,
                );

                const remaining = b.totalAmount - paidAmount;

                const status = getStatus(b);

                return (
                  <tr key={b.id}>
                    <td>{b.name}</td>

                    <td>{b.mobile}</td>

                    <td>{b.email}</td>

                    <td>₹ {b.totalAmount}</td>

                    <td>₹ {remaining}</td>

                    <td>
                      <span className={`badge bg-${status.color}`}>
                        {status.text}
                      </span>
                    </td>

                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/emi/${b.id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="footer">Copyright © 2026 LLC Gourab</footer>
    </div>
  );
};

export default Borrowers;
