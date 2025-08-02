# Resume Builder with AI Enhancement

A modern resume builder application with AI-powered enhancement features, resume saving, sharing, and PDF download capabilities.

## Features

1. **AI Assistant Enhancement**
   - Enhance resume sections with AI assistance
   - Get professionally written content for summary, experience, and more

2. **Save & Share Resume**
   - Save resume data to MongoDB
   - Generate shareable links with optional expiry dates
   - Web Share API support for easy sharing

3. **Download PDF**
   - Generate and download professional PDF resumes
   - Maintains formatting and styling

4. **Upload & Auto-Enhance Resume**
   - Upload previously saved resumes
   - Choose between manual editing or AI enhancement

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- HTML2Canvas & jsPDF for PDF generation

### Backend
- Node.js with Express
- MongoDB with Mongoose
- OpenAI API for AI enhancement
- UUID for secure share links

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- OpenAI API key

### Installation

1. Clone the repository

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   - Create or modify the `.env` file in the root directory
   - Add the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/resume-builder
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Get an OpenAI API Key
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Navigate to API Keys section
   - Create a new API key
   - Make sure your account has available credits (new accounts typically get free credits)
   - Replace `your_openai_api_key_here` in the `.env` file with your actual API key

5. Create a `.env.local` file in the root directory with:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. Start the development server (frontend)
   ```
   npm run dev
   ```

2. Start the backend server
   ```
   npm run dev:server
   ```

3. Or run both concurrently
   ```
   npm run dev:full
   ```

## Troubleshooting

### OpenAI API Key Issues

1. **API Key Not Working or Quota Exceeded**
   - Error message: `429 You exceeded your current quota, please check your plan and billing details`
   - Solution: 
     - Get a new API key from [OpenAI Platform](https://platform.openai.com/)
     - Make sure your account has available credits
     - Update the `OPENAI_API_KEY` in your `.env` file

2. **API Key Not Found**
   - Error message: `OpenAI API key is missing`
   - Solution:
     - Check that your `.env` file exists in the root directory
     - Verify that the `OPENAI_API_KEY` variable is correctly set
     - Restart the server after making changes

3. **Environment Variables Not Loading**
   - Check for encoding issues in your `.env` file
   - Make sure the file is saved with UTF-8 encoding
   - Recreate the file if necessary

4. **Testing Without OpenAI API**
   - You can test the application without a valid OpenAI API key by using the mock data feature
   - Add `USE_OPENAI=false` to your `.env` file
   - The application will use mock data instead of calling the OpenAI API
   - This is useful for development and testing purposes

## API Endpoints

### AI Enhancement
- `POST /api/enhance-section` - Enhance a specific section
- `POST /api/auto-enhance-resume` - Enhance the entire resume

### Resume Management
- `POST /api/save-resume` - Save resume data
- `GET /api/get-resume/:userId` - Get saved resume

### Sharing
- `GET /api/generate-share-link/:userId` - Generate a shareable link
- `GET /api/shared-resume/:token` - Get a shared resume

### PDF Generation
- `POST /api/generate-pdf` - Generate a PDF from resume data

## License

MIT
 
## Security Notice

Never share your API keys or secrets publicly.
If you accidentally commit a secret, remove it from git history before pushing to GitHub.
See [GitHub documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) for help.