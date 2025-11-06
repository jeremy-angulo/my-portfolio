// src/hooks/useScrollRestorationOnResize.js
import { useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

const useScrollRestorationOnResize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Use the debounce hook to only get the window size after 250ms of no resizing
  const debouncedSize = useDebounce(windowSize, 250);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // This effect runs only after the debouncedSize changes
    const sections = document.querySelectorAll('section[id]');
    if (!sections.length) return;

    let closestSection = null;
    let smallestDistance = Infinity;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestSection = section;
      }
    });

    if (closestSection) {
      closestSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [debouncedSize]); // The magic happens here
};

export default useScrollRestorationOnResize;