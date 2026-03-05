import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";
import "../styles/roomrent.css";

import logo from "../assets/Photo-1.jpeg";

import { db } from "../services/firebase";
import { ref, push, onValue, set } from "firebase/database";

import { useNavigate } from "react-router-dom";

const RoomRent = () => {
  const navigate = useNavigate();

  const year = new Date().getFullYear();

  const totalRent = 6500;

  const [advance, setAdvance] = useState(null);

  const [payments, setPayments] = useState([]);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const [filterMonth, setFilterMonth] = useState("");

  /* LOAD DATA */

  useEffect(() => {
    const advanceRef = ref(db, `roomRent/${year}/advance`);

    onValue(advanceRef, (snapshot) => {
      setAdvance(snapshot.val());
    });

    const paymentRef = ref(db, `roomRent/${year}/payments`);

    onValue(paymentRef, (snapshot) => {
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
  }, [year]);

  /* ADD ADVANCE */

  const addAdvance = () => {
    if (!amount || !date) {
      alert("Enter advance amount and date");
      return;
    }

    set(ref(db, `roomRent/${year}/advance`), {
      amount: Number(amount),
      date,
    });

    setAmount("");
    setDate("");
  };

  /* ADD PAYMENT */

  const addPayment = () => {
    if (!amount || !date) {
      alert("Fill all fields");
      return;
    }

    push(ref(db, `roomRent/${year}/payments`), {
      amount: Number(amount),
      date,
    });

    setAmount("");
    setDate("");
  };

  /* CALCULATIONS */

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const advanceAmount = advance?.amount || 0;

  const totalPaid = paidAmount + advanceAmount;

  const remaining = totalRent - totalPaid;

  /* FILTER */

  const filteredPayments = filterMonth
    ? payments.filter(
        (p) => new Date(p.date).getMonth() + 1 === Number(filterMonth),
      )
    : payments;

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
        {/* STATUS CARDS */}

        <div className="row text-center mb-4">
          <div className="col-md-4 col-6 mb-2">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6>Total Rent</h6>

                <h4>₹6500</h4>
              </div>
            </div>
          </div>

          <div className="col-md-4 col-6 mb-2">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6>Total Paid</h6>

                <h4>₹{totalPaid}</h4>
              </div>
            </div>
          </div>

          <div className="col-md-4 col-12 mb-2">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6>Remaining</h6>

                <h4 className={remaining > 0 ? "text-danger" : "text-success"}>
                  ₹{remaining}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* ADVANCE PAYMENT */}

        {!advance && (
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              Advance Payment (Once per Year)
            </div>

            <div className="card-body">
              <div className="row g-2">
                <div className="col-md-4">
                  <input
                    type="number"
                    placeholder="Advance Amount"
                    className="form-control"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <input
                    type="date"
                    className="form-control"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <button
                    className="btn btn-primary w-100"
                    onClick={addAdvance}
                  >
                    Save Advance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMI PAYMENT */}

        <div className="card shadow-sm mb-4">
          <div className="card-header bg-success text-white">
            Add Rent Payment
          </div>

          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-4">
                <input
                  type="number"
                  placeholder="Payment Amount"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <button className="btn btn-success w-100" onClick={addPayment}>
                  Add Payment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MONTH FILTER */}

        <div className="mb-3">
          <select
            className="form-select"
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="">All Months</option>

            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>

        {/* TABLE */}

        <div className="card shadow-sm">
          <div className="card-header">Room Rent Payments ({year})</div>

          <div className="card-body table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.date}</td>
                    <td>₹ {p.amount}</td>
                  </tr>
                ))}
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

export default RoomRent;
