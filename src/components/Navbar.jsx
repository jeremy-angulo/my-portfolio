// src/components/Navbar.jsx

import React from "react";
// Import Link and useLocation from react-router-dom
import { Link, useLocation } from "react-router-dom";
import { styles } from "../styles";
import { logo } from "../assets";
import "./Navbar.scss";

const Navbar = () => {
  const location = useLocation();
  // Check if the current path is the resume page
  const isResumePage = location.pathname === '/resume';

  // No need for the scroll-related state anymore if we want the navbar consistent
  
  return (
    <nav
      className={`${styles.paddingX} w-full flex items-center py-3 fixed top-0 z-20 bg-primary`}
    >
      <div className='w-full flex justify-between items-center max-w mx-auto'>
        <Link
          to='/'
          className='flex items-center gap-2'
          onClick={() => { window.scrollTo(0, 0); }}
        >
          <img src={logo} alt='logo' className='w-9 h-9 object-contain logo' />
          <p className='sm:block text-white text-[18px] font-bold cursor-pointer flex '>
            jeremy.angulo
          </p>
        </Link>

        <div className='sm:flex'>
          {/* --- THIS IS THE DYNAMIC PART --- */}
          {isResumePage ? (
            // If on the resume page, show a "Go back" link
            <Link 
              to="/"
              className="text-white border border-white rounded-full px-4 py-2 text-[15px] font-medium cursor-pointer hover:bg-white hover:text-primary transition-colors duration-300"
            >
              Go back
            </Link>
          ) : (
            // Otherwise, show the "Open Resume" link
            <Link 
              to="/resume"
              // REMOVED target="_blank" to open in the same tab
              className="text-white border border-white rounded-full px-4 py-2 text-[15px] font-medium cursor-pointer hover:bg-white hover:text-primary transition-colors duration-300"
            >
              Open Resume
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar;