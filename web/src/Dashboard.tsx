import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
    const navigate = useNavigate();


    return (
        <>
            <div>Dashboard</div>
            <button onClick={() => navigate('/')}>回主页</button>
            <button onClick={() => navigate('/login')}>去登录</button>
        </>
    )
}

export default Dashboard
