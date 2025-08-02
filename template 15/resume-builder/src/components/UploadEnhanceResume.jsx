import React, { useState } from 'react';
import resumeService from '../services/resumeService';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Update worker URL to use the correct file format (.mjs instead of .min.js)
GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.93/pdf.worker.mjs";

const UploadEnhanceResume = ({ onResumeLoad }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [showEnhanceOptions, setShowEnhanceOptions] = useState(false);

  const defaultResume = {
    name: "",
    role: "",
    phone: "",
    email: "",
    linkedin: "",
    location: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    languages: [],
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage('');

    if (file.type === 'application/pdf') {
      // PDF upload handling
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await getDocument({ data: typedarray }).promise;
          let textContent = '';

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            let pageText = '';

            // Group text items by their y-position to preserve line structure
            const lines = {};
            for (const item of content.items) {
              const y = Math.round(item.transform[5]);
              if (!lines[y]) {
                lines[y] = [];
              }
              lines[y].push(item.str);
            }
            const sortedYPositions = Object.keys(lines).map(Number).sort((a, b) => b - a);
            for (const y of sortedYPositions) {
              pageText += lines[y].join(' ') + '\n';
            }

            // If no text found, try OCR
            if (!pageText.trim()) {
              // Render page to canvas
              const viewport = page.getViewport({ scale: 2 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              await page.render({ canvasContext: context, viewport }).promise;
              // Run OCR
              setStatusMessage(`Running OCR on page ${i}...`);
              const { data: { text: ocrText } } = await Tesseract.recognize(canvas, 'eng');
              pageText = ocrText;
            }

            textContent += pageText + '\n';
          }

          setStatusMessage('PDF text extraction complete.');

          // Improved extraction for name, role, and contact info for clean header
          const lines = textContent.split('\n').map(l => l.trim()).filter(Boolean);
          let name = '';
          let role = '';
          let phone = '';
          let email = '';
          let linkedin = '';
          let location = '';

          // Name: first line (must be two words, all caps or title case)
          if (lines.length > 0 && /^[A-Z][A-Za-z]+ [A-Z][A-Za-z]+$/.test(lines[0])) {
            name = lines[0];
            // Role: second line (if present)
            if (lines.length > 1) role = lines[1];
          } else if (lines.length > 1 && /^[A-Z][A-Za-z]+ [A-Z][A-Za-z]+$/.test(lines[1])) {
            name = lines[1];
            if (lines.length > 2) role = lines[2];
          } else {
            // fallback: use first line as name, second as role
            if (lines.length > 0) name = lines[0];
            if (lines.length > 1) role = lines[1];
          }
          
          // Ensure proper case formatting for name and role
          // Name should be properly capitalized
          if (name) {
            name = name.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          }
          
          // Role should maintain proper case (not all uppercase)
          if (role && role === role.toUpperCase()) {
            // Convert all-uppercase role to title case
            role = role.split('|').map(part => 
              part.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ')
            ).join(' | ');
          }

          // Contact info: look for keywords in the next few lines (skip name/role lines)
          for (let i = 2; i < Math.min(10, lines.length); i++) {
            const line = lines[i];
            if (!email && /@/.test(line)) email = line.match(/[\w.-]+@[\w.-]+/)?.[0] || '';
            if (!phone && /\d{10,}/.test(line.replace(/\D/g, ''))) phone = line;
            if (!linkedin && /linkedin/i.test(line)) linkedin = line;
            if (!location && /(USA|United States|India|UK|Canada|Australia|Germany|France|Japan|China|Remote|New York|Cambridge|MA|NY)/i.test(line)) location = line;
          }

          // Parse the extracted text into sections using the server API
          async function parseResumeText(text) {
            try {
              // First, extract contact information from the first few lines
              const contactInfo = extractContactInfo(text);
              // Call the server API to parse the resume text
              const response = await resumeService.parseResumeText(text);
              
              // Ensure proper case formatting for name and role from all sources
              let finalName = name || contactInfo.name || response.name || '';
              let finalRole = role || contactInfo.role || response.role || '';
              
              // Ensure name is properly capitalized if it exists
              if (finalName) {
                // Only transform if it's all uppercase or all lowercase
                if (finalName === finalName.toUpperCase() || finalName === finalName.toLowerCase()) {
                  finalName = finalName.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  ).join(' ');
                }
              }
              
              // Ensure role maintains proper case (not all uppercase)
              if (finalRole && finalRole === finalRole.toUpperCase()) {
                finalRole = finalRole.split('|').map(part => 
                  part.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  ).join(' ')
                ).join(' | ');
              }
              
              // Merge the parsed sections with contact info and set header fields
              return {
                ...response,
                ...contactInfo,
                name: finalName,
                role: finalRole,
                phone: phone || contactInfo.phone || response.phone || '',
                email: email || contactInfo.email || response.email || '',
                linkedin: linkedin || contactInfo.linkedin || response.linkedin || '',
                location: location || contactInfo.location || response.location || ''
              };
            } catch (error) {
              console.error('Error parsing resume text:', error);
              // Fallback to basic parsing if server call fails
              return fallbackParseResumeText(text);
            }
          }
          
          // Extract contact information from the resume text
          function extractContactInfo(text) {
            const contactInfo = {
              name: '',
              role: '',
              phone: '',
              email: '',
              linkedin: '',
              location: '',
            };
            
            const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
            
            // Check the first few lines for contact information
            for (let i = 0; i < Math.min(10, lines.length); i++) {
              const line = lines[i];
              // Email pattern
              if (/\bemail\b|@/i.test(line)) {
                const emailMatch = line.match(/[\w.-]+@[\w.-]+/i);
                if (emailMatch) contactInfo.email = emailMatch[0];
              }
              
              // Phone pattern (10+ digits)
              if (/\bphone\b|\d{10,}/i.test(line)) {
                const phoneMatch = line.match(/\+?\d[\d\s-]{8,}/); 
                if (phoneMatch) contactInfo.phone = phoneMatch[0];
              }
              
              // LinkedIn URL
              if (/linkedin/i.test(line)) {
                const linkedinMatch = line.match(/linkedin\.com\S*/i);
                if (linkedinMatch) contactInfo.linkedin = linkedinMatch[0];
              }
              
              // Location information
              if (/\blocation\b|\bcity\b|\bstate\b|\bcountry\b|\baddress\b/i.test(line)) {
                contactInfo.location = line.replace(/\blocation\b|\bcity\b|\bstate\b|\bcountry\b|\baddress\b/i, '').trim();
              }
              
              // Name pattern (First Last format)
              if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(line) && !contactInfo.name) {
                contactInfo.name = line;
              }
              
              // Role/title pattern (often follows name or is on second line)
              if (i === 1 || i === 2) {
                if (!/^[A-Z][a-z]+ [A-Z][a-z]+/.test(line) && 
                    !/\bemail\b|@|\bphone\b|\d{10,}|linkedin|\blocation\b/i.test(line)) {
                  contactInfo.role = line;
                }
              }
            }
            
            return contactInfo;
          }
          
          // Fallback parser in case the server call fails
          function fallbackParseResumeText(text) {
            console.log('Using fallback parser for text length:', text.length);
            const contactInfo = extractContactInfo(text);
            
            // Format name and role properly
            let formattedName = name || contactInfo.name || '';
            let formattedRole = role || contactInfo.role || '';
            
            // Ensure name is properly capitalized
            if (formattedName) {
              // Only transform if it's all uppercase or all lowercase
              if (formattedName === formattedName.toUpperCase() || formattedName === formattedName.toLowerCase()) {
                formattedName = formattedName.split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
              }
            }
            
            // Ensure role maintains proper case (not all uppercase)
            if (formattedRole && formattedRole === formattedRole.toUpperCase()) {
              formattedRole = formattedRole.split('|').map(part => 
                part.split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')
              ).join(' | ');
            }
            
            const sections = {
              summary: '',
              skills: [],
              experience: [],
              education: [],
              languages: [],
              certifications: [],
              projects: [],
              ...contactInfo,
              name: formattedName,
              role: formattedRole
            };
            
            const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
            console.log('Parsed lines count:', lines.length);
            let currentSection = 'summary';
            let buffer = [];
            
            // Enhanced section map with more variations and common formats
            const sectionMap = {
              'PROFESSIONAL SUMMARY': 'summary',
              'SUMMARY': 'summary',
              'PROFILE': 'summary',
              'ABOUT ME': 'summary',
              'OBJECTIVE': 'summary',
              'CAREER OBJECTIVE': 'summary',
              'PROFESSIONAL PROFILE': 'summary',
              'CAREER PROFILE': 'summary',
              'PERSONAL STATEMENT': 'summary',
              'EXECUTIVE SUMMARY': 'summary',
              
              'SKILLS': 'skills',
              'TECHNICAL SKILLS': 'skills',
              'CORE COMPETENCIES': 'skills',
              'KEY SKILLS': 'skills',
              'EXPERTISE': 'skills',
              'PROFICIENCIES': 'skills',
              'QUALIFICATIONS': 'skills',
              'AREAS OF EXPERTISE': 'skills',
              'TECHNICAL PROFICIENCIES': 'skills',
              'SKILL SET': 'skills',
              
              'EXPERIENCE': 'experience',
              'WORK EXPERIENCE': 'experience',
              'PROFESSIONAL EXPERIENCE': 'experience',
              'EMPLOYMENT HISTORY': 'experience',
              'WORK HISTORY': 'experience',
              'CAREER HISTORY': 'experience',
              'RELEVANT EXPERIENCE': 'experience',
              'EMPLOYMENT': 'experience',
              'PROFESSIONAL BACKGROUND': 'experience',
              
              'EDUCATION': 'education',
              'ACADEMIC BACKGROUND': 'education',
              'EDUCATIONAL BACKGROUND': 'education',
              'ACADEMIC QUALIFICATIONS': 'education',
              'EDUCATIONAL QUALIFICATIONS': 'education',
              'ACADEMIC HISTORY': 'education',
              'EDUCATIONAL HISTORY': 'education',
              'ACADEMIC CREDENTIALS': 'education',
              
              'LANGUAGES': 'languages',
              'LANGUAGE PROFICIENCY': 'languages',
              'LANGUAGE SKILLS': 'languages',
              'FOREIGN LANGUAGES': 'languages',
              
              'CERTIFICATIONS': 'certifications',
              'CERTIFICATES': 'certifications',
              'PROFESSIONAL CERTIFICATIONS': 'certifications',
              'CREDENTIALS': 'certifications',
              'LICENSES': 'certifications',
              'PROFESSIONAL DEVELOPMENT': 'certifications',
              
              'PROJECTS': 'projects',
              'PROJECT EXPERIENCE': 'projects',
              'KEY PROJECTS': 'projects',
              'PERSONAL PROJECTS': 'projects',
              'ACADEMIC PROJECTS': 'projects',
              'PROFESSIONAL PROJECTS': 'projects'
            };
            
            function pushBufferToSection(section, buffer) {
              if (section === 'summary') {
                sections.summary = buffer.join(' ');
              } else if (section === 'skills') {
                // Enhanced skills parsing to handle various formats
                // Check if skills are categorized or flat list
                const skillText = buffer.join('\n');
                const possibleCategories = [];
                
                // Look for potential category headers in the skills section
                for (const line of buffer) {
                  // Check if line ends with colon (likely a category)
                  if (line.endsWith(':') && line.length < 50) {
                    possibleCategories.push(line.slice(0, -1).trim());
                  }
                  // Check for lines that are all caps or have special formatting
                  else if (line === line.toUpperCase() && line.length < 50 && !/^[-•*]/.test(line)) {
                    possibleCategories.push(line.trim());
                  }
                }
                
                if (possibleCategories.length > 0) {
                  // Skills appear to be categorized
                  console.log('Detected categorized skills:', possibleCategories);
                  const categories = [];
                  let currentCategory = '';
                  let currentItems = [];
                  
                  for (const line of buffer) {
                    const trimmedLine = line.trim();
                    if (possibleCategories.includes(trimmedLine) || 
                        possibleCategories.includes(trimmedLine.slice(0, -1))) {
                      // Save previous category if exists
                      if (currentCategory && currentItems.length) {
                        categories.push({
                          category: currentCategory,
                          items: currentItems
                        });
                      }
                      // Start new category
                      currentCategory = trimmedLine.replace(/:$/, '');
                      currentItems = [];
                    } else {
                      // Parse skills from this line
                      const lineItems = trimmedLine
                        .replace(/^[-•*]\s*/, '') // Remove bullet points
                        .split(/,|\s{2,}|\||;/) // Split by common delimiters
                        .map(s => s.trim())
                        .filter(Boolean);
                      currentItems.push(...lineItems);
                    }
                  }
                  
                  // Add the last category
                  if (currentCategory && currentItems.length) {
                    categories.push({
                      category: currentCategory,
                      items: currentItems
                    });
                  }
                  
                  sections.skills = categories;
                } else {
                  // Flat list of skills - improved parsing
                  const allSkills = [];
                  
                  for (const line of buffer) {
                    // Handle bullet points, commas, pipes, and other common separators
                    const lineItems = line
                      .replace(/^[-•*]\s*/, '') // Remove bullet points
                      .split(/,|\s{2,}|\||;/) // Split by common delimiters
                      .map(s => s.trim())
                      .filter(Boolean);
                    allSkills.push(...lineItems);
                  }
                  
                  sections.skills = [{ category: 'Skills', items: allSkills }];
                }
              } else if (section === 'experience') {
                // Enhanced experience parsing with better pattern recognition
                const expText = buffer.join('\n');
                
                // Improved pattern detection for experience items
                // Look for job titles, dates, or company names as separators
                const expItems = expText.split(/\n\n+|\n(?=\d{4}|[A-Z][a-z]+ at|[A-Z][a-z]+ \||Senior|Lead|Principal|Director|Manager|Engineer|Developer)/i)
                  .map(e => e.trim())
                  .filter(Boolean);
                
                console.log('Detected experience items:', expItems.length);
                
                sections.experience = expItems.map(e => {
                  const lines = e.split('\n');
                  const firstLine = lines[0] || '';
                  
                  // Try to extract title, company, date, location
                  let title = '', company = '', date = '', location = '';
                  
                  // Pattern: "Title at Company"
                  const atMatch = firstLine.match(/^(.*?)\s+at\s+(.*?)(?:\s+\((.*?)\))?$/i);
                  if (atMatch) {
                    title = atMatch[1];
                    company = atMatch[2];
                    date = atMatch[3] || '';
                  } 
                  // Pattern: "Title | Company"
                  else if (firstLine.includes('|')) {
                    const parts = firstLine.split('|').map(p => p.trim());
                    title = parts[0];
                    company = parts[1];
                    // Check if there's a date in the company part
                    const dateMatch = company.match(/(\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*(Present|Current))/i);
                    if (dateMatch) {
                      date = dateMatch[0];
                      company = company.replace(dateMatch[0], '').trim();
                    }
                  }
                  // Pattern: "Title, Company"
                  else if (firstLine.includes(',')) {
                    const parts = firstLine.split(',').map(p => p.trim());
                    title = parts[0];
                    company = parts[1];
                    // Check for location or date in additional parts
                    if (parts.length > 2) {
                      // Check if the third part is a date
                      if (/\d{4}/.test(parts[2])) {
                        date = parts[2];
                      } else {
                        location = parts[2];
                      }
                    }
                  }
                  // Default: use first line as title
                  else {
                    title = firstLine;
                    // Try to find company in second line
                    if (lines.length > 1) {
                      company = lines[1];
                      // If second line has a date pattern, it might be a date instead
                      if (/\d{4}/.test(company)) {
                        date = company;
                        company = lines.length > 2 ? lines[2] : '';
                      }
                    }
                  }
                  
                  // Look for date in any line if not found yet
                  if (!date) {
                    for (const line of lines) {
                      const dateMatch = line.match(/(\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*(Present|Current)|\d{4}\s*to\s*\d{4}|\d{4}\s*to\s*(Present|Current))/i);
                      if (dateMatch) {
                        date = dateMatch[0];
                        // If the date was in the company line, clean it up
                        if (line === company) {
                          company = company.replace(dateMatch[0], '').trim();
                        }
                        break;
                      } else if (/\b(19|20)\d{2}\b/.test(line)) {
                        date = line;
                        break;
                      }
                    }
                  }
                  
                  // Look for location patterns
                  if (!location) {
                    for (const line of lines) {
                      // Common location patterns: City, State or City, Country
                      if (/^[A-Z][a-z]+,\s*[A-Z]{2}$|^[A-Z][a-z]+,\s*[A-Z][a-z]+$/.test(line)) {
                        location = line;
                        break;
                      }
                    }
                  }
                  
                  // Extract bullet points (lines starting with - or •)
                  let bullets = lines.slice(1)
                    .filter(l => /^[-•●*]/.test(l))
                    .map(l => l.replace(/^[-•●*]\s*/, ''));
                  
                  // If no bullet points found, try to extract non-header lines as accomplishments
                  if (bullets.length === 0) {
                    bullets = lines.slice(1)
                      .filter(l => l !== company && l !== date && l !== location && 
                                 !/^(Senior|Lead|Principal|Director|Manager|Engineer|Developer)/i.test(l))
                      .filter(Boolean);
                  }
                  
                  return {
                    title,
                    companyName: company,
                    date,
                    companyLocation: location,
                    accomplishment: bullets.join('\n') || e,
                  };
                });
              } else if (section === 'education') {
                // Enhanced education parsing with better pattern recognition
                const eduText = buffer.join('\n');
                
                // Improved pattern detection for education items
                const eduItems = eduText.split(/\n\n+|\n(?=[A-Z][a-z]+ of|Bachelor|Master|PhD|B\.S\.|M\.S\.|MBA|University|College|Institute)/i)
                  .map(e => e.trim())
                  .filter(Boolean);
                
                console.log('Detected education items:', eduItems.length);
                
                sections.education = eduItems.map(e => {
                  const lines = e.split('\n');
                  const firstLine = lines[0] || '';
                  
                  // Enhanced degree, institution, and duration extraction
                  let degree = '', institution = '', duration = '', location = '';
                  
                  // Check if first line contains degree information
                  if (/Bachelor|Master|PhD|B\.S\.|M\.S\.|MBA|Diploma|Certificate|Degree/i.test(firstLine)) {
                    degree = firstLine;
                    
                    // Try to find institution in second line
                    if (lines.length > 1) {
                      institution = lines[1];
                    }
                  } 
                  // Check if first line is institution
                  else if (/University|College|Institute|School/i.test(firstLine)) {
                    institution = firstLine;
                    
                    // Try to find degree in second line
                    if (lines.length > 1) {
                      degree = lines[1];
                    }
                  }
                  // Default case - first line could be either
                  else {
                    // If first line is short, likely a degree
                    if (firstLine.length < 50) {
                      degree = firstLine;
                      if (lines.length > 1) {
                        institution = lines[1];
                      }
                    } else {
                      // Split the line if it contains a comma
                      if (firstLine.includes(',')) {
                        const parts = firstLine.split(',').map(p => p.trim());
                        degree = parts[0];
                        institution = parts[1];
                      } else {
                        degree = firstLine;
                      }
                    }
                  }
                  
                  // Look for duration/year in any line
                  for (const line of lines) {
                    // Look for year patterns (YYYY-YYYY or YYYY to YYYY or just YYYY)
                    const yearMatch = line.match(/(\d{4}\s*-\s*\d{4}|\d{4}\s*to\s*\d{4}|\d{4}\s*-\s*(Present|Current)|\d{4}\s*to\s*(Present|Current)|\d{4})/i);
                    if (yearMatch) {
                      duration = yearMatch[0];
                      
                      // If year was found in institution or degree line, clean it up
                      if (line === institution) {
                        institution = institution.replace(yearMatch[0], '').trim();
                        if (institution.endsWith(',')) {
                          institution = institution.slice(0, -1).trim();
                        }
                      } else if (line === degree) {
                        degree = degree.replace(yearMatch[0], '').trim();
                        if (degree.endsWith(',')) {
                          degree = degree.slice(0, -1).trim();
                        }
                      }
                      
                      // Check if the line also contains location information
                      const locationMatch = line.replace(yearMatch[0], '').trim();
                      if (locationMatch && locationMatch !== institution && locationMatch !== degree) {
                        location = locationMatch;
                      }
                      
                      break;
                    }
                  }
                  
                  // Look for location patterns if not found yet
                  if (!location) {
                    for (const line of lines) {
                      // Common location patterns: City, State or City, Country
                      if (/^[A-Z][a-z]+,\s*[A-Z]{2}$|^[A-Z][a-z]+,\s*[A-Z][a-z]+$/.test(line) && 
                          line !== institution && line !== degree) {
                        location = line;
                        break;
                      }
                    }
                  }
                  
                  // Extract description from remaining lines
                  const description = lines.slice(2)
                    .filter(l => l !== duration && l !== location)
                    .join('\n');
                  
                  return {
                    degree,
                    institution,
                    duration,
                    location,
                    description,
                  };
                });
              } else if (section === 'languages') {
                // Enhanced language parsing with better pattern recognition
                const langItems = [];
                
                // Process each line to extract languages
                for (const line of buffer) {
                  // Remove bullet points if present
                  const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
                  
                  if (!cleanLine) continue;
                  
                  // Check if line contains multiple languages separated by commas
                  if (cleanLine.includes(',')) {
                    const parts = cleanLine.split(',').map(p => p.trim()).filter(Boolean);
                    for (const part of parts) {
                      const langObj = parseLanguage(part);
                      if (langObj) langItems.push(langObj);
                    }
                  } else {
                    // Single language on this line
                    const langObj = parseLanguage(cleanLine);
                    if (langObj) langItems.push(langObj);
                  }
                }
                
                sections.languages = langItems;
                
                // Helper function to parse a single language entry
                function parseLanguage(text) {
                  // Check for pattern: "Language (Level)" or "Language - Level" or "Language: Level"
                  const levelMatch = text.match(/^(.*?)\s*[\(\-:]\s*(.*?)\)?$/);
                  
                  if (levelMatch) {
                    const name = levelMatch[1].trim();
                    const level = levelMatch[2].trim();
                    return { name, level, dots: getDotCount(level) };
                  }
                  
                  // Check for pattern: "Language Level" (no separator)
                  const wordMatch = text.match(/^([A-Za-z]+)\s+(Native|Fluent|Advanced|Intermediate|Beginner|Basic|Elementary|Proficient|Conversational)$/i);
                  if (wordMatch) {
                    const name = wordMatch[1].trim();
                    const level = wordMatch[2].trim();
                    return { name, level, dots: getDotCount(level) };
                  }
                  
                  // Just a language name without level
                  return { name: text, level: '', dots: 3 };
                }
              } else if (section === 'certifications') {
                // Parse certifications
                const certItems = [];
                
                // Process each line to extract certifications
                for (const line of buffer) {
                  // Remove bullet points if present
                  const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
                  
                  if (!cleanLine) continue;
                  
                  // Check if line contains multiple certifications separated by commas
                  if (cleanLine.includes(',') && cleanLine.split(',').length <= 3) {
                    const parts = cleanLine.split(',').map(p => p.trim()).filter(Boolean);
                    // If there are only 2-3 parts, it might be "Certification, Year" format
                    if (parts.length <= 3) {
                      let name = parts[0];
                      let issuer = parts.length > 1 ? parts[1] : '';
                      let date = '';
                      
                      // Check if the second part is a year
                      if (issuer && /^\d{4}$/.test(issuer)) {
                        date = issuer;
                        issuer = parts.length > 2 ? parts[2] : '';
                      } else if (parts.length > 2) {
                        // Check if the third part is a year
                        if (/^\d{4}$/.test(parts[2])) {
                          date = parts[2];
                        }
                      }
                      
                      certItems.push({ name, issuer, date });
                    }
                  } else {
                    // Single certification on this line
                    // Try to extract date if present
                    const dateMatch = cleanLine.match(/(\d{4})/);
                    let name = cleanLine;
                    let date = '';
                    
                    if (dateMatch) {
                      date = dateMatch[0];
                      name = cleanLine.replace(dateMatch[0], '').trim();
                      // Remove trailing punctuation
                      if (/[,\-]$/.test(name)) {
                        name = name.slice(0, -1).trim();
                      }
                    }
                    
                    certItems.push({ name, issuer: '', date });
                  }
                }
                
                sections.certifications = certItems;
              } else if (section === 'projects') {
                // Parse projects
                const projectItems = [];
                let currentProject = null;
                
                // Process each line to extract projects
                for (const line of buffer) {
                  const cleanLine = line.trim();
                  
                  if (!cleanLine) continue;
                  
                  // Check if this line is a project header (not a bullet point)
                  if (!/^[-•*]/.test(cleanLine) && 
                      (cleanLine.length < 100 || /^[A-Z]/.test(cleanLine))) {
                    // Save previous project if exists
                    if (currentProject) {
                      projectItems.push(currentProject);
                    }
                    
                    // Start new project
                    currentProject = {
                      name: cleanLine,
                      description: []
                    };
                  } else if (currentProject) {
                    // Add to current project description
                    // Remove bullet points if present
                    const descLine = cleanLine.replace(/^[-•*]\s*/, '').trim();
                    if (descLine) {
                      currentProject.description.push(descLine);
                    }
                  }
                }
                
                // Add the last project
                if (currentProject) {
                  projectItems.push(currentProject);
                }
                
                // If no projects were identified with headers, treat each line as a separate project
                if (projectItems.length === 0 && buffer.length > 0) {
                  for (const line of buffer) {
                    const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
                    if (cleanLine) {
                      projectItems.push({
                        name: cleanLine,
                        description: []
                      });
                    }
                  }
                }
                
                // Format project descriptions as strings
                sections.projects = projectItems.map(project => ({
                  ...project,
                  description: project.description.join('\n')
                }));
              }
            }
            
            // Process each line to identify sections
            for (const line of lines) {
              const upper = line.toUpperCase();
              
              // Enhanced section detection with fuzzy matching
              let matchedSection = null;
              
              // Exact match in section map
              if (sectionMap[upper] || (line.endsWith(':') && sectionMap[upper.replace(':', '')])) {
                matchedSection = sectionMap[upper] || sectionMap[upper.replace(':', '')];
              } else {
                // Try fuzzy matching for section headers
                // Check if line contains any of the section keywords
                for (const [header, section] of Object.entries(sectionMap)) {
                  // Remove common formatting characters for comparison
                  const cleanLine = upper.replace(/[:\-_•]/g, '').trim();
                  const cleanHeader = header.replace(/[:\-_•]/g, '').trim();
                  
                  // Check if line starts with or contains the header
                  if (cleanLine.startsWith(cleanHeader) || 
                      (cleanLine.includes(cleanHeader) && cleanLine.length < cleanHeader.length + 10)) {
                    matchedSection = section;
                    console.log('Fuzzy matched section:', line, 'as', section);
                    break;
                  }
                }
                
                // Heuristic detection for unlabeled sections
                if (!matchedSection) {
                  // Check for experience patterns (job titles, dates)
                  if (/^\d{4}\s*-\s*\d{4}|^\d{4}\s*-\s*(Present|Current)|^[A-Z][a-z]+ at [A-Z]|^[A-Z][a-z]+ \||^Senior|^Lead|^Principal|^Director|^Manager|^Engineer|^Developer/i.test(line)) {
                    if (buffer.length > 0 && currentSection !== 'experience') {
                      // This looks like the start of an experience section
                      console.log('Heuristic detected experience section:', line);
                      pushBufferToSection(currentSection, buffer);
                      buffer = [line];
                      currentSection = 'experience';
                      continue;
                    }
                  }
                  
                  // Check for education patterns (degrees, institutions)
                  if (/Bachelor|Master|PhD|B\.S\.|M\.S\.|MBA|University|College|School of|Institute of/i.test(line) && 
                      !/experience|skill|language/i.test(line)) {
                    if (buffer.length > 0 && currentSection !== 'education') {
                      // This looks like the start of an education section
                      console.log('Heuristic detected education section:', line);
                      pushBufferToSection(currentSection, buffer);
                      buffer = [line];
                      currentSection = 'education';
                      continue;
                    }
                  }
                }
              }
              
              if (matchedSection) {
                // Save current buffer to current section
                if (currentSection && buffer.length) {
                  pushBufferToSection(currentSection, buffer);
                }
                
                // Start new section
                buffer = [];
                currentSection = matchedSection;
              } else {
                buffer.push(line);
              }
            }
            
            // Don't forget to process the last section
            if (currentSection && buffer.length) {
              pushBufferToSection(currentSection, buffer);
            }
            
            return sections;
          }
          
          // Helper function to convert language proficiency to dot count
          function getDotCount(level) {
            const lowerLevel = level.toLowerCase();
            if (['native', 'fluent', 'bilingual', 'mother tongue'].some(l => lowerLevel.includes(l))) {
              return 5;
            } else if (['advanced', 'proficient', 'very good'].some(l => lowerLevel.includes(l))) {
              return 4;
            } else if (['intermediate', 'conversational', 'good'].some(l => lowerLevel.includes(l))) {
              return 3;
            } else if (['basic', 'elementary', 'beginner'].some(l => lowerLevel.includes(l))) {
              return 2;
            } else {
              return 3; // Default
            }
          }
          // Use the parser to fill the resume fields
          const parsed = await parseResumeText(textContent);

          // Normalization function to match editor expectations
          function normalizeResumeData(data) {
            // Use contact info fallback if main fields are missing
            let name = data.name || (data.contactInfo && data.contactInfo.name) || '';
            let role = data.role || (data.contactInfo && data.contactInfo.role) || '';
            const phone = data.phone || (data.contactInfo && data.contactInfo.phone) || '';
            const location = data.location || (data.contactInfo && data.contactInfo.location) || '';
            
            // Ensure name is properly capitalized
            if (name) {
              // Only transform if it's all uppercase or all lowercase
              if (name === name.toUpperCase() || name === name.toLowerCase()) {
                name = name.split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
              }
            }
            
            // Ensure role maintains proper case (not all uppercase)
            if (role && role === role.toUpperCase()) {
              role = role.split('|').map(part => 
                part.split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')
              ).join(' | ');
            }

            // Normalize experience
            let experience = Array.isArray(data.experience) ? data.experience.map(exp => {
              if (typeof exp === 'string') {
                return {
                  title: exp,
                  companyName: '',
                  date: '',
                  companyLocation: '',
                  accomplishment: '',
                };
              }
              return {
                title: exp.title || exp.position || '',
                companyName: exp.companyName || exp.company || '',
                date: exp.date || exp.duration || '',
                companyLocation: exp.companyLocation || exp.location || '',
                accomplishment: exp.accomplishment || exp.description || '',
              };
            }) : [];

            // Normalize education
            let education = Array.isArray(data.education) ? data.education.map(edu => {
              if (typeof edu === 'string') {
                return {
                  degree: edu,
                  institution: '',
                  duration: '',
                  location: '',
                  description: '',
                };
              }
              return {
                degree: edu.degree || '',
                institution: edu.institution || edu.school || '',
                duration: edu.duration || edu.date || '',
                location: edu.location || '',
                description: edu.description || '',
              };
            }) : [];

            // Normalize skills
            let skills = [];
            if (Array.isArray(data.skills)) {
              if (data.skills.length && typeof data.skills[0] === 'string') {
                skills = [{ category: 'Skills', items: data.skills }];
              } else if (data.skills.length && data.skills[0].items) {
                skills = data.skills.map(s => ({
                  category: s.category || 'Skills',
                  items: s.items || [],
                }));
              } else {
                skills = [];
              }
            }

            // Normalize languages
            let languages = Array.isArray(data.languages) ? data.languages.map(lang => {
              if (typeof lang === 'string') {
                return {
                  name: lang,
                  level: '',
                  dots: 3,
                };
              }
              // Try to infer dots from level
              let dots = 3;
              if (lang.level) {
                const level = lang.level.toLowerCase();
                if (["native", "fluent", "bilingual", "mother tongue"].some(l => level.includes(l))) dots = 5;
                else if (["advanced", "proficient", "very good"].some(l => level.includes(l))) dots = 4;
                else if (["intermediate", "conversational", "good"].some(l => level.includes(l))) dots = 3;
                else if (["basic", "elementary", "beginner"].some(l => level.includes(l))) dots = 2;
              }
              return {
                name: lang.name || '',
                level: lang.level || '',
                dots,
              };
            }) : [];

            return {
              ...defaultResume,
              ...data,
              name,
              role,
              phone,
              location,
              experience,
              education,
              skills,
              languages,
            };
          }

          const resumeData = normalizeResumeData(parsed);
          setUploadedResume(resumeData);
          setStatusMessage('PDF resume uploaded! Content parsed into sections.');
          setMessageType('success');
          setShowEnhanceOptions(true);

          // After parsing the resume text and receiving parsedResume from the backend:
          if (parsed) {
            console.log('Parsed resume data:', parsed); // Debug log
            // Do NOT call onResumeLoad here. Only update the resume data and enable AI status if needed
            if (typeof setAIStatus === 'function') {
              setAIStatus({ isAvailable: true, message: '', isLoading: false });
            }
          }
        } catch (error) {
          console.error('Error reading PDF:', error); // Improved error logging
          setStatusMessage('Failed to read PDF. Please upload a valid PDF file.');
          setMessageType('error');
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setStatusMessage('Error reading file. Please try again.');
        setMessageType('error');
        setIsUploading(false);
      };
      reader.readAsArrayBuffer(file);
      return;
    } else {
      setStatusMessage('Only PDF files are supported.');
      setMessageType('error');
      setIsUploading(false);
      return;
    }
  };

  const handleManualEdit = () => {
    if (uploadedResume) {
      onResumeLoad(uploadedResume);
      setStatusMessage('Resume loaded for manual editing!');
      setMessageType('success');
      setShowEnhanceOptions(false);
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setStatusMessage('');
      }, 3000);
    }
  };

  const handleAIEnhance = async () => {
    if (!uploadedResume) {
      setStatusMessage('No resume to enhance. Please upload a resume first.');
      setMessageType('error');
      return;
    }

    setIsEnhancing(true);
    setStatusMessage('');

    try {
      const response = await resumeService.autoEnhanceResume(uploadedResume);
      
      // Check if we got an error response
      if (response.error) {
        setStatusMessage(response.error);
        setMessageType('error');
        setIsEnhancing(false);
        return;
      }
      
      const { enhancedResume } = response;
      onResumeLoad(enhancedResume);
      setStatusMessage('Resume enhanced and loaded successfully!');
      setMessageType('success');
      setShowEnhanceOptions(false);
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setStatusMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error enhancing resume:', error);
      
      // Check if the error response contains our custom error message
      if (error.response && error.response.data) {
        const { error: errorMessage, aiUnavailable } = error.response.data;
        setStatusMessage(errorMessage || 'Failed to enhance resume. Please try again or use manual edit.');
        
        // If it's an API key issue, provide more specific guidance
        if (aiUnavailable) {
          setStatusMessage(`${errorMessage} Please use manual edit instead.`);
        }
      } else {
        setStatusMessage('Failed to enhance resume. Please try again or use manual edit.');
      }
      
      setMessageType('error');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Upload Resume Button */}
      <div className="relative">
        <input
          type="file"
          id="resume-upload"
          accept="application/pdf"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer no-print"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <button
          className={`w-full ${isUploading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-4 rounded flex items-center justify-center no-print`}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            'Upload Resume (PDF Only)'
          )}
        </button>
      </div>

      {/* Enhance Options */}
      {showEnhanceOptions && (
        <div className="bg-white rounded-md shadow-md p-4 space-y-3">
          <h3 className="font-medium text-gray-900">Choose an Option</h3>
          <div className="flex space-x-2">
            <button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded no-print"
              onClick={handleManualEdit}
            >
              Manual Edit
            </button>
            <button
              className={`flex-1 ${isEnhancing ? 'bg-gray-500' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-2 px-4 rounded flex items-center justify-center no-print`}
              onClick={handleAIEnhance}
              disabled={isEnhancing}
            >
              {isEnhancing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enhancing...
                </>
              ) : (
                'AI Enhance'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className={`p-2 rounded ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {statusMessage}
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600 mt-2">
        <p>Upload your resume in PDF format to continue editing or enhance it with AI.</p>
        <p className="mt-1">You can only upload and download resumes in PDF format.</p>
      </div>
    </div>
  );
};

export default UploadEnhanceResume;