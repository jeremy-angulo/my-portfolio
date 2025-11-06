// src/components/ResumePage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';
import { SectionWrapper } from '../hoc';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import './ResumePage.scss';

const ResumePage = () => {
  const isMobile = useIsMobile(); 

  const pdfPath = "/Jeremy_Angulo_Resume.pdf";
  const fullPdfUrl = `https://jeremyangulo.fr${pdfPath}`;
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fullPdfUrl)}&embedded=true`;

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
       {isMobile ? (
          // --- MOBILE FALLBACK ---
          // Use an iframe with Google Docs Viewer for maximum compatibility
          <iframe
            src={googleViewerUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Resume Viewer"
          ></iframe>
        ) : (
          // --- DESKTOP VERSION ---
          // Use the <object> tag with the special #view=Fit parameter
          <object
            data={`${pdfPath}#view=Fit`}
            type="application/pdf"
            width="1300px"
            height="100%"
            style={{ margin: "0 auto" }}
          >
            <p>
              Your browser doesn't support embedding PDFs.
            </p>
          </object>
        )}
      </div>
    </div>
  );
};

// We wrap it in SectionWrapper to maintain consistent padding and layout
export default SectionWrapper(ResumePage, "resume-page");