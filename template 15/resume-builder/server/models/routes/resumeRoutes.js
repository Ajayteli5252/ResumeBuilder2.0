import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config(); // Make sure this is here

import {
  enhanceSection,
  saveResume,
  getResume,
  generateShareLink,
  getSharedResume,
  autoEnhanceResume,
  extractJSON,
  parseResumeTextAPI
} from '../controllers/resumeController.js';

const router = express.Router();

// AI Enhancement routes
router.post('/enhance-section', enhanceSection);
router.post('/auto-enhance-resume', autoEnhanceResume);

// Resume CRUD routes
router.post('/save-resume', saveResume);
router.get('/get-resume/:userId', getResume);

// Share resume route
router.get('/generate-share-link/:userId', generateShareLink);
router.get('/shared-resume/:token', getSharedResume);

// PDF extraction route
router.post('/extract-json', extractJSON);
// Resume text parsing route
router.post('/parse-resume-text', parseResumeTextAPI);

export default router;