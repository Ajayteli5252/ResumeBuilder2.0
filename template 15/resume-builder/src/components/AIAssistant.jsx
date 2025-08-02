import React, { useState } from 'react';
import PropTypes from 'prop-types';
import resumeService from '../services/resumeService';

const AIAssistant = ({ section, inputText, onEnhancedText, buttonText = 'Enhance with AI', saveResume, userId, resumeData, aiStatus, className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);

  const enhanceText = async () => {
    // Check if AI is available based on aiStatus prop
    if (aiStatus && !aiStatus.isAvailable) {
      setError(aiStatus.message || 'AI enhancement is currently unavailable');
      return;
    }

    if (!inputText || inputText.trim() === '') {
      setError('Please enter some text to enhance');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Auto-save before enhancement
      if (saveResume && userId && resumeData) {
        await saveResume(userId, resumeData);
      }
      const response = await resumeService.enhanceSection(section, inputText);
      
      // Check if we got an error response with enhancedText
      if (response.error) {
        setError(response.error);
        return;
      }
      
      const { enhancedText } = response;
      onEnhancedText(enhancedText);
      setIsOpen(false);
    } catch (error) {
      console.error('Error enhancing text:', error);
      // Check if the error response contains our custom error message
      if (error.response && error.response.data) {
        const { error: errorMessage, aiUnavailable } = error.response.data;
        setError(errorMessage || 'Failed to enhance text. Please try again.');
      } else {
        setError('Failed to enhance text. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if AI is available based on aiStatus prop
  const isAIAvailable = !aiStatus || aiStatus.isAvailable;
  const aiMessage = aiStatus?.message || '';

  return (
    <div className={`relative inline-block text-left ${className || ''}`}>
      {isAIAvailable ? (
        <button
          type="button"
          className={`bg-indigo-600 text-white px-2 py-1 rounded text-sm hover:bg-indigo-700 transition-colors flex items-center no-print ${className || ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title={aiStatus?.isLoading ? 'Loading AI services...' : 'Enhance with AI'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          {buttonText}
        </button>
      ) : (
        <button
          type="button"
          className={`bg-gray-400 text-white px-2 py-1 rounded text-sm cursor-not-allowed flex items-center no-print ${className || ''}`}
          disabled
          title={aiMessage || 'AI enhancement is currently unavailable'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          {buttonText}
        </button>
      )}

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1 px-2" role="menu" aria-orientation="vertical">
            <p className="text-sm text-gray-700 mb-2">Enhance your {section} with AI assistance</p>
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <div className="flex">
              <button
                type="button"
                className={`flex-1 text-sm ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-2 py-1 rounded mr-1 print:hidden`}
                onClick={enhanceText}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Enhance'
                )}
              </button>
              <button
                type="button"
                className="flex-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AIAssistant.propTypes = {
  section: PropTypes.string.isRequired,
  inputText: PropTypes.string,
  onEnhancedText: PropTypes.func.isRequired,
  buttonText: PropTypes.string,
  saveResume: PropTypes.func,
  userId: PropTypes.string,
  resumeData: PropTypes.object,
  aiStatus: PropTypes.shape({
    isAvailable: PropTypes.bool,
    message: PropTypes.string,
    isLoading: PropTypes.bool
  }),
  className: PropTypes.string
};

export default AIAssistant;