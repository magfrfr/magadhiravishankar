// No StrictMode: the custom rAF layers (pets, fluid, scene bus) are simpler
// without dev double-mounting.
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
