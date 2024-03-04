import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  return (
    <>
      <h1>Login</h1>
      <button onClick={() => navigate("/")}>回主页</button>
      <button onClick={() => open("http://localhost:3000/v1/auth/google")}>
        Google 登录
      </button>
    </>
  );
}

export default Login;
