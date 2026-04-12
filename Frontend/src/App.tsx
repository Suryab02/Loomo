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
import { DashboardSkeleton } from './components/PageSkeleton'
import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { apiSlice } from './store/apiSlice'

import { Toaster } from 'sonner'

function PrivateRoute({ children }: { children: ReactNode }) {
  const token = getToken()
  const { isLoading, isError } = useGetMeQuery(undefined, { skip: !token })

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (isError) {
    clearSession()
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const handleJobSaved = () => {
      dispatch(apiSlice.util.invalidateTags(['Jobs', 'Stats', 'Keywords', 'Platforms'] as any))
    }
    window.addEventListener('loomo-job-saved', handleJobSaved)
    return () => window.removeEventListener('loomo-job-saved', handleJobSaved)
  }, [dispatch])

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
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
