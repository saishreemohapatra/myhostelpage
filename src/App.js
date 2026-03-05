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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
