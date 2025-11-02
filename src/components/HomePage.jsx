// src/components/HomePage.jsx

import { Contact, Profile, Achievement, Experience, Education, Hero, Navbar, Tech, Project, StarsCanvas, Content, Footer } from ".";

const HomePage = () => {
  return (
    <>
      <div className='bg-hero-pattern bg-cover bg-no-repeat bg-center'>
        <Navbar />
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
        <StarsCanvas />
      </div>
      <Footer/>
    </>
  );
}

export default HomePage;