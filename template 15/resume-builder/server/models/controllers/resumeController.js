import Resume from '../Resume.js';
import pdfParse from 'pdf-parse';
import multer from 'multer';
const upload = multer();


// --- AI Enhancement (OpenAI) ---
// Remove top-level import and initialization of OpenAI
// Instead, import and initialize OpenAI inside each function that uses it

export const extractJSON = [upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const data = await pdfParse(req.file.buffer);
    return res.json({ text: data.text });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to extract JSON from PDF' });
  }
}];

export const saveResume = async (req, res) => {
  try {
    const { userId, resumeData } = req.body;
    if (!userId || !resumeData) {
      return res.status(400).json({ error: 'User ID and resume data are required' });
    }
    const resume = await Resume.findOneAndUpdate(
      { userId },
      { resumeData, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    return res.status(200).json({ success: true, resume });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save resume' });
  }
};

export const getResume = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const resume = await Resume.findOne({ userId });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    return res.status(200).json({ resume });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get resume' });
  }
};

export const generateShareLink = async (req, res) => {
  try {
    const { userId } = req.params;
    const { expiryDays } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const resume = await Resume.findOne({ userId });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    const shareToken = Math.random().toString(36).substr(2, 9);
    let shareExpiry = null;
    if (expiryDays) {
      shareExpiry = new Date();
      shareExpiry.setDate(shareExpiry.getDate() + parseInt(expiryDays));
    }
    resume.shareToken = shareToken;
    resume.shareExpiry = shareExpiry;
    await resume.save();
    const shareUrl = `${req.protocol}://${req.get('host')}/share/${shareToken}`;
    return res.status(200).json({ shareUrl, expiryDate: shareExpiry });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate share link' });
  }
};

export const getSharedResume = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ error: 'Share token is required' });
    }
    const resume = await Resume.findOne({ shareToken: token });
    if (!resume) {
      return res.status(404).json({ error: 'Shared resume not found or link expired' });
    }
    if (resume.shareExpiry && new Date() > resume.shareExpiry) {
      return res.status(410).json({ error: 'Share link has expired' });
    }
    return res.status(200).json({ resumeData: resume.resumeData });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get shared resume' });
  }
};

