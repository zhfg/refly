import { Route, Routes } from 'react-router-dom'

// 自定义组件
import Home from "../components/home"
import { Thread } from '../components/thread-item/thread'
import { ThreadLibrary } from '../components/thread-library'
import { Login } from '../components/login'

export const Routing = () => (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/thread/:threadId" element={<Thread />} />
        <Route path="/thread" element={<ThreadLibrary />} />
    </Routes>
)