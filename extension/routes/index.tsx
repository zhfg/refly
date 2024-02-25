import { Route, Routes } from 'react-router-dom'

import { Home } from './home';
import { Thread } from './thread'

export const Routing = () => (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/thread/:threadId" element={<Thread />} />
    </Routes>
)