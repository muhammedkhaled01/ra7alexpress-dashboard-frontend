import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ErrorOccurred({ onReset }) {
  const navigate = useNavigate();
  const [navigateHome, setNavigateHome] = useState(false);
  const [refreshPage, setRefreshPage] = useState(false);
  useEffect(() => {
    if (navigateHome) {
      onReset();
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 0);
    }
  }, [navigateHome]);

  useEffect(() => {
    if (refreshPage) {
      onReset();
      setTimeout(() => {
        window.location.reload();
      }, 0);
    }
  }, [refreshPage]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-center">
      <img src="/500.svg" alt="Error" className="w-[427px]" />
      <div className="mt-6">
        <button
          onClick={() => setNavigateHome(true)}
          className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-all"
        >
          Back to Home
        </button>
        <button
          onClick={() => setRefreshPage(true)}
          className="ml-4 inline-block bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
