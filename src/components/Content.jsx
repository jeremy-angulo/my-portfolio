import { React, useState } from "react";
import "./Content.scss";
import { AiOutlineHome, AiOutlineFundProjectionScreen } from "react-icons/ai";
import { BiBook } from "react-icons/bi";
import { MdMessage } from "react-icons/md";
import { BsPersonWorkspace } from "react-icons/bs";
import { useNightContent } from "../i18n/useContent";

const Content = () => {
  const [activeNav, setActiveNav] = useState("#");
  const { nightUi } = useNightContent();
  const labels = nightUi.contentNav;
  return (
    <div className="nav">
      <a
        title={labels.home}
        href="#"
        onClick={() => setActiveNav("#")}
        className={activeNav === "#" ? "active" : ""}
      >
        <AiOutlineHome />
      </a>
      <a
        title={labels.education}
        href="#education"
        onClick={() => setActiveNav("#education")}
        className={activeNav === "#education" ? "active" : ""}
      >
        <BiBook />
      </a>
      <a
        title={labels.projects}
        href="#project"
        onClick={() => setActiveNav("#project")}
        className={activeNav === "#project" ? "active" : ""}
      >
        <AiOutlineFundProjectionScreen />
      </a>
      <a
        title={labels.experience}
        href="#experience"
        onClick={() => setActiveNav("#experience")}
        className={activeNav === "#experience" ? "active" : ""}
      >
        <BsPersonWorkspace />
      </a>
      <a
        title={labels.contact}
        href="#contact"
        onClick={() => setActiveNav("#contact")}
        className={activeNav === "#contact" ? "active" : ""}
      >
        <MdMessage />
      </a>
    </div>
  );
};

export default Content;
