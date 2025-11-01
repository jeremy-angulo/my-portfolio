import { motion } from "framer-motion";
import { styles } from "../styles";
import { ComputersCanvas } from "./canvas";
import { init } from "ityped";
import React, { useEffect, useRef } from "react";
import { AiOutlineGithub } from "react-icons/ai";
import { ImLinkedin } from "react-icons/im";
import { jeremy } from "../assets";
import "./Hero.scss";
import AnimatedValueProposition from "./AnimatedValueProposition";

const Hero = () => {
  const textRef = useRef();

  useEffect(() => {
    let itypedInstance = null; // Variable pour stocker l'instance

    if (textRef.current) {
      // 1. On stocke l'instance retournée par init()
      itypedInstance = init(textRef.current, {
        showCursor: true,
        backDelay: 1500,
        backSpeed: 60,
        strings: ["Business Analyst", "IT Consultant"],
      });
    }

    // 2. On retourne une fonction de nettoyage
    return () => {
      // Ce code sera exécuté quand le composant est démonté
      if (itypedInstance) {
        itypedInstance.destroy(); // On arrête proprement l'animation
      }
    };
  }, []);

  return (
    <section className={`relative w-full h-screen mx-auto`}>
      <div className="flex">
        <div
          className={`head1 absolute  max-w-9xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5`}
        >
          <div className="flex flex-col justify-center items-center mt-5">
            <div className="w-5 h-5 rounded-full bg-[#915EFF]" />
            <div className="w-1 sm:h-90 h-40 violet-gradient" />
          </div>

          <div className="head2">
            <h1 className={`${styles.heroHeadText} text-white`}>
              Hi there, I'm{" "}
              <p className="name text-[#915EFF]">Jérémy Angulo</p>
            </h1>
            <h3>
              <span
                ref={textRef}
                className={`${styles.heroSubText} mt-2 green-text-gradient`}
              ></span>
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
              {/* <a
          href="https://www.instagram.com/jeremyangulo/" target="_blank">
          <AiOutlineInstagram />
        </a>
        <a
          href="https://linktr.ee/jeremyangulo" target="_blank">
          <BiLinkAlt />
        </a> */}
            </div>
          </div>
        </div>
        <div className="imgcontainer1 absolute violet-gradient">
          <img src={jeremy} alt="" className="object-contain" />
        </div>
      </div>

      {/* <ComputersCanvas /> */}
      {/* <AnimatedValueProposition /> */}

      <div className="absolute xs:bottom-2 bottom-6 w-10 flex justify-end items-center">
        <a href="#education">
          <div className="w-[35px] h-[64px] rounded-3xl border-4 border-secondary flex justify-center items-start p-2">
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="w-3 h-3 rounded-full bg-secondary mb-1"
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;
