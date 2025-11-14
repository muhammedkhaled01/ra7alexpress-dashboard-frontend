import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-center">
    {/* <Page404 /> */}
    <img src="/404.svg" className="w-[427px]" />
      <h2 className="text-3xl font-bold text-red-600 mb-4">
        404 - Page Not Found
      </h2>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Sorry, the page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-all"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
