// src/components/TypingBox.jsx

import React from 'react';
import { ReactTyped } from 'react-typed';
import './TypingBox.scss';

const TypingBox = ({ line }) => {
  return (
    // 1. THE PARENT CONTAINER
    // It is 'relative' to act as an anchor for the absolute child.
    // Padding is REMOVED from here to be controlled by the children.
    <div className="relative border border-[#915EFF] rounded-2xl max-w-3xl w-full">
      
      {/* 2. THE INVISIBLE "GHOST" LAYER */}
      {/* This layer is NOT absolute. It sits in the normal layout flow. */}
      {/* 'invisible' class makes it take up space but not be seen. */}
      {/* It has the padding, which defines the final size of the box. */}
      <div className="invisible p-6">
        <p 
          style={{ fontWeight: '250', fontSize: '1.4rem' }} 
          className="text-[#FFFFFF] text-base sm:text-lg leading-relaxed text-left"
          // We need to render the HTML to calculate the correct height with line breaks
          dangerouslySetInnerHTML={{ __html: line }}
        />
      </div>

      {/* 3. THE VISIBLE "TYPING" LAYER */}
      {/* This layer IS absolute. It sits on top of the ghost layer. */}
      {/* 'inset-0' makes it fill the parent completely. */}
      {/* It has the same padding to align the text perfectly. */}
      <div className="absolute inset-0 p-6">
        <p 
          style={{ fontWeight: '250', fontSize: '1.4rem' }} 
          className="text-[#FFFFFF] text-base sm:text-lg leading-relaxed text-left"
        >
          <ReactTyped
            strings={[line]}
            typeSpeed={10}
            showCursor={true}
            // The component automatically stops and cleans up on its own.
          />
        </p>
      </div>
    </div>
  );
};

export default TypingBox;