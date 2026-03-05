import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";
import "../styles/food.css";

import logo from "../assets/Photo-1.jpeg";

import { db } from "../services/firebase";
import { ref, set, onValue, remove } from "firebase/database";

import { useNavigate } from "react-router-dom";

const Food = () => {
  const navigate = useNavigate();

  const year = new Date().getFullYear();

  const mealPrice = 30;

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

  const [meals, setMeals] = useState({});
  const [payments, setPayments] = useState({});

  const [date, setDate] = useState("");
  const [morning, setMorning] = useState(false);
  const [night, setNight] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [status, setStatus] = useState("Unpaid");

  /* LOAD DATA */

  useEffect(() => {
    onValue(ref(db, `food/${year}/meals`), (snapshot) => {
      setMeals(snapshot.val() || {});
    });

    onValue(ref(db, `food/${year}/payments`), (snapshot) => {
      setPayments(snapshot.val() || {});
    });
  }, [year]);

  /* ADD MEAL */

  const addMeal = () => {
    if (!date) {
      alert("Select date");
      return;
    }

    set(ref(db, `food/${year}/meals/${date}`), {
      morning,
      night,
    });

    setDate("");
    setMorning(false);
    setNight(false);
  };

  /* DELETE MEAL */

  const deleteMeal = (date) => {
    if (!window.confirm("Delete this meal entry?")) return;

    remove(ref(db, `food/${year}/meals/${date}`));
  };

  /* PREVIOUS MONTH */

  const getPreviousMonth = (index) => {
    return index === 0 ? 11 : index - 1;
  };

  /* MONTH TOTAL */

  const calculateMonthTotal = (monthIndex) => {
    const entries = Object.entries(meals).filter(
      ([d]) => new Date(d).getMonth() === monthIndex,
    );

    let mealCount = 0;

    entries.forEach(([_, m]) => {
      if (m.morning) mealCount++;
      if (m.night) mealCount++;
    });

    return mealCount * mealPrice;
  };

  const selectedMonthIndex = months.indexOf(selectedMonth);

  const previousMonthIndex = getPreviousMonth(selectedMonthIndex);

  const previousMonthName = months[previousMonthIndex];

  const monthTotal = calculateMonthTotal(previousMonthIndex);

  const payment = payments[selectedMonth];

  /* SAVE PAYMENT */

  const savePayment = () => {
    set(ref(db, `food/${year}/payments/${selectedMonth}`), {
      monthFor: previousMonthName,
      amount: monthTotal,
      paidAmount: Number(paidAmount),
      paidDate,
      status,
    });

    setPaidAmount("");
    setPaidDate("");
  };

  /* FILTER MEALS */

  const filteredMeals = Object.entries(meals).filter(
    ([d]) =>
      !selectedMonth || months[new Date(d).getMonth()] === previousMonthName,
  );

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
        {/* ADD MEAL */}

        <div className="card shadow-sm mb-4">
          <div className="card-header bg-success text-white">
            Add Meal Entry
          </div>

          <div className="card-body">
            <div className="add-meal-row">
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <label className="meal-check">
                <input
                  type="checkbox"
                  checked={morning}
                  onChange={() => setMorning(!morning)}
                />
                Morning
              </label>

              <label className="meal-check">
                <input
                  type="checkbox"
                  checked={night}
                  onChange={() => setNight(!night)}
                />
                Night
              </label>

              <button className="btn btn-success save-btn" onClick={addMeal}>
                Save
              </button>
            </div>
          </div>
        </div>

        {/* MONTH SELECT */}

        <div className="mb-3">
          <select
            className="form-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">Select Payment Month</option>

            {months.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* PAYMENT CARD */}

        {selectedMonth && (
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              Monthly Payment
            </div>

            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-4">
                  <h6>Month For</h6>

                  <h5>{previousMonthName}</h5>
                </div>

                <div className="col-md-4">
                  <h6>Total Amount</h6>

                  <h5>₹ {monthTotal}</h5>
                </div>

                <div className="col-md-4">
                  <h6>Status</h6>

                  <span
                    className={`badge 
${
  payment?.status === "Paid"
    ? "bg-success"
    : payment?.status === "Processing"
      ? "bg-warning"
      : "bg-danger"
}`}
                  >
                    {payment?.status || "Unpaid"}
                  </span>
                </div>
              </div>

              <hr />

              <div className="row g-2">
                <div className="col-md-4">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Paid Amount"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <input
                    type="date"
                    className="form-control"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>Paid</option>
                    <option>Processing</option>
                    <option>Unpaid</option>
                  </select>
                </div>

                <div className="col-md-12">
                  <button
                    className="btn btn-success w-100"
                    onClick={savePayment}
                  >
                    Save Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MEAL TABLE */}

        <div className="card shadow-sm">
          <div className="card-header">Meal Entries</div>

          <div className="card-body table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Morning</th>
                  <th>Night</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredMeals.map(([d, m]) => {
                  let total = 0;

                  if (m.morning) total += mealPrice;
                  if (m.night) total += mealPrice;

                  return (
                    <tr key={d}>
                      <td>{d}</td>

                      <td>{m.morning ? "✔" : "-"}</td>

                      <td>{m.night ? "✔" : "-"}</td>

                      <td>₹{total}</td>

                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteMeal(d)}
                        >
                          Delete
                        </button>
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

export default Food;