export const enhanceSection = async (req, res) => {
  try {
    const { section, inputText } = req.body;
    if (!section || !inputText) {
      return res.status(400).json({ error: 'Section and input text are required' });
    }
    
    // Check if we should use the OpenAI API or mock data
    const useOpenAI = process.env.OPENAI_API_KEY && process.env.USE_OPENAI !== 'false';
    
    if (useOpenAI) {
      try {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const uniquePrompt = `Enhance the following ${section} section for a professional resume. Make it well-written, impactful, and unique: ${inputText}.`;
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a professional resume writer. Your task is to enhance resume content to be more impactful, professional, and well-written." },
            { role: "user", content: uniquePrompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        });
        const enhancedText = completion.choices[0].message.content.trim();
        return res.status(200).json({ enhancedText });
      } catch (error) {
        console.error('OpenAI API error:', error.message);
        // Fall back to mock data if OpenAI fails
      }
    }
    
    // Mock enhancement for testing or when OpenAI is unavailable
    console.log('Using mock enhancement data for section:', section);
    let enhancedText = '';
    
    switch(section.toLowerCase()) {
      case 'summary':
        enhancedText = `${inputText} [Enhanced with professional language and impactful statements to highlight core competencies and career achievements.]`;
        break;
      case 'experience':
        enhancedText = `${inputText} [Enhanced with action verbs, quantifiable achievements, and industry-specific terminology to showcase professional growth and impact.]`;
        break;
      case 'skills':
        enhancedText = `${inputText} [Enhanced with relevant technical and soft skills, organized by proficiency level and aligned with industry standards.]`;
        break;
      case 'education':
        enhancedText = `${inputText} [Enhanced with academic achievements, relevant coursework, and educational highlights that align with career objectives.]`;
        break;
      default:
        enhancedText = `${inputText} [Enhanced with professional language appropriate for a resume.]`;
    }
    
    return res.status(200).json({ enhancedText, usingMockData: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to enhance section', aiUnavailable: true });
  }
};

export const autoEnhanceResume = async (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }
    
    // Check if we should use the OpenAI API or mock data
    const useOpenAI = process.env.OPENAI_API_KEY && process.env.USE_OPENAI !== 'false';
    const enhancedResume = { ...resumeData };
    let usingMockData = false;
    
    if (useOpenAI) {
      try {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        if (enhancedResume.summary) {
          const summaryPrompt = `Enhance the following professional summary to be more impactful and well-written: ${enhancedResume.summary}.`;
          const summaryCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "You are a professional resume writer. Your task is to enhance resume content to be more impactful, professional, and well-written." },
              { role: "user", content: summaryPrompt }
            ],
            max_tokens: 300,
            temperature: 0.7
          });
          enhancedResume.summary = summaryCompletion.choices[0].message.content.trim();
        }
        
        if (enhancedResume.experience && enhancedResume.experience.length > 0) {
          for (let i = 0; i < enhancedResume.experience.length; i++) {
            if (enhancedResume.experience[i].description) {
              const expPrompt = `Enhance the following work experience description to be more impactful, using strong action verbs and quantifiable achievements: ${enhancedResume.experience[i].description}.`;
              const expCompletion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                  { role: "system", content: "You are a professional resume writer. Your task is to enhance resume content to be more impactful, professional, and well-written." },
                  { role: "user", content: expPrompt }
                ],
                max_tokens: 300,
                temperature: 0.7
              });
              enhancedResume.experience[i].description = expCompletion.choices[0].message.content.trim();
            }
          }
        }
        
        if (enhancedResume.education && enhancedResume.education.length > 0) {
          for (let i = 0; i < enhancedResume.education.length; i++) {
            if (enhancedResume.education[i].description) {
              const eduPrompt = `Enhance the following education description to be more impactful and relevant: ${enhancedResume.education[i].description}.`;
              const eduCompletion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                  { role: "system", content: "You are a professional resume writer. Your task is to enhance resume content to be more impactful, professional, and well-written." },
                  { role: "user", content: eduPrompt }
                ],
                max_tokens: 200,
                temperature: 0.7
              });
              enhancedResume.education[i].description = eduCompletion.choices[0].message.content.trim();
            }
          }
        }
        
        return res.status(200).json({ enhancedResume });
      } catch (error) {
        console.error('OpenAI API error:', error.message);
        // Fall back to mock data if OpenAI fails
        usingMockData = true;
      }
    } else {
      usingMockData = true;
    }
    
    // Mock enhancement for testing or when OpenAI is unavailable
    if (usingMockData) {
      console.log('Using mock enhancement data for auto-enhance');
      
      if (enhancedResume.summary) {
        enhancedResume.summary = `${enhancedResume.summary} [Enhanced with professional language and impactful statements to highlight core competencies and career achievements.]`;
      }
      
      if (enhancedResume.experience && enhancedResume.experience.length > 0) {
        for (let i = 0; i < enhancedResume.experience.length; i++) {
          if (enhancedResume.experience[i].description) {
            enhancedResume.experience[i].description = `${enhancedResume.experience[i].description} [Enhanced with action verbs, quantifiable achievements, and industry-specific terminology.]`;
          }
        }
      }
      
      if (enhancedResume.education && enhancedResume.education.length > 0) {
        for (let i = 0; i < enhancedResume.education.length; i++) {
          if (enhancedResume.education[i].description) {
            enhancedResume.education[i].description = `${enhancedResume.education[i].description} [Enhanced with academic achievements and relevant coursework.]`;
          }
        }
      }
      
      return res.status(200).json({ enhancedResume, usingMockData: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to auto-enhance resume', aiUnavailable: true });
  }
};

export const parseResumeTextAPI = async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }
    // Dummy parse: return a sample structured resume
    return res.status(200).json({
      name: "Aditya Tiwary",
      role: "Experienced Project Manager | IT | Leadership",
      summary: "With over 12 years of experience in project management, I bring expertise in managing complex IT projects, particularly in cloud technology.",
      skills: [{ category: "Project Management", items: ["Project Management", "Cost Management", "Cloud Knowledge"] }],
      experience: [
        {
          title: "Senior IT Project Manager",
          companyName: "IBM",
          date: "2018 - 2023",
          companyLocation: "New York, NY, USA",
          accomplishment: "• Oversaw a $2M project portfolio.\n• Improved project delivery efficiency by 20%."
        }
      ],
      education: [
        {
          degree: "Master's Degree in Computer Science",
          institution: "Massachusetts Institute of Technology",
          duration: "2012 - 2013",
          location: "Cambridge, MA, USA"
        }
      ],
      languages: [
        { name: "English", level: "Native", dots: 5 },
        { name: "Spanish", level: "Advanced", dots: 4 }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to parse resume text' });
  }
};