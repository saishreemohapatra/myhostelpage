import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import "./styles/login.css";
import EmiPage from "./pages/EmiPage";
import Borrowers from "./pages/Borrowers";
import DailyExpenditure from "./pages/DailyExpenditure";
import Maintenance from "./pages/Maintenance";
import RoomRent from "./pages/RoomRent";
import Food from "./pages/Food";
import PeriodPage from "./pages/PeriodPage";
import LoveFormPage from "./pages/LoveFormPage";
import LoveAdminPage from "./pages/LoveAdminPage";
// import PaperAssignment from "./pages/PaperAssignment";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/borrowers" element={<Borrowers />} />
        <Route path="/emi/:id" element={<EmiPage />} />
        <Route path="/daily-expenditure" element={<DailyExpenditure />} />
        <Route path="/room-rent" element={<RoomRent />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/food" element={<Food />} />
        <Route path="/period" element={<PeriodPage />} />
        <Route path="/love-form" element={<LoveFormPage />} />
        <Route path="/love-admin" element={<LoveAdminPage />} />
        {/* <Route path="/paper-assignment" element={<PaperAssignment />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
