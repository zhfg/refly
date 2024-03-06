import { useState, useEffect } from "react";
import { useCookie } from "react-use";
import { useNavigate } from "react-router-dom";

// stores
import type { User } from './types';

export const extensionId = 'fcncfleeddfdpbigljgiejfdkmpkldpe';


function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({});
    const [token, updateCookie, deleteCookie] = useCookie("_refly_ai_sid");

    const handleSendMsgToExtension = async (status: 'success' | 'failed', token?: string, user?: User) => {
        try {
            await chrome.runtime.sendMessage(extensionId, {
                name: 'login-notification',
                body: {
                    status,
                    token,
                    user
                }
            })
        } catch (err) {
            console.log('handleSendMsgToExtension err', err)
        }

        setTimeout(() => {
            window.close();
        }, 2000)
    }

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
                handleSendMsgToExtension('success', token, result);
            } catch (error) {
                console.error("Error:", error);
                handleSendMsgToExtension('failed');
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
                        你好 {data.name} ({data.email}){ }
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
