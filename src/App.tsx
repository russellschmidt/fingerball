import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth'
import Login from './components/Login'
import ClaimName from './components/ClaimName'
import Feed from './components/Feed'
import AddPerson from './components/AddPerson'
import PersonDetail from './components/PersonDetail'
import FingerBall from './components/FingerBall'

export default function App() {
  const { loading, session, member } = useAuth()

  if (loading)
    return (
      <div className="screen center">
        <FingerBall size={120} />
      </div>
    )
  if (!session) return <Login />
  if (!member) return <ClaimName />

  return (
    <Routes>
      <Route path="/" element={<Feed />} />
      <Route path="/add" element={<AddPerson />} />
      <Route path="/person/:id" element={<PersonDetail />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
