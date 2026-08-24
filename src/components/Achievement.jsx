import React from "react";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";
import { useNightContent } from "../i18n/useContent";
import "./Achievement.scss";

const Achievement = () => {
  const { achievements, nightUi } = useNightContent();

  return (
    <div className={`mt-12 bg-black-100 rounded-[20px]`}>
      <div
        className={`bg-tertiary rounded-2xl ${styles.padding} sm:h-[200px] h-[150px]`}
      >
        <motion.div variants={textVariant()}>
          <p className={styles.sectionSubText}>{nightUi.sections.achievementSub}</p>
          <h2 className={styles.sectionHeadText}>{nightUi.sections.achievementTitle}</h2>
        </motion.div>
      </div>
      <div className={`-mt-[25px] justify-center p-6 ${styles.paddingX} gap-7`}>
        <ul className='mt-5 list-disc ml-5 space-y-2'>
          {achievements.map((achievement, index) => (
            <li key={achievement.id || index} className='text-white-100 text-[16px] pl-1'>{achievement.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SectionWrapper(Achievement, "");