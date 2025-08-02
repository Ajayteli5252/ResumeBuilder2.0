import React, { useState, useCallback, useEffect } from "react";
import Sidebar from "./Sidebar";
import AIAssistant from "./AIAssistant";
import resumeService from "../services/resumeService";
import PropTypes from "prop-types";

const Template15 = ({ aiStatus: propAIStatus, resumeData: resumeDataProp, readOnly = false, hideSidebar = false, hideBranding = false }) => {
  // Use resumeData from props if provided (for print), otherwise use state
  const [resumeData, setResumeData] = useState(resumeDataProp || {
    name: "Aditya Tiwary",
    role: "Experienced Project Manager | IT | Leadership",
    phone: "+1 541-754-3010",
    email: "help@aditya.com",
    linkedin: "linkedin.com",
    location: "New York, NY, USA",
    summary:
      "With over 12 years of experience in project management, I bring expertise in managing complex IT projects, particularly in cloud technology.",
    experience: [
      {
        title: "Senior IT Project Manager",
        companyName: "IBM",
        date: "2018 - 2023",
        companyLocation: "New York, NY, USA",
        accomplishment:
          "• Oversaw a $2M project portfolio.\n• Improved project delivery efficiency by 20%.",
      },
    ],
    education: [
      {
        degree: "Master's Degree in Computer Science",
        institution: "Massachusetts Institute of Technology",
        duration: "2012 - 2013",
        location: "Cambridge, MA, USA",
      },
    ],
    skills: [
      {
        category: "Project Management",
        items: ["Project Management", "Cost Management", "Cloud Knowledge"],
      },
    ],
    languages: [
      { name: "English", level: "Native", dots: 5 },
      { name: "Spanish", level: "Advanced", dots: 4 },
    ],
  });

  const [userId, setUserId] = useState("");
  const [aiStatus, setAIStatus] = useState({ isAvailable: true, message: '', isLoading: false });

  // Load resume from backend on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("resumeUserId");
    if (storedUserId) {
      setUserId(storedUserId);
      resumeService.getResume(storedUserId)
        .then((data) => {
          if (data && data.resumeData) {
            setResumeData(data.resumeData);
            if (data._id) {
              localStorage.setItem("resumeId", data._id);
            }
          }
        })
        .catch((err) => {
          // Optionally handle error (e.g., show notification)
        });
    }
  }, []);

  // Save resume function for auto-save
  const saveResume = async (userIdParam, resumeDataParam) => {
    try {
      await resumeService.saveResume(userIdParam, resumeDataParam);
    } catch (error) {
      // Optionally handle error
    }
  };

  // Expanded section visibility settings
  const [sectionSettings, setSectionSettings] = useState({
    header: {
      showPhone: true,
      showEmail: true,
      showLink: true,
      showLocation: true,
      uppercaseName: true, // Set to true to match the uploaded image
    },
    summary: { showSummary: true },
    experience: { showExperience: true },
    education: { showEducation: true },
    skills: { showSkills: true },
    languages: { showLanguages: true },
  });

  // State for section order, active section, color, and branding
  const [sectionsOrder, setSectionsOrder] = useState([
    "summary",
    "skills",
    "experience",
    "education",
    "languages",
  ]);
  const [activeSection, setActiveSection] = useState(null);
  const [activeColor, setActiveColor] = useState("#1e40af");
  const [branding, setBranding] = useState(true);

  // Render specific sections
  const renderSection = useCallback(
    (sectionName) => {
      switch (sectionName) {
        case "summary":
          return (
            sectionSettings.summary.showSummary && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: activeColor }}
                  >
                    Professional Summary
                  </h2>
                  <div className="flex space-x-2">
                    <AIAssistant 
                      section="summary" 
                      inputText={resumeData.summary}
                      onEnhancedText={(enhancedText) => {
                        setResumeData((prev) => ({
                          ...prev,
                          summary: enhancedText,
                        }));
                      }}
                      saveResume={saveResume}
                      userId={userId}
                      resumeData={resumeData}
                      aiStatus={aiStatus}
                      setAIStatus={setAIStatus}
                      className="print:hidden"
                    />
                    <button
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition-colors no-print"
                      onClick={() => {
                        // Reset summary to default text if user wants to start fresh
                        setResumeData((prev) => ({
                          ...prev,
                          summary: "Write a professional summary highlighting your key qualifications and career objectives.",
                        }));
                      }}
                    >
                      Reset Summary
                    </button>
                  </div>
                </div>
                <div className="relative group">
                  <p
                    className="text-gray-700 p-2 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      setResumeData((prev) => ({
                        ...prev,
                        summary: e.currentTarget.textContent,
                      }));
                    }}
                  >
                    {resumeData.summary}
                  </p>
                </div>
              </div>
            )
          );
        case "experience":
          return (
            sectionSettings.experience.showExperience && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: activeColor }}
                  >
                    Work Experience
                  </h2>
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition-colors no-print"
                    onClick={() => {
                      const newExperience = {
                        title: "Job Title",
                        companyName: "Company Name",
                        date: "Start - End Date",
                        companyLocation: "Location",
                        accomplishment: "• Key accomplishment\n• Another achievement",
                      };
                      setResumeData((prev) => ({
                        ...prev,
                        experience: [...prev.experience, newExperience],
                      }));
                    }}
                  >
                    + Add Experience
                  </button>
                </div>
                {(resumeData.experience || []).map((exp, index) => (
                  <div key={index} className="mb-4 relative group">
                    <button
                      className="absolute right-0 top-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity no-print"
                      onClick={() => {
                        const updatedExperience = [...resumeData.experience];
                        updatedExperience.splice(index, 1);
                        setResumeData((prev) => ({
                          ...prev,
                          experience: updatedExperience,
                        }));
                      }}
                    >
                      ×
                    </button>
                    <div className="flex flex-col md:flex-row md:justify-between">
                      <h3
                        className="font-bold p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedExperience = [...resumeData.experience];
                          updatedExperience[index] = {
                            ...updatedExperience[index],
                            title: e.currentTarget.textContent,
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            experience: updatedExperience,
                          }));
                        }}
                      >
                        {exp.title}
                      </h3>
                      <span
                        className="text-gray-600 p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedExperience = [...resumeData.experience];
                          updatedExperience[index] = {
                            ...updatedExperience[index],
                            date: e.currentTarget.textContent,
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            experience: updatedExperience,
                          }));
                        }}
                      >
                        {exp.date}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between">
                      <h4
                        className="font-medium text-gray-700 p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedExperience = [...resumeData.experience];
                          updatedExperience[index] = {
                            ...updatedExperience[index],
                            companyName: e.currentTarget.textContent,
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            experience: updatedExperience,
                          }));
                        }}
                      >
                        {exp.companyName}
                      </h4>
                      <span
                        className="text-gray-600 p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedExperience = [...resumeData.experience];
                          updatedExperience[index] = {
                            ...updatedExperience[index],
                            companyLocation: e.currentTarget.textContent,
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            experience: updatedExperience,
                          }));
                        }}
                      >
                        {exp.companyLocation}
                      </span>
                    </div>
                    <div className="relative">
                      <p
                        className="mt-2 text-gray-700 whitespace-pre-line p-2 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedExperience = [...resumeData.experience];
                          updatedExperience[index] = {
                            ...updatedExperience[index],
                            accomplishment: e.currentTarget.textContent,
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            experience: updatedExperience,
                          }));
                        }}
                      >
                        {exp.accomplishment}
                      </p>
                      <div className="absolute top-2 right-2 print:hidden">
                        <AIAssistant 
                          section="experience" 
                          inputText={exp.accomplishment}
                          buttonText="Enhance"
                          onEnhancedText={(enhancedText) => {
                            const updatedExperience = [...resumeData.experience];
                            updatedExperience[index] = {
                              ...updatedExperience[index],
                              accomplishment: enhancedText,
                            };
                            setResumeData((prev) => ({
                              ...prev,
                              experience: updatedExperience,
                            }));
                          }}
                          saveResume={saveResume}
                          userId={userId}
                          resumeData={resumeData}
                          aiStatus={aiStatus}
                          setAIStatus={setAIStatus}
                          className="print:hidden"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          );
        case "education":
          return (
            sectionSettings.education.showEducation && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: activeColor }}
                  >
                    Education
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition-colors no-print"
                      onClick={() => {
                        const newEducation = {
                          degree: "Degree/Certificate",
                          institution: "Institution Name",
                          duration: "Start - End Date",
                          location: "Location",
                          description: "Add your educational achievements, relevant coursework, or thesis details here."
                        };
                        setResumeData((prev) => ({
                          ...prev,
                          education: [...prev.education, newEducation],
                        }));
                      }}
                    >
                      + Add Education
                    </button>
                  </div>
                </div>
                {(resumeData.education || []).map((edu, index) => (
                  <div key={index} className="mb-3 relative group">
                    <button
                      className="absolute right-0 top-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity no-print"
                      onClick={() => {
                        const updatedEducation = [...resumeData.education];
                        updatedEducation.splice(index, 1);
                        setResumeData((prev) => ({
                          ...prev,
                          education: updatedEducation,
                        }));
                      }}
                    >
                      ×
                    </button>
                    <div className="flex flex-col md:flex-row md:justify-between">
                      <h3
                        className="font-bold p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedEducation = [...resumeData.education];
                          updatedEducation[index] = {
                            ...updatedEducation[index],
                            degree: e.currentTarget.textContent,
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            education: updatedEducation,
                          }));
                        }}
                      >
                        {edu.degree}
                      </h3>
                      <span
                        className="text-gray-600 p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedEducation = [...resumeData.education];
                          updatedEducation[index] = {
                            ...updatedEducation[index],
                            duration: e.currentTarget.textContent,
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            education: updatedEducation,
                          }));
                        }}
                      >
                        {edu.duration}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between">
                      <h4
                        className="font-medium text-gray-700 p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedEducation = [...resumeData.education];
                          updatedEducation[index] = {
                            ...updatedEducation[index],
                            institution: e.currentTarget.textContent,
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            education: updatedEducation,
                          }));
                        }}
                      >
                        {edu.institution}
                      </h4>
                      <span
                        className="text-gray-600 p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedEducation = [...resumeData.education];
                          updatedEducation[index] = {
                            ...updatedEducation[index],
                            location: e.currentTarget.textContent,
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            education: updatedEducation,
                          }));
                        }}
                      >
                        {edu.location}
                      </span>
                    </div>
                    <div className="relative mt-2">
                      <p
                        className="text-gray-700 whitespace-pre-line p-2 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedEducation = [...resumeData.education];
                          updatedEducation[index] = {
                            ...updatedEducation[index],
                            description: e.currentTarget.textContent,
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            education: updatedEducation,
                          }));
                        }}
                      >
                        {edu.description || "Add your educational achievements, relevant coursework, or thesis details here."}
                      </p>
                      <div className="absolute top-2 right-2 print:hidden">
                        <AIAssistant 
                          section="education" 
                          inputText={edu.description || "Add your educational achievements, relevant coursework, or thesis details here."}
                          buttonText="Enhance"
                          onEnhancedText={(enhancedText) => {
                            const updatedEducation = [...resumeData.education];
                            updatedEducation[index] = {
                              ...updatedEducation[index],
                              description: enhancedText,
                            };
                            setResumeData((prev) => ({
                              ...prev,
                              education: updatedEducation,
                            }));
                          }}
                          saveResume={saveResume}
                          userId={userId}
                          resumeData={resumeData}
                          aiStatus={aiStatus}
                          setAIStatus={setAIStatus}
                          className="print:hidden"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          );
        case "skills":
          return (
            sectionSettings.skills.showSkills && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: activeColor }}
                  >
                    Skills
                  </h2>
                  <div className="flex space-x-2">
                    <AIAssistant 
                      section="skills" 
                      inputText={JSON.stringify(resumeData.skills)}
                      buttonText="Enhance Skills"
                      onEnhancedText={(enhancedText) => {
                        try {
                          const enhancedSkills = JSON.parse(enhancedText);
                          setResumeData((prev) => ({
                            ...prev,
                            skills: enhancedSkills,
                          }));
                        } catch (error) {
                          console.error("Failed to parse enhanced skills", error);
                        }
                      }}
                      saveResume={saveResume}
                      userId={userId}
                      resumeData={resumeData}
                      aiStatus={aiStatus}
                      setAIStatus={setAIStatus}
                      className="print:hidden"
                    />
                    <button
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition-colors no-print"
                      onClick={() => {
                        setResumeData((prev) => ({
                          ...prev,
                          skills: [...prev.skills, { category: "New Category", items: ["New Skill"] }],
                        }));
                      }}
                    >
                      + Add Skill
                    </button>
                  </div>
                </div>
                {(resumeData.skills || []).map((skillGroup, groupIndex) => (
                  <div key={groupIndex} className="mb-4 relative group">
                    <div className="flex justify-between items-center mb-2">
                      <h3 
                        className="font-bold text-gray-800 p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedSkills = [...resumeData.skills];
                          updatedSkills[groupIndex] = {
                            ...updatedSkills[groupIndex],
                            category: e.currentTarget.textContent
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            skills: updatedSkills,
                          }));
                        }}
                      >
                        {skillGroup.category}
                      </h3>
                      <button
                        className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity no-print"
                        onClick={() => {
                          const updatedSkills = [...resumeData.skills];
                          updatedSkills.splice(groupIndex, 1);
                          setResumeData((prev) => ({
                            ...prev,
                            skills: updatedSkills,
                          }));
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-2">
                      {(skillGroup.items || []).map((item, itemIndex) => (
                        <div key={itemIndex} className="relative group">
                          <span
                            className="bg-gray-200 rounded-full px-3 py-1 text-sm font-medium text-gray-700 p-1 border border-transparent hover:border-gray-300 focus:outline-none focus:border-gray-400 inline-block"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const updatedSkills = [...resumeData.skills];
                              const updatedItems = [...updatedSkills[groupIndex].items];
                              updatedItems[itemIndex] = e.currentTarget.textContent;
                              updatedSkills[groupIndex] = {
                                ...updatedSkills[groupIndex],
                                items: updatedItems
                              };
                              setResumeData((prev) => ({
                                ...prev,
                                skills: updatedSkills,
                              }));
                            }}
                          >
                            {item}
                          </span>
                          <button
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity no-print"
                            onClick={() => {
                              const updatedSkills = [...resumeData.skills];
                              const updatedItems = [...updatedSkills[groupIndex].items];
                              updatedItems.splice(itemIndex, 1);
                              updatedSkills[groupIndex] = {
                                ...updatedSkills[groupIndex],
                                items: updatedItems
                              };
                              setResumeData((prev) => ({
                                ...prev,
                                skills: updatedSkills,
                              }));
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        className="bg-gray-300 hover:bg-gray-400 rounded-full px-2 text-sm font-medium text-gray-700 no-print"
                        onClick={() => {
                          const updatedSkills = [...resumeData.skills];
                          updatedSkills[groupIndex] = {
                            ...updatedSkills[groupIndex],
                            items: [...updatedSkills[groupIndex].items, "New Skill"]
                          };
                          setResumeData((prev) => ({
                            ...prev,
                            skills: updatedSkills,
                          }));
                        }}
                      >
                        + Add Skill
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          );
        case "languages":
          return (
            sectionSettings.languages.showLanguages && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: activeColor }}
                  >
                    Languages
                  </h2>
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition-colors no-print"
                    onClick={() => {
                      const newLanguage = {
                        name: "Language",
                        level: "Intermediate",
                        dots: 3,
                      };
                      setResumeData((prev) => ({
                        ...prev,
                        languages: [...prev.languages, newLanguage],
                      }));
                    }}
                  >
                    + Add Language
                  </button>
                </div>
                {(resumeData.languages || []).map((language, index) => (
                  <div key={index} className="mb-2 flex items-center relative group">
                    <span
                      className="font-medium w-24 p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const updatedLanguages = [...resumeData.languages];
                        updatedLanguages[index] = {
                          ...updatedLanguages[index],
                          name: e.currentTarget.textContent,
                        };
                        setResumeData((prev) => ({
                          ...prev,
                          languages: updatedLanguages,
                        }));
                      }}
                    >
                      {language.name}
                    </span>
                    <div className="flex ml-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full mx-1 ${
                            i < language.dots ? "bg-gray-700" : "bg-gray-300"
                          } cursor-pointer`}
                          onClick={() => {
                            const updatedLanguages = [...resumeData.languages];
                            updatedLanguages[index] = {
                              ...updatedLanguages[index],
                              dots: i + 1,
                              level:
                                i === 0
                                  ? "Beginner"
                                  : i === 1
                                    ? "Elementary"
                                    : i === 2
                                      ? "Intermediate"
                                      : i === 3
                                        ? "Advanced"
                                        : "Native",
                            };
                            setResumeData((prev) => ({
                              ...prev,
                              languages: updatedLanguages,
                            }));
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="ml-2 text-gray-600 text-sm p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const updatedLanguages = [...resumeData.languages];
                        updatedLanguages[index] = {
                          ...updatedLanguages[index],
                          level: e.currentTarget.textContent,
                        };
                        setResumeData((prev) => ({
                          ...prev,
                          languages: updatedLanguages,
                        }));
                      }}
                    >
                      {language.level}
                    </span>
                    <button
                      className="absolute right-0 top-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity no-print"
                      onClick={() => {
                        const updatedLanguages = [...resumeData.languages];
                        updatedLanguages.splice(index, 1);
                        setResumeData((prev) => ({
                          ...prev,
                          languages: updatedLanguages,
                        }));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )
          );
        default:
          return null;
      }
    },
    [resumeData, sectionSettings, activeColor, userId, aiStatus]
  );

  // Function to handle section click from sidebar
  const handleSectionClick = (section) => {
    setActiveSection(section);
    // Scroll to the section
    const sectionElement = document.getElementById(`section-${section}`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
      // Add a highlight effect
      sectionElement.classList.add('section-highlight');
      setTimeout(() => {
        sectionElement.classList.remove('section-highlight');
      }, 1500);
    }
  };

  // State for mobile sidebar visibility
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setShowMobileSidebar(prev => !prev);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      {/* Mobile menu button */}
      {!readOnly && !hideSidebar && (
        <button 
          className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg"
          onClick={toggleMobileSidebar}
        >
          {showMobileSidebar ? '✕' : '☰'}
        </button>
      )}

      {/* Sidebar for navigation and controls - hidden on mobile by default */}
      {!readOnly && !hideSidebar && (
        <div className={`${showMobileSidebar ? 'block' : 'hidden'} md:block fixed md:static z-40 h-full`}>
          <Sidebar
            setActiveSection={handleSectionClick}
            branding={branding}
            handleBrandingToggle={() => setBranding((prev) => !prev)}
            resumeData={resumeData}
            setResumeData={setResumeData}
          />
        </div>
      )}

      <div className="flex-1 p-4 md:p-8 md:ml-64 ml-0">
        <div id="resume-content" className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg p-8">
          {/* Header Section */}
          <div className="mb-6 border-b pb-6" style={{ borderColor: activeColor }}>
            <h1
              className={`text-4xl font-bold p-1 border border-transparent rounded focus:outline-none focus:border-gray-400 ${sectionSettings.header.uppercaseName ? 'uppercase' : ''}`}
              style={{ color: '#1e40af' }} /* Blue color for name to match the uploaded image */
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                // Preserve case when editing name
                setResumeData((prev) => ({
                  ...prev,
                  name: e.currentTarget.textContent,
                }));
              }}
            >
              {resumeData.name}
            </h1>
            <div
              className="text-gray-600 mt-1 p-1 border border-transparent rounded focus:outline-none focus:border-gray-400"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                // Preserve case when editing role
                setResumeData((prev) => ({
                  ...prev,
                  role: e.currentTarget.textContent,
                }));
              }}
            >
              {resumeData.role}
            </div>
            <div className="flex flex-wrap items-center mt-3 text-sm gap-2">
              {sectionSettings.header.showPhone && (
                <div className="flex items-center gap-1 text-gray-700">
                  <span role="img" aria-label="Phone" className="text-gray-400">📞</span>
                  <span
                    className="p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      setResumeData((prev) => ({
                        ...prev,
                        phone: e.currentTarget.textContent,
                      }));
                    }}
                  >
                    {resumeData.phone}
                  </span>
                </div>
              )}
              {sectionSettings.header.showEmail && (
                <div className="flex items-center gap-1 text-gray-700">
                  <span role="img" aria-label="Email" className="text-gray-400">✉️</span>
                  <span
                    className="p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      setResumeData((prev) => ({
                        ...prev,
                        email: e.currentTarget.textContent,
                      }));
                    }}
                  >
                    {resumeData.email}
                  </span>
                </div>
              )}
              {sectionSettings.header.showLink && (
                <div className="flex items-center gap-1 text-gray-700">
                  <span role="img" aria-label="LinkedIn" className="text-gray-400">🔗</span>
                  <span
                    className="p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      setResumeData((prev) => ({
                        ...prev,
                        linkedin: e.currentTarget.textContent,
                      }));
                    }}
                  >
                    {resumeData.linkedin}
                  </span>
                </div>
              )}
              {sectionSettings.header.showLocation && (
                <div className="flex items-center gap-1 text-gray-700">
                  <span role="img" aria-label="Location" className="text-gray-400">📍</span>
                  <span
                    className="p-1 border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-gray-400"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      setResumeData((prev) => ({
                        ...prev,
                        location: e.currentTarget.textContent,
                      }));
                    }}
                  >
                    {resumeData.location}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Render sections dynamically based on order */}
          {sectionsOrder.map((section) => (
            <div key={section} id={`section-${section}`} className="transition-all duration-300">
              {readOnly ? (
                // Render plain text for print mode
                <>
                  {section === 'summary' && sectionSettings.summary.showSummary && (
                    <div className="mb-6">
                      <h2 className="text-xl font-bold" style={{ color: activeColor }}>Professional Summary</h2>
                      <div className="text-gray-700 p-2 whitespace-pre-line">{resumeData.summary}</div>
                    </div>
                  )}
                  {section === 'skills' && sectionSettings.skills.showSkills && (
                    <div className="mb-6">
                      <h2 className="text-xl font-bold" style={{ color: activeColor }}>Skills</h2>
                      {resumeData.skills && resumeData.skills.map((group, idx) => (
                        <div key={idx} className="mb-2">
                          <div className="font-semibold">{group.category}</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {group.items && group.items.map((item, i) => (
                              <span key={i} className="inline-block bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm">{item}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {section === 'experience' && sectionSettings.experience.showExperience && (
                    <div className="mb-6">
                      <h2 className="text-xl font-bold" style={{ color: activeColor }}>Work Experience</h2>
                      {resumeData.experience && resumeData.experience.map((exp, idx) => (
                        <div key={idx} className="mb-4">
                          <div className="flex flex-col md:flex-row md:justify-between">
                            <h3 className="font-bold">{exp.title}</h3>
                            <span className="text-gray-600">{exp.date}</span>
                          </div>
                          <div className="flex flex-col md:flex-row md:justify-between">
                            <h4 className="font-medium text-gray-700">{exp.companyName}</h4>
                            <span className="text-gray-600">{exp.companyLocation}</span>
                          </div>
                          <div className="mt-2 text-gray-700 whitespace-pre-line">{exp.accomplishment}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {section === 'education' && sectionSettings.education.showEducation && (
                    <div className="mb-6">
                      <h2 className="text-xl font-bold" style={{ color: activeColor }}>Education</h2>
                      {resumeData.education && resumeData.education.map((edu, idx) => (
                        <div key={idx} className="mb-3">
                          <div className="flex flex-col md:flex-row md:justify-between">
                            <h3 className="font-bold">{edu.degree}</h3>
                            <span className="text-gray-600">{edu.duration}</span>
                          </div>
                          <div className="flex flex-col md:flex-row md:justify-between">
                            <span className="font-medium text-gray-700">{edu.institution}</span>
                            <span className="text-gray-600">{edu.location}</span>
                          </div>
                          {edu.description && <div className="mt-2 text-gray-700 whitespace-pre-line">{edu.description}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {section === 'languages' && sectionSettings.languages.showLanguages && (
                    <div className="mb-6">
                      <h2 className="text-xl font-bold" style={{ color: activeColor }}>Languages</h2>
                      <div className="flex flex-wrap gap-4">
                        {resumeData.languages && resumeData.languages.map((lang, idx) => (
                          <div key={idx} className="text-gray-700">
                            {lang.name} {lang.level && <span className="text-gray-500">({lang.level})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                renderSection(section)
              )}
            </div>
          ))}

          {/* Branding */}
          {branding && !hideBranding && (
            <div className="mt-10 text-center text-sm text-gray-400 no-print">
              Developed by <span className="text-black font-semibold">Aditya</span> for{" "}
              <span className="text-indigo-400">Uptoskills AI Resume Builder</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Template15.propTypes = {
  aiStatus: PropTypes.shape({
    isAvailable: PropTypes.bool,
    message: PropTypes.string,
    isLoading: PropTypes.bool
  }),
  resumeData: PropTypes.object,
  readOnly: PropTypes.bool,
  hideSidebar: PropTypes.bool,
  hideBranding: PropTypes.bool
};

export default Template15;