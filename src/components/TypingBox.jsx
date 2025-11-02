// src/components/TypingBox.jsx

import React, { useEffect, useRef } from 'react';
import { init } from 'ityped';
import './TypingBox.scss';

const TypingBox = ({ lines }) => {
  const lineRefs = useRef([]);
  const instancesRef = useRef([]);
  // This ref will act as our guard. It will be true when mounted, false when unmounted.
  const isMounted = useRef(true);

  useEffect(() => {
    // When the effect runs, we set our guard to true.
    isMounted.current = true;

    if (!lines || lines.length === 0) {
      return;
    }

    const typeLine = (index) => {
      // If the component is unmounted or we're done, stop immediately.
      if (!isMounted.current || index >= lines.length) {
        return;
      }

      const element = lineRefs.current[index];
      if (element) {
        element.innerHTML = '';

        const instance = init(element, {
          strings: [lines[index]],
          typeSpeed: 10,
          showCursor: false,
          disableBackTyping: true,
          onFinished: () => {
            // Before starting the next line, check if we are still mounted.
            if (!isMounted.current) return;
            typeLine(index + 1);
          },
        });
        instancesRef.current.push(instance);
      }
    };

    typeLine(0);

    // This is the cleanup function.
    return () => {
      // First, set the guard to false. This will stop any pending onFinished callbacks.
      isMounted.current = false;
      
      // Then, safely destroy all instances that were created.
      instancesRef.current.forEach(instance => {
        // Add an extra safety check in case an undefined value somehow got in.
        if (instance) {
          instance.destroy();
        }
      });
      instancesRef.current = [];
    };
  }, [lines]);

  return (
    <div className="value-prop-box border border-[#915EFF] p-6 rounded-2xl max-w-3xl w-full h-[13.5rem]">
      <p className="text-[#FFFFFF] text-lg leading-relaxed text-left">
        {lines.map((line, index) => (
          <span
            key={index}
            ref={el => (lineRefs.current[index] = el)}
            className="block"
            style={{ 
              fontWeight: '250', 
              fontSize: '1.4rem',
              marginTop: index > 0 ? '1rem' : '0' 
            }}
          ></span>
        ))}
      </p>
    </div>
  );
};

export default TypingBox;