import { useState } from 'react'
import './App.css'
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();


  return (
    <>
      <button onClick={() => {
        console.log('Google 登录')
        navigate('/login')
      }}>Google 登录</button>
      <button onClick={() => navigate('/dashboard')}>去 Dashboard</button>
    </>
  )
}

export default App
