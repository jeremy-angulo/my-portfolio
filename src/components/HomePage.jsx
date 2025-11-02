// src/components/HomePage.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Contact, Profile, Achievement, Experience, Education, Hero, Navbar, Tech, Project, StarsCanvas, Content, Footer } from ".";

const HomePage = () => {
  const location = useLocation();

  useEffect(() => {
    // This effect runs whenever the 'location' object changes (i.e., on navigation)
    if (location.hash) {
      // If there's a hash in the URL (e.g., "#project")
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        // If the element is found, scroll to it smoothly
        element.scrollIntoView({ behavior: 'smooth' });
      }
      else {
        // If the element is not found, scroll to top as a fallback
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]); // The dependency array ensures this runs on every route change

  return (
    <>
      <div className='bg-hero-pattern bg-cover bg-no-repeat bg-center'>
        <Hero />
      </div>
      <Content />
      <Education />
      <Project />
      <Experience />
      <Achievement />
      <Profile/>
      <Tech />
      <div className='relative z-0'>
        <Contact />
      </div>
      <Footer/>
    </>
  );
}

export default HomePage;