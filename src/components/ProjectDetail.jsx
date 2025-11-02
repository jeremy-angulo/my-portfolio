
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { allProjects } from '../constants'; // We will create this in the next step
import { SectionWrapper } from '../hoc';
import { styles } from '../styles';
import { FaArrowLeft } from 'react-icons/fa';
import './ProjectDetail.scss';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const project = allProjects.find(
    (p) => p.name.toLowerCase().replace(/\s+/g, '-') === projectId
  );

  if (!project) {
    return <div>Project not found!</div>;
  }

  return (
    <div className="project-detail-container">
      <Link to="/#project" className="back-link">
        <FaArrowLeft /> Back to all projects
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.sectionHeadText}>{project.name}</h2>
        
        <div className="detail-content">
          <motion.img
            layoutId={`image-${projectId}`} // <-- THE SAME layoutId AS THE CARD
            src={project.image}
            alt={project.name}
            className="detail-image"
          />
          <div className="detail-text">
            <p className='hook'>{project.description.hook}</p>
            <div className='highlights'>
              {project.description.highlights.map((highlight, idx) => (
                <div key={idx} className='highlight-item'>
                  <div className='dot'></div>
                  <p><strong>{highlight.title}:</strong> {highlight.text}</p>
                </div>
              ))}
            </div>
            <div className='tags'>
              {project.tags.map((tag) => (
                <p key={tag.name} className={tag.color}>#{tag.name}</p>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SectionWrapper(ProjectDetail, "");