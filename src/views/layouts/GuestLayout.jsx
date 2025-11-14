import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'

function GuestLayout() {
  const {token} = useAuthContext()
  
    if (token) {
      return <Navigate to='/' />
    }
    return (
      <>
        <Outlet />
      </>
    )
  }
  
  export default GuestLayout
  