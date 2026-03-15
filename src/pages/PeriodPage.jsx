import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";
import "../styles/period.css";

import logo from "../assets/Photo-1.jpeg";

import { db } from "../services/firebase";
import { ref, push, onValue } from "firebase/database";

import { useNavigate } from "react-router-dom";

const PeriodPage = () => {
  const navigate = useNavigate();

  const [periods, setPeriods] = useState([]);
  const [date, setDate] = useState("");

  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("current");

  const currentYear = new Date().getFullYear();

  const startYear = 2024;

  const years = [];

  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }

  /* LOAD DATA */

  useEffect(() => {
    const periodRef = ref(db, "periodTracker");

    onValue(periodRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        /* SORT BY DATE */

        list.sort((a, b) => new Date(a.date) - new Date(b.date));

        setPeriods(list);
      } else {
        setPeriods([]);
      }
    });
  }, []);

  /* ADD DATE */

  const addDate = () => {
    if (!date) {
      alert("Select date");

      return;
    }

    push(ref(db, "periodTracker"), {
      date,
    });

    setDate("");
  };

  /* GAP */

  const calculateGap = (current, previous) => {
    if (!previous) return "-";

    const d1 = new Date(current);
    const d2 = new Date(previous);

    return Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
  };

  /* STATUS */

  const getStatus = (gap) => {
    if (gap === "-") return { text: "First Entry", color: "secondary" };

    if (gap >= 27 && gap <= 31) return { text: "On Time", color: "success" };

    if (gap < 27) return { text: "Early", color: "primary" };

    return { text: "Late", color: "danger" };
  };

  /* FILTER */

  const filteredPeriods = periods.filter((p) => {
    const dateObj = new Date(p.date);

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;

    if (yearFilter !== "full") {
      if (yearFilter === "current" && year !== currentYear) return false;

      if (yearFilter !== "current" && year !== Number(yearFilter)) return false;
    }

    if (monthFilter !== "all" && month !== Number(monthFilter)) return false;

    return true;
  });

  return (
    <div className="dashboard-wrapper">
      {/* HEADER */}

      <div className="container header">
        <div className="header-content">
          <div className="header-left">
            <img src={logo} className="logo-img" alt="logo" />

            <h3 className="app-title">Period Tracker</h3>
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

      <div className="container period-body">
        <h3 className="text-center mb-4">Period Cycle Details</h3>

        {/* ADD DATE */}

        <div className="row g-3 mb-4">
          <div className="col-md-6 col-12">
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="col-md-6 col-12">
            <button className="btn btn-danger w-100" onClick={addDate}>
              Add Period Date
            </button>
          </div>
        </div>

        {/* FILTERS */}

        <div className="row g-3 mb-4">
          <div className="col-md-4 col-12">
            <select
              className="form-select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="all">All Months</option>

              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4 col-12">
            <select
              className="form-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="current">Current Year ({currentYear})</option>

              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}

              <option value="full">Full Data</option>
            </select>
          </div>
        </div>

        {/* TABLE */}

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Month</th>
                <th>Period Date</th>
                <th>Gap</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredPeriods.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">
                    No Data Found
                  </td>
                </tr>
              ) : (
                filteredPeriods.map((p) => {
                  /* find previous entry from full dataset */

                  const currentIndex = periods.findIndex(
                    (item) => item.id === p.id,
                  );

                  const previous = periods[currentIndex - 1]?.date;

                  const gap = calculateGap(p.date, previous);

                  const status = getStatus(gap);

                  const isFirstOfYear = new Date(p.date).getMonth() === 0;

                  return (
                    <tr key={p.id}>
                      <td>
                        {new Date(p.date).toLocaleString("default", {
                          month: "long",
                        })}
                      </td>

                      <td>{p.date}</td>

                      <td>{gap === "-" ? "-" : `${gap} days`}</td>

                      <td>
                        {isFirstOfYear && (
                          <span className="badge bg-secondary me-2">
                            First Entry
                          </span>
                        )}

                        <span className={`badge bg-${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}

      <footer className="footer">Copyright © 2026 LLC Gourab</footer>
    </div>
  );
};

export default PeriodPage;
