import {ReactTyped} from "react-typed";
import { motion } from "framer-motion";
import { styles } from "../styles";
import React, { useEffect, useRef } from "react";
import { AiOutlineGithub } from "react-icons/ai";
import { ImLinkedin } from "react-icons/im";
import { jeremy } from "../assets";
import "./Hero.scss";
import TypingBox from "./TypingBox";

const Hero = () => {
  const textRef = useRef();

  const introLine = "I am an IT Engineer specializing in bridging the gap between complex technical projects and strategic business goals.<br/><br/>My passion is to lead teams and transform innovative ideas into concrete, high-impact digital solutions.";
  
  const handleScrollToProjects = () => {
    const projectSection = document.getElementById('project');
    if (projectSection) {
      projectSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={`relative w-full h-screen min-h-[660px] mx-auto`}>
      <div className="flex">
        <div
          className={`head1 absolute  max-w-9xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5`}
        >

          {/* --- SCROLL INDICATOR IS NOW INTEGRATED HERE --- */}
          <div className="relative flex flex-col justify-center items-center mt-5">
            <motion.div 
              className="w-5 h-5 rounded-full bg-[#915EFF]" 
              animate={{y: [0, 100, 0] }}
              transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "loop",
                  repeatDelay: 3,
                  bounce: 0.8,
                  velocity: 20,
                }}
            />
            <div className="w-1 h-40 sm:h-80 violet-gradient" />
          </div>

          <div className="head2">
            <h1 className={`${styles.heroHeadText} text-white`}>
              Hi there, I'm{" "}
              <p className="name text-[#915EFF]">Jérémy Angulo</p>
            </h1>
            <h3>
              {/* The old <span> is replaced with this self-contained component */}
              <ReactTyped
                strings={["Business Analyst", "IT Consultant"]}
                typeSpeed={60}
                backSpeed={60}
                backDelay={1500}
                loop
                className={`${styles.heroSubText} mt-2 green-text-gradient`}
              />
            </h3>

            <div className="absolute link1">
              <a href="https://github.com/jeremy-angulo" target="_blank">
                <AiOutlineGithub />
              </a>
              <a
                href="https://www.linkedin.com/in/jeremyangulo/"
                target="_blank"
              >
                <ImLinkedin />
              </a>
            </div>
          </div>
        </div>
        <div className="imgcontainer1 absolute violet-gradient">
          <img src={jeremy} alt="" className="object-contain" />
        </div>
      </div>
  
      {/* Below the previous div */}
      <div className="w-full flex flex-col items-center justify-center px-4 mt-[400px] sm:mt-[450px] md:mt-[450px] lg:mt-[400px]">
        {/* Render the self-contained component */}
        <TypingBox line={introLine} />
      </div>

    </section>
  );
};

export default Hero;
