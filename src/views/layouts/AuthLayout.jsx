import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'

function AuthLayout() {
  const context = useAuthContext()

  if (!context.token) {
    return <Navigate to='/login' />
  }

  return (<>
    <Outlet />
  </>)
}

export default AuthLayout
