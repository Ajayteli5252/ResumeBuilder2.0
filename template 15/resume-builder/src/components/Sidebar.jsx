import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import SaveShareResume from './SaveShareResume';
import UploadEnhanceResume from './UploadEnhanceResume';
import resumeService from '../services/resumeService';
import html2pdf from 'html2pdf.js';

const Sidebar = ({ setActiveSection, branding, handleBrandingToggle, resumeData, setResumeData }) => {
  const [currentSection, setCurrentSection] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSectionClick = (section) => {
    setCurrentSection(section);
    setActiveSection(section);
  };
  
  // PDF download using html2pdf.js
  const handleDownloadPDF = () => {
    const element = document.getElementById('resume-content');
    if (!element) {
      alert('Resume content not found!');
      return;
    }

    // Hide all .no-print elements before generating PDF
    const noPrintEls = document.querySelectorAll('.no-print');
    noPrintEls.forEach(el => el.style.display = 'none');

    const opt = {
      margin: 0,
      filename: 'resume.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // Restore .no-print elements after PDF is generated
      noPrintEls.forEach(el => el.style.display = '');
    });
  };

  // Download JSON handler
  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resumeData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${resumeData.name.replace(/\s+/g, '_') || 'resume'}_Resume.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Upload JSON handler
  const uploadJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setResumeData(json);
        alert('Resume data loaded from JSON!');
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // PDF upload handler for extracting JSON
  const handlePDFUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const json = await resumeService.extractJSON(file);
      setResumeData(json);
      alert('Resume data loaded from PDF!');
    } catch (err) {
      alert('Failed to extract data from PDF.');
    }
  };

  return (
    <div className="w-64 bg-gray-800 text-white p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Resume Builder</h2>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Sections</h3>
        <ul className="space-y-1">
          <li>
            <button 
              className={`w-full text-left px-2 py-1 rounded hover:bg-gray-700 ${currentSection === 'summary' ? 'bg-blue-600' : ''}`}
              onClick={() => handleSectionClick('summary')}
            >
              Summary
            </button>
          </li>
          <li>
            <button 
              className={`w-full text-left px-2 py-1 rounded hover:bg-gray-700 ${currentSection === 'experience' ? 'bg-blue-600' : ''}`}
              onClick={() => handleSectionClick('experience')}
            >
              Experience
            </button>
          </li>
          <li>
            <button 
              className={`w-full text-left px-2 py-1 rounded hover:bg-gray-700 ${currentSection === 'education' ? 'bg-blue-600' : ''}`}
              onClick={() => handleSectionClick('education')}
            >
              Education
            </button>
          </li>
          <li>
            <button 
              className={`w-full text-left px-2 py-1 rounded hover:bg-gray-700 ${currentSection === 'skills' ? 'bg-blue-600' : ''}`}
              onClick={() => handleSectionClick('skills')}
            >
              Skills
            </button>
          </li>
          <li>
            <button 
              className={`w-full text-left px-2 py-1 rounded hover:bg-gray-700 ${currentSection === 'languages' ? 'bg-blue-600' : ''}`}
              onClick={() => handleSectionClick('languages')}
            >
              Languages
            </button>
          </li>
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Settings</h3>
        <div className="flex items-center mb-2">
          <input 
            type="checkbox" 
            id="branding" 
            checked={branding} 
            onChange={handleBrandingToggle}
            className="mr-2"
          />
          <label htmlFor="branding">Show Branding</label>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Resume Actions</h3>
        {/* Download PDF Button */}
        <button 
          className={`w-full mb-2 ${isDownloading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-4 rounded flex items-center justify-center no-print`}
          onClick={handleDownloadPDF}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Download Resume (PDF)'
          )}
        </button>
        {/* Save & Share Resume Component */}
        <SaveShareResume resumeData={resumeData} />
        {/* Upload & Enhance Resume Component */}
        <UploadEnhanceResume onResumeLoad={(newResumeData) => setResumeData(newResumeData)} />
        {/* <div className="text-xs text-gray-400 mt-2">You can only upload and download resumes in PDF format.</div> */}
      </div>
    </div>
  );
};

export default Sidebar;