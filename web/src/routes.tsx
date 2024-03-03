import { Route, Routes } from 'react-router-dom'
import App from './App'
import Dashboard from './Dashboard'
import Login from './Login'


export const Routing = () => {
    return <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
    </Routes>
}