import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";
import "../styles/emi.css";

import logo from "../assets/Photo-1.jpeg";

import { useNavigate, useParams } from "react-router-dom";

import { db } from "../services/firebase";
import { ref, push, onValue } from "firebase/database";

const EmiPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // borrower id

  const [payments, setPayments] = useState([]);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");

  const totalAmount = 18500;

  /* LOAD PAYMENTS FOR THIS BORROWER */

  useEffect(() => {
    const paymentsRef = ref(db, `borrowPayments/${id}`);

    onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        setPayments(list);
      } else {
        setPayments([]);
      }
    });
  }, [id]);

  /* ADD PAYMENT */

  const addPayment = () => {
    if (!amount || !date || !status) {
      alert("Please fill all fields");

      return;
    }

    push(ref(db, `borrowPayments/${id}`), {
      amount: Number(amount),
      date,
      status,
    });

    setAmount("");
    setDate("");
    setStatus("");
  };

  let remaining = totalAmount;

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

      {/* BODY */}

      <div className="container emi-body">
        <h3 className="text-center mb-4">Borrower EMI Payment</h3>

        <div className="emi-summary">
          <h5>Total Amount : ₹ {totalAmount}</h5>
        </div>

        {/* ADD PAYMENT */}

        <div className="row g-3 mb-4">
          <div className="col-lg-3 col-md-6 col-12">
            <input
              type="number"
              placeholder="Payment Amount"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="col-lg-3 col-md-6 col-12">
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="col-lg-4 col-md-6 col-12">
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Select Payment Status</option>

              <option value="Paid - Directly Account Transfer">
                Paid - Directly Account Transfer
              </option>

              <option value="Paid - From Google Pay">
                Paid - From Google Pay
              </option>

              <option value="Paid - From Phone Pay">
                Paid - From Phone Pay
              </option>

              <option value="Other">Other</option>
            </select>
          </div>

          <div className="col-lg-2 col-md-6 col-12">
            <button className="btn btn-success w-100" onClick={addPayment}>
              Add Payment
            </button>
          </div>
        </div>

        {/* PAYMENT TABLE */}

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Sl</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Remaining</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p, index) => {
                remaining = remaining - p.amount;

                return (
                  <tr key={p.id}>
                    <td>{index + 1}</td>

                    <td>₹ {p.amount}</td>

                    <td>{p.date}</td>

                    <td>{p.status}</td>

                    <td>₹ {remaining}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}

      <footer className="footer">Copyright © 2026 LLC Gourab</footer>
    </div>
  );
};

export default EmiPage;
