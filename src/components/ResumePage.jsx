// src/components/ResumePage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { SectionWrapper } from '../hoc';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import './ResumePage.scss';

const ResumePage = () => {
  // Construct the full path to the PDF including the base path
  const pdfPath = "/my-portfolio/Jeremy_Angulo_Resume.pdf";

  return (
    <div className="resume-container">
      <div className="resume-header">
        <div className="flex items-center gap-5">
          <Link 
            to="/" 
            className="text-white text-3xl hover:text-[#915EFF] transition-colors duration-300"
            aria-label="Return to Home" // Good for accessibility
          >
            <FaArrowLeft />
          </Link>
          <h1>My Resume</h1>
        </div>
        
        <a 
          href={pdfPath} 
          download="Jeremy_Angulo_Resume.pdf" // The 'download' attribute forces download on this specific link
          className="download-button"
        >
          <FaDownload /> Download
        </a>
      </div>
      <div className="pdf-viewer">
        <object
          data={pdfPath}
          type="application/pdf"
          width="100%"
          height="100%"
        >
          {/* Fallback content if the PDF cannot be displayed */}
          <p>
            It seems your browser doesn't support embedding PDFs. 
            You can <a href={pdfPath} download="Jeremy_Angulo_Resume.pdf">download the resume directly</a> instead.
          </p>
        </object>
      </div>
    </div>
  );
};

// We wrap it in SectionWrapper to maintain consistent padding and layout
export default SectionWrapper(ResumePage, "resume-page");