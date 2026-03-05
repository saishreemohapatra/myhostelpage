import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";
import "../styles/expenditure.css";

import logo from "../assets/Photo-1.jpeg";

import { db } from "../services/firebase";
import { ref, push, onValue, update, remove } from "firebase/database";

import { useNavigate } from "react-router-dom";

const DailyExpenditure = () => {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const [editData, setEditData] = useState(null);

  /* LOAD DATA FROM DATABASE */

  useEffect(() => {
    const expenseRef = ref(db, "dailyExpenses");

    const unsubscribe = onValue(expenseRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        setExpenses(list);
      } else {
        setExpenses([]);
      }
    });

    return () => unsubscribe();
  }, []);

  /* ADD EXPENSE */

  const addExpense = () => {
    if (!name || !amount || !date) {
      alert("Fill all fields");

      return;
    }

    push(ref(db, "dailyExpenses"), {
      name,
      amount: Number(amount),
      date,
    });

    setName("");
    setAmount("");
    setDate("");
  };

  /* OPEN EDIT */

  const openEdit = (expense) => {
    setEditData({ ...expense });
  };

  /* UPDATE EXPENSE */

  const updateExpense = () => {
    update(ref(db, `dailyExpenses/${editData.id}`), {
      name: editData.name,
      amount: Number(editData.amount),
    });

    setEditData(null);
  };

  /* DELETE EXPENSE */

  const deleteExpense = (id) => {
    if (window.confirm("Delete this expense?")) {
      remove(ref(db, `dailyExpenses/${id}`));
    }
  };

  /* CALCULATIONS */

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const currentMonth = new Date().getMonth();

  const monthTotal = expenses
    .filter((e) => new Date(e.date).getMonth() === currentMonth)
    .reduce((sum, e) => sum + e.amount, 0);

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
        {/* ADD EXPENSE CARD */}

        <div className="card shadow-sm mb-4">
          <div className="card-header bg-success text-white">
            Add Expenditure
          </div>

          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-4">
                <input
                  type="text"
                  placeholder="Expenditure Name"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <input
                  type="number"
                  placeholder="Amount"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <button className="btn btn-success w-100" onClick={addExpense}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STATUS CARDS */}

        <div className="row mb-4 text-center">
          <div className="col-md-6 col-6 mb-2">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6>This Month</h6>

                <h4>₹ {monthTotal}</h4>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-6 mb-2">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6>Total Expenditure</h6>

                <h4>₹ {totalAmount}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* EXPENSE TABLE */}

        <div className="card shadow-sm">
          <div className="card-header">Monthly Expenditure</div>

          <div className="card-body table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>{e.name}</td>

                    <td>₹ {e.amount}</td>

                    <td>{e.date}</td>

                    <td className="d-flex gap-2">
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => openEdit(e)}
                      >
                        ✏️
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteExpense(e.id)}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT POPUP MODAL */}

      {editData && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h5 className="mb-3">Edit Expenditure</h5>

            <input
              className="form-control mb-2"
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
            />

            <input
              type="number"
              className="form-control mb-3"
              value={editData.amount}
              onChange={(e) =>
                setEditData({ ...editData, amount: e.target.value })
              }
            />

            <div className="d-flex gap-2">
              <button className="btn btn-success w-100" onClick={updateExpense}>
                Update
              </button>

              <button
                className="btn btn-secondary w-100"
                onClick={() => setEditData(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}

      <footer className="footer">Copyright © 2026 LLC Gourab</footer>
    </div>
  );
};

export default DailyExpenditure;
