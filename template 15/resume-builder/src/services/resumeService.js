import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Service for interacting with the resume API
 */
const resumeService = {
  /**
   * Enhance a specific section of the resume using AI
   * @param {string} section - The section to enhance (e.g., summary, achievements)
   * @param {string} inputText - The text to enhance
   * @returns {Promise<Object>} - The enhanced text
   */
  enhanceSection: async (section, inputText) => {
    try {
      const response = await axios.post(`${API_URL}/enhance-section`, {
        section,
        inputText
      });
      return response.data;
    } catch (error) {
      console.error('Error enhancing section:', error);
      // Check if we have a structured error response
      if (error.response && error.response.data && error.response.data.error) {
        // Return the error in a format that can be handled by the component
        return { 
          error: error.response.data.error,
          aiUnavailable: error.response.data.aiUnavailable || false
        };
      }
      throw error;
    }
  },

  /**
   * Save resume data to the server
   * @param {string} userId - The user ID
   * @param {Object} resumeData - The resume data to save
   * @returns {Promise<Object>} - The saved resume
   */
  saveResume: async (userId, resumeData) => {
    try {
      const response = await axios.post(`${API_URL}/save-resume`, {
        userId,
        resumeData
      });
      return response.data;
    } catch (error) {
      console.error('Error saving resume:', error);
      throw error;
    }
  },

  /**
   * Get resume data from the server
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The resume data
   */
  getResume: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/get-resume/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting resume:', error);
      throw error;
    }
  },

  /**
   * Generate a shareable link for the resume
   * @param {string} userId - The user ID
   * @param {number} expiryDays - Optional number of days until the link expires
   * @returns {Promise<Object>} - The share URL and expiry date
   */
  generateShareLink: async (userId, expiryDays) => {
    try {
      const url = expiryDays
        ? `${API_URL}/generate-share-link/${userId}?expiryDays=${expiryDays}`
        : `${API_URL}/generate-share-link/${userId}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error generating share link:', error);
      throw error;
    }
  },

  /**
   * Get a shared resume by token
   * @param {string} token - The share token
   * @returns {Promise<Object>} - The resume data
   */
  getSharedResume: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/shared-resume/${token}`);
      return response.data;
    } catch (error) {
      console.error('Error getting shared resume:', error);
      throw error;
    }
  },

  /**
   * Generate a PDF from resume data
   * @param {Object} resumeData - The resume data
   * @returns {Promise<Blob>} - The PDF blob
   */
  generatePDF: async (resumeData) => {
    try {
      const response = await axios.post(`${API_URL}/generate-pdf`, { resumeData }, {
        responseType: 'blob'
      });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return response.data;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  },

  /**
   * Auto-enhance the entire resume using AI
   * @param {Object} resumeData - The resume data to enhance
   * @returns {Promise<Object>} - The enhanced resume data
   */
  autoEnhanceResume: async (resumeData) => {
    try {
      const response = await axios.post(`${API_URL}/auto-enhance-resume`, { resumeData });
      return response.data;
    } catch (error) {
      console.error('Error auto-enhancing resume:', error);
      // Check if we have a structured error response
      if (error.response && error.response.data && error.response.data.error) {
        // Return the error in a format that can be handled by the component
        return { 
          error: error.response.data.error,
          aiUnavailable: error.response.data.aiUnavailable || false
        };
      }
      throw error;
    }
  },

  /**
   * Parse resume text and extract structured information
   * @param {string} resumeText - The raw resume text to parse
   * @returns {Promise<Object>} - The structured resume data
   */
  parseResumeText: async (resumeText) => {
    try {
      const response = await axios.post(`${API_URL}/parse-resume-text`, { resumeText });
      return response.data;
    } catch (error) {
      console.error('Error parsing resume text:', error);
      if (error.response && error.response.data && error.response.data.error) {
        return { 
          error: error.response.data.error,
          aiUnavailable: error.response.data.aiUnavailable || false
        };
      }
      throw error;
    }
  },

  generatePDFPuppeteer: async (resumeData) => {
    try {
      const response = await axios.post(`${API_URL}/generate-pdf-puppeteer`, { resumeData }, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      return response.data;
    } catch (error) {
      console.error('Error generating PDF with Puppeteer:', error);
      throw error;
    }
  }
};

export default resumeService;