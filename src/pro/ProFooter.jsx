// src/pro/ProFooter.jsx

import React from "react";

const ProFooter = () => {
  return (
    <footer className="pro-footer">
      <div className="pro-container pro-footer__inner">
        <p>© {new Date().getFullYear()} Jérémy Angulo · Toulouse</p>
      </div>
    </footer>
  );
};

export default ProFooter;
