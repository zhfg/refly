import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { LandingPages } from './pages/landing-pages';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <LandingPages />
    </>
  );
}

export default App;
