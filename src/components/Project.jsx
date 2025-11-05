import { useSearchParams } from "react-router-dom";
import Tilt from "react-parallax-tilt";
import { motion, transform } from "framer-motion";
import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { styles } from "../styles";
import { github } from "../assets";
import { demo } from "../assets";
import { SectionWrapper } from "../hoc";
import {list} from "../constants"
import { fadeIn, textVariant } from "../utils/motion";
import { aiAndDeepTechProjects, entrepreneurshipProjects, itConsultingProjects, leadershipAndInitiativesProjects } from "../constants";
import ProjectList from "./ProjectList";
import "./Project.scss";

const ProjectCard = ({
  index,
  name,
  description,
  tags,
  image,
  source_code_link,
  source_link,
}) => {
  const projectId = name.toLowerCase().replace(/\s+/g, '-');

  return (
    <motion.div key={`${name}-${index}`} whileInView={{ opacity: 1, transform: 'none' }} variants={fadeIn("up", "spring", index * 0.5, 0.75)}>
        <Tilt
          options={{ max: 45, scale: 1, speed: 450 }}
          className={`project-box bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full flex flex-col h-[800px]`}
        >
          {/* The image container's height is now controlled by the `imageHeight` variable. */}
          {/* <Link to={`/project/${projectId}`}> */}
            <div className={`Box1 relative w-full h-[200px]`}>
              <img
                // layoutId={`image-${projectId}`} // <-- ADD THIS FOR ANIMATION
                src={image}
                alt='project_image'
                transition={{ duration: 1.6, ease: [0.43, 0.13, 0.23, 0.96] }}
                className='image w-full h-full object-cover rounded-2xl'
              />
              <div className='absolute inset-0 flex justify-center card-img_hover' style={{ alignItems: "center" }}>
                <h3 className='text-black font-bold text-center text-[18px] p-2'>{name}</h3>
              </div>
              <div className='title absolute inset-0 flex justify-end card-img_hover'>
                {source_link && (
                  <div onClick={(event) => { event.preventDefault(); event.stopPropagation(); window.open(source_link, "_blank"); }} className='black-gradient w-10 h-10 m-2 rounded-full flex justify-center items-center cursor-pointer'>
                    <img src={demo} alt='live demo link' className='w-1-2 h-1/2 object-contain' />
                  </div>
                )}
                {source_code_link && (
                  <div onClick={(event) => { event.preventDefault(); event.stopPropagation(); window.open(source_code_link, "_blank"); }} className='black-gradient w-10 h-10 m-2 rounded-full flex justify-center items-center cursor-pointer'>
                    <img src={github} alt='github source code' className='w-1/2 h-1/2 object-contain' />
                  </div>
                )}
              </div>
            </div>
          {/* </Link> */}

          <div className='content mt-5 flex flex-col flex-grow'>
            <p className='text-white text-[15px]'>{description.hook}</p>
            
            <div className='mt-4 space-y-2 flex-grow'>
              {description.highlights.map((highlight, idx) => (
                <div key={`${name}-highlight-${idx}`} className='flex flex-row items-start'>
                  <div className='mr-3 flex-shrink-0 w-2 h-2 rounded-full bg-cyan-400 mt-[12px]'></div>
                  <p className='text-slate-200 text-[13px] tracking-wider'>
                    <strong>{highlight.title}</strong> {highlight.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className='content mt-4 flex flex-wrap gap-2'>
            {tags.map((tag) => (
              <p key={`${name}-${tag.name}`} className={`text-[14px] ${tag.color}`}>
                #{tag.name}
              </p>
            ))}
          </div>
        </Tilt>
      </motion.div>
  );
};

const Project = () => {
  const [selected, setSelected] = useState(
    sessionStorage.getItem('activeProjectTab') || "entrepreneurship"
  );

  const [data, setData] = useState([]);
  
  useEffect(() => {
    switch (selected) {
      case "entrepreneurship":
        setData(entrepreneurshipProjects);
        break;
      case "ai_deep_tech":
        setData(aiAndDeepTechProjects);
        break;
      case "it_consulting":
        setData(itConsultingProjects);
        break;
      case "leadership_initiatives":
        setData(leadershipAndInitiativesProjects);
        break;
        
        default:
          setData(aiAndDeepTechProjects);
        }
      }, [selected]);
      
  const handleSelectTab = (id) => {
    setSelected(id);
    sessionStorage.setItem('activeProjectTab', id);
  };

  return (
    <>
      <motion.div whileInView={{ opacity: 1 , transform : 'none'}} variants={textVariant()}>
        <p className={`${styles.sectionSubText} `}>My work</p>
        <h2 className={`${styles.sectionHeadText}`}>Projects.</h2>
      </motion.div>

      <div className='project w-full flex'>
        <motion.div whileInView={{ opacity: 1 , transform : 'none'}}
          variants={fadeIn("", "", 0.1, 1)}
          className='mt-3 text-secondary text-[17px] leading-[30px]'
        >
        <ul>
        {list.map((item, index) => (
          <ProjectList
            key={`${item.title}-${index}`}
            title={item.title}
            active={selected === item.id}
            setSelected={handleSelectTab}
            id={item.id}
          />
        ))}
      </ul>

      <div key={`project-list-${selected}`} className='box mt-20 flex flex-wrap justify-center'>
        {data.map((project, index) => (
          <div key={`project-${index}`}>
            <ProjectCard key={`projectCard-${index}`} index={index} {...project} />
          </div>
        ))}
      </div>


      </motion.div>
      </div>

    </>
  );
};

export default SectionWrapper(Project, "project");