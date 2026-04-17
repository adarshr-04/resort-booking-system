import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AccommodationsPage from './pages/AccommodationsPage'
import AboutPage from './pages/AboutPage'
import DiningPage from './pages/DiningPage'
import ExperiencesPage from './pages/ExperiencesPage'
import ContactPage from './pages/ContactPage'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminBookings from './pages/AdminBookings'
import AdminRooms from './pages/AdminRooms'
import AdminGuests from './pages/AdminGuests'
import AdminRevenue from './pages/AdminRevenue'
import AdminSettings from './pages/AdminSettings'
import AdminServices from './pages/AdminServices'
import AdminActionPage from './pages/AdminActionPage'
import RoomServicePortal from './pages/RoomServicePortal'
import { AdminRoute } from './components/auth/AdminRoute'
import { FloatingActions } from './components/layout/FloatingActions'
import { ChatbotWidget } from './components/layout/ChatbotWidget'
import { Navigate } from 'react-router-dom'

import { api } from './lib/api'
import { useState, useEffect } from 'react'

function TokenAuthHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('login_token')
    if (token) {
      api.tokenLogin(token)
        .then(res => {
          localStorage.setItem('access_token', res.access)
          localStorage.setItem('refresh_token', res.refresh)
          // Clean the URL
          const url = new URL(window.location.href)
          url.searchParams.delete('login_token')
          window.history.replaceState({}, '', url.pathname + url.search)
          // Trigger a re-render or notification if needed
          window.location.reload() 
        })
        .catch(err => {
          console.error('One-Click login failed:', err)
        })
    }
  }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <TokenAuthHandler />
      <FloatingActions />
      <ChatbotWidget />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/accommodations" element={<AccommodationsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/dining" element={<DiningPage />} />
        <Route path="/experiences" element={<ExperiencesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/room-service/:roomId" element={<RoomServicePortal />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
        <Route path="/admin/rooms" element={<AdminRoute><AdminRooms /></AdminRoute>} />
        <Route path="/admin/guests" element={<AdminRoute><AdminGuests /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminRevenue /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/admin/services" element={<AdminRoute><AdminServices /></AdminRoute>} />
        <Route path="/admin/action" element={<AdminActionPage />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
