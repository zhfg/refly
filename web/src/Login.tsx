import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
    const navigate = useNavigate();


    return (
        <>
            <div>Dashboard</div>
            <button onClick={() => navigate('/')}>回主页</button>
            <button onClick={() => navigate('/dashboard')}>去 Dashboard</button>
        </>
    )
}

export default Login
