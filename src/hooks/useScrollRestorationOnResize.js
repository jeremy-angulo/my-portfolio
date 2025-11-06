// src/hooks/useScrollRestorationOnResize.js
import { useEffect, useState, useRef } from 'react';
import { useDebounce } from './useDebounce';

// This function checks which section is most prominently in the viewport
const getActiveSectionId = (sections) => {
  let activeId = null;
  let maxVisibility = 0;

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate how much of the section is visible
    const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    const visibility = visibleHeight / rect.height;

    if (visibility > maxVisibility) {
      maxVisibility = visibility;
      activeId = section.id;
    }
  });

  return activeId;
};


const useScrollRestorationOnResize = () => {
  const [isResizing, setIsResizing] = useState(false);
  // A ref to store the ID of the section that was active before resizing started
  const activeSectionId = useRef(null);
  
  const debouncedIsResizing = useDebounce(isResizing, 300); // 300ms debounce delay

  useEffect(() => {
    let resizeStartTimeout = null;
    
    const handleResizeStart = () => {
      // Set a timeout to mark the start of resizing. This helps differentiate
      // a real resize from other minor layout shifts.
      clearTimeout(resizeStartTimeout);
      resizeStartTimeout = setTimeout(() => {
        const sections = document.querySelectorAll('section[id]');
        if (sections.length) {
          // Before we start, find and store the ID of the current section
          activeSectionId.current = getActiveSectionId(sections);
        }
        setIsResizing(true);
      }, 100);
    };

    const handleResizeEnd = () => {
      clearTimeout(resizeStartTimeout);
      setIsResizing(false);
    };

    window.addEventListener('resize', handleResizeStart);
    window.addEventListener('resize', handleResizeEnd);

    return () => {
      window.removeEventListener('resize', handleResizeStart);
      window.removeEventListener('resize', handleResizeEnd);
      clearTimeout(resizeStartTimeout);
    };
  }, []);

  useEffect(() => {
    // This effect runs only when resizing has officially stopped (debounced)
    if (!debouncedIsResizing && activeSectionId.current) {
      const targetSection = document.getElementById(activeSectionId.current);
      if (targetSection) {
        // Scroll back to the section that was active before the resize
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [debouncedIsResizing]);
};

export default useScrollRestorationOnResize;