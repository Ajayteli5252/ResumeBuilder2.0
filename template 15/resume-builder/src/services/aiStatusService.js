import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Service for checking AI service status
 */
const aiStatusService = {
  /**
   * Check if the OpenAI API is available and configured correctly
   * @returns {Promise<Object>} - The status of the OpenAI API
   */
  checkStatus: async () => {
    try {
      // Make a minimal request to the enhance-section endpoint
      // with a small amount of text to check if OpenAI is working
      const response = await axios.post(`${API_URL}/enhance-section`, {
        section: 'test',
        inputText: 'test'
      });
      
      return { 
        isAvailable: true,
        message: 'AI services are available'
      };
    } catch (error) {
      console.error('Error checking AI status:', error);
      
      // Check if we have a structured error response
      if (error.response && error.response.data) {
        const { error: errorMessage, aiUnavailable } = error.response.data;
        
        return {
          isAvailable: !aiUnavailable,
          message: errorMessage || 'AI enhancement is currently unavailable.'
        };
      }
      
      return {
        isAvailable: false,
        message: 'Unable to connect to AI services. Please try again later.'
      };
    }
  }
};

export default aiStatusService;