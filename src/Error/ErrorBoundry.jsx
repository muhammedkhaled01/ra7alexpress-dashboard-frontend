import { Component } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import ErrorOccurred from './ErrorOccurred';

function ErrorBoundaryWrapper({ children }) {
  const location = useLocation();
  return <ErrorBoundary location={location}>{children}</ErrorBoundary>;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    const { pathname } = this.props.location;
    if (this.state.hasError && pathname !== prevProps.location.pathname) {
      // Reset error on route change
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorOccurred onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

export default ErrorBoundaryWrapper;
