import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component to display the status of AI services
 * @param {Object} props - Component props
 * @param {boolean} props.isAvailable - Whether AI services are available
 * @param {string} props.message - Message to display when AI is unavailable
 * @param {boolean} props.isLoading - Whether AI services are loading
 */
const AIStatusIndicator = ({ isAvailable = true, message = '', isLoading = false, onClose }) => {
  if (isLoading) {
    return (
      <div className="flex items-center p-2 bg-blue-50 text-blue-700 rounded-md">
        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading AI services...</span>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="p-2 bg-yellow-50 text-yellow-700 rounded-md flex items-center relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>{message || 'AI enhancement is currently unavailable.'}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-yellow-700 hover:text-yellow-900 text-lg font-bold focus:outline-none"
            aria-label="Hide notification"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-2 bg-green-50 text-green-700 rounded-md flex items-center relative">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>AI enhancement is ready to use</span>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-green-700 hover:text-green-900 text-lg font-bold focus:outline-none"
          aria-label="Hide notification"
        >
          ×
        </button>
      )}
    </div>
  );
};

AIStatusIndicator.propTypes = {
  isAvailable: PropTypes.bool,
  message: PropTypes.string,
  isLoading: PropTypes.bool,
  onClose: PropTypes.func,
};

export default AIStatusIndicator;