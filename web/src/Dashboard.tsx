import { useState, useEffect } from "react";
import { useCookie } from "react-use";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const [token, updateCookie, deleteCookie] = useCookie("_refly_ai_sid");

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/v1/auth/getUserInfo",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // Include the JWT token in the Authorization header
            },
          }
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, [token]);

  return (
    <>
      <h1>Dashboard</h1>

      {token ? (
        <>
          <div>
            <img src={data.avatar} alt="Avatar" />
          </div>
          <p>
            你好 {data.name} ({data.email}){}
          </p>
          <button onClick={() => deleteCookie()}>退出登录</button>
        </>
      ) : (
        <button onClick={() => navigate("/login")}>去登录</button>
      )}
      <button onClick={() => navigate("/")}>回主页</button>
    </>
  );
}

export default Dashboard;
