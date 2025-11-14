import { createBrowserRouter } from 'react-router-dom'
import AuthLayout from '../views/layouts/AuthLayout'
import GuestLayout from '../views/layouts/GuestLayout'

import authRoutes from './authRoutes'
import guestRoutes from './guestRoutes'
import LocationTest from '@/components/LocationTest'

const router = createBrowserRouter([
    {
        name: 'authLayout',
        path: '/',
        element: <AuthLayout />,
        children: authRoutes
    },
    {
        name: 'guestLaylout',
        path: '/',
        element: <GuestLayout />,
        children: guestRoutes
    },
])

export default router