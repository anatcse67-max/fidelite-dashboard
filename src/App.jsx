import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Stats from './pages/Stats'
import Profile from './pages/Profile'
import Inscription from './pages/Inscription'
import Carte from './pages/Carte'
import CarteHome from './pages/CarteHome'
import Landing from './pages/Landing'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />
}

export default function App() {
  useEffect(() => {
    const dark = localStorage.getItem('darkMode') === 'true'
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/inscription/:commercantId" element={<Inscription />} />
        <Route path="/carte/:id" element={<Carte />} />
        <Route path="/carte-home" element={<CarteHome />} />
      </Routes>
    </BrowserRouter>
  )
}
