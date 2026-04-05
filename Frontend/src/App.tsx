import { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Kanban from './pages/Kanban'
import Insights from './pages/Insights'
import Settings from './pages/Settings'
import { useGetMeQuery } from './store/apiSlice'
import { clearSession, getToken } from './lib/auth'

function PrivateRoute({ children }: { children: ReactNode }) {
  const token = getToken()
  const { isLoading, isError } = useGetMeQuery(undefined, { skip: !token })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return <div className="min-h-screen bg-white" />
  }

  if (isError) {
    clearSession()
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={
          <PrivateRoute><Onboarding /></PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/kanban" element={
          <PrivateRoute><Kanban /></PrivateRoute>
        } />
        <Route path="/insights" element={
          <PrivateRoute><Insights /></PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute><Settings /></PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
