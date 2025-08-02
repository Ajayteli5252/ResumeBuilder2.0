import React, { useState, useEffect } from 'react';
import resumeService from '../services/resumeService';

const SaveShareResume = ({ resumeData }) => {
  const [userId, setUserId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Generate a user ID if not already stored in localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('resumeUserId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('resumeUserId', newUserId);
      setUserId(newUserId);
    }

    // Load resume data from localStorage if available
    const savedResumeData = localStorage.getItem('resumeDraft');
    if (savedResumeData) {
      // This would be handled by the parent component
      // setResumeData(JSON.parse(savedResumeData));
    }
  }, []);

  // Save resume data to localStorage whenever it changes
  useEffect(() => {
    if (resumeData) {
      localStorage.setItem('resumeDraft', JSON.stringify(resumeData));
    }
  }, [resumeData]);

  const saveResume = async () => {
    if (!userId) {
      setStatusMessage('User ID not found. Please refresh the page.');
      setMessageType('error');
      return;
    }
    
    console.log('Attempting to save resume on frontend for userId:', userId);
    console.log('Resume data being sent:', resumeData);

    setIsSaving(true);
    setStatusMessage('');

    try {
      await resumeService.saveResume(userId, resumeData);
      setStatusMessage('Resume saved successfully!');
      setMessageType('success');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setStatusMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving resume:', error);
      setStatusMessage('Failed to save resume. Please try again.');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const generateShareLink = async () => {
    if (!userId) {
      setStatusMessage('User ID not found. Please refresh the page.');
      setMessageType('error');
      return;
    }

    setIsSharing(true);
    setStatusMessage('');

    try {
      // First save the resume to ensure the shared version is up-to-date
      await resumeService.saveResume(userId, resumeData);
      
      // Then generate the share link
      const { shareUrl } = await resumeService.generateShareLink(userId, expiryDays);
      setShareUrl(shareUrl);
      setShowShareLink(true);
      setShowShareOptions(false);
    } catch (error) {
      console.error('Error generating share link:', error);
      setStatusMessage('Failed to generate share link. Please try again.');
      setMessageType('error');
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setStatusMessage('Link copied to clipboard!');
        setMessageType('success');
        
        // Clear the message after 3 seconds
        setTimeout(() => {
          setStatusMessage('');
        }, 3000);
      })
      .catch(() => {
        setStatusMessage('Failed to copy link. Please try again.');
        setMessageType('error');
      });
  };

  const shareViaWebShare = async () => {
    if (!navigator.share) {
      setStatusMessage('Web Share API is not supported in your browser.');
      setMessageType('error');
      return;
    }

    try {
      await navigator.share({
        title: `${resumeData.name}'s Resume`,
        text: 'Check out my resume!',
        url: shareUrl
      });
      setStatusMessage('Shared successfully!');
      setMessageType('success');
    } catch (error) {
      if (error.name !== 'AbortError') {
        setStatusMessage('Error sharing resume.');
        setMessageType('error');
      }
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Save Resume Button */}
      <button
        className={`w-full ${isSaving ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'} text-white py-2 px-4 rounded flex items-center justify-center no-print`}
        onClick={saveResume}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </>
        ) : (
          'Save Resume'
        )}
      </button>

      {/* Share Resume Button */}
      <div className="relative">
        <button
          className={`w-full ${isSharing ? 'bg-gray-500' : 'bg-purple-600 hover:bg-purple-700'} text-white py-2 px-4 rounded flex items-center justify-center no-print`}
          onClick={() => setShowShareOptions(!showShareOptions)}
          disabled={isSharing}
        >
          {isSharing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Share Resume'
          )}
        </button>

        {/* Share Options Dropdown */}
        {showShareOptions && (
          <div className="absolute z-10 w-full mt-2 bg-white rounded-md shadow-lg">
            <div className="p-4 space-y-3">
              <h3 className="font-medium text-gray-900">Share Options</h3>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Link expires after:</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                >
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={0}>Never</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded no-print"
                  onClick={generateShareLink}
                >
                  Generate Link
                </button>
                <button
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded no-print"
                  onClick={() => setShowShareOptions(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Link Display */}
        {showShareLink && (
          <div className="absolute z-10 w-full mt-2 bg-white rounded-md shadow-lg">
            <div className="p-4 space-y-3">
              <h3 className="font-medium text-gray-900">Share Link</h3>
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 border border-gray-300 rounded-l px-3 py-2 focus:outline-none"
                  value={shareUrl}
                  readOnly
                />
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-r no-print"
                  onClick={copyToClipboard}
                >
                  Copy
                </button>
              </div>
              <div className="flex space-x-2">
                {navigator.share && (
                  <button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded no-print"
                    onClick={shareViaWebShare}
                  >
                    Share
                  </button>
                )}
                <button
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded no-print"
                  onClick={() => setShowShareLink(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`p-2 rounded ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default SaveShareResume;