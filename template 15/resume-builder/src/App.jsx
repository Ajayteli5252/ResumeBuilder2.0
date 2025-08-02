import React, { useState, useEffect } from 'react'
import Template15 from './components/Template15'
import AIStatusIndicator from './components/AIStatusIndicator'
import aiStatusService from './services/aiStatusService'

function App() {
  const [aiStatus, setAiStatus] = useState({
    isAvailable: true,
    message: '',
    isLoading: true
  });

  // State to control notification visibility
  const [showNotification, setShowNotification] = useState(true);

  useEffect(() => {
    const checkAiStatus = async () => {
      try {
        const status = await aiStatusService.checkStatus();
        setAiStatus({
          isAvailable: status.isAvailable,
          message: status.message,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to check AI status:', error);
        setAiStatus({
          isAvailable: false,
          message: 'Unable to verify AI services. Please try again later.',
          isLoading: false
        });
      }
    };

    checkAiStatus();
  }, []);

  return (
    <div className="app">
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 w-64 shadow-md no-print">
          <AIStatusIndicator 
            isAvailable={aiStatus.isAvailable} 
            message={aiStatus.message} 
            isLoading={aiStatus.isLoading}
            onClose={() => setShowNotification(false)}
          />
        </div>
      )}
      <Template15 aiStatus={aiStatus} />
    </div>
  )
}

export default App