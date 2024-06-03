import { Route, Routes } from 'react-router-dom';

// 页面
import KnowledgeBase from '@/pages/knowledge-base';

// 自定义组件
import { Login } from '@/pages/login';

export const Routing = () => (
  <Routes>
    <Route path="/" element={<KnowledgeBase />} />
    <Route path="/knowledge-base" element={<KnowledgeBase />} />
    <Route path="/login" element={<Login />} />
  </Routes>
);
