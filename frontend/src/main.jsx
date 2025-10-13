import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import AppTest from './AppTest.jsx'  // Uncomment to test basic rendering

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* <AppTest /> */}
  </StrictMode>,
)
