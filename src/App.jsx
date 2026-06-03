import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Inscription from './pages/Inscription'
import Carte from './pages/Carte'
import CarteHome from './pages/CarteHome'
import Stats from './pages/Stats'

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/inscription/:commercantId" element={<Inscription />} />
        <Route path="/carte/:id" element={<Carte />} />
        <Route path="/carte-home" element={<CarteHome />} />
        <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
