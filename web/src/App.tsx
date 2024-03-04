import { useState } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  return (
    <>
      <h1>Welcome to Refly AI</h1>
      <button onClick={() => navigate("/login")}>登录</button>
      <button onClick={() => navigate("/dashboard")}>去 Dashboard</button>
    </>
  );
}

export default App;
