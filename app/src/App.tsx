import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Admin } from './pages/Admin'
import { AdminLogin } from './pages/AdminLogin'
import { PublicBoard } from './pages/PublicBoard'
import { AuthProvider } from './lib/auth'
import { useAuth } from './lib/auth-context'

function AdminRoute() {
  const { session, admin, loading } = useAuth()

  if (loading) return <div className="state-note" style={{ padding: 26 }}>Henter…</div>
  if (!session) return <AdminLogin />
  if (!admin) {
    return (
      <AdminLogin notice="Du er logget ind, men e-mailen står ikke på admin-listen. Tilføj den i tabellen admins i Supabase." />
    )
  }
  return <Admin />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicBoard />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
