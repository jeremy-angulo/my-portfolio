import React from "react";
import { useEffect, useState } from "react";
import "./Footer.scss";

const Footer = () => {

    return (
        <div className="footer text-center">
        <p> 
          &#x3c;&#47;&#x3e; by
          <a href="https://jeremyangulo.github.io/my-portfolio/" target="_blank">
            {" "}
            Jérémy ANGULO
          </a>
        </p>

      </div>
    );
  };
  
  export default Footer;