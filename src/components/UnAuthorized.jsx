import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { getUser, logout } from '@/stores/features/authFeature';
import { useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500 dark:text-yellow-400">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UnAuthorized = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const context = useAuthContext()
  const handleLogout = () => {
    dispatch(logout(context))
    if (!user) dispatch(getUser())
  };

  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-center p-4">
      <LockIcon />
      <h2 className="text-3xl font-bold text-red-600 dark:text-red-500 mt-6 mb-2">
        401 - Unauthorized Access
      </h2>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-md">
        You do not have permission to view this page. Please log in or contact support for access.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => navigate(-1)}
            className="
                  bg-blue-600 text-white hover:bg-blue-700 
                  dark:bg-indigo-600 dark:hover:bg-indigo-700 
                  transition-all px-6 py-3 rounded-lg w-full sm:w-auto
              "
            variant="default"
          >
            Back
          </Button>
        <Button
          onClick={handleLogout}
          variant="secondary"
        >
          Logout
        </Button>

      </div>
    </div>
  );
};

export default UnAuthorized;