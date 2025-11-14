import { getUser, logout } from "@/stores/features/authFeature"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

const CheckRole = () => {
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.user) {
      dispatch(getUser())
    }
  }, [auth.user])
  useEffect(() => {

    if (auth.user) {
      if (auth.user.role.name == 'Admin') {
        console.log("Role", auth.user.role.name)
        navigate('/admin/dashboard')
      } else if (auth.user.role.name == 'Driver') {
        console.log("Driver")
        navigate('/driver/dashboard')
      } else if (auth.user.role.name == 'Investor') {
        console.log("Investor")
        navigate('/investor/dashboard')
      } else {
        console.log("Company")
        navigate('/company/dashboard')
      }
    }
  }, [auth.user, navigate])
  return
}

export default CheckRole
