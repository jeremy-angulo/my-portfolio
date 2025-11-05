import {
    ltu, enseeiht, paulsab, paulsab_squared, alten, n7consulting, klatterhuset, man3d, vinci,
    freelance,
    grinp, // Placeholder for Gr'INP logo
    n7chess, // Placeholder for Chess club logo
    bafa, // Placeholder for BAFA logo
    cnes, cnes_white, boost, bocalenvers, continentphone, ltu_square,
    zzz, presentation_storizzz, presentation_continentphone, thesis, presentation_boost, presentation_BAFA,
  } from "../assets"; // Assuming asset variables are correctly mapped

  const profiles = [
    {
      link: "https://www.linkedin.com/in/jeremy-angulo/",
      icon: "https://img.icons8.com/color/344/linkedin.png", // Placeholder icon
    },
    {
      link: "https://github.com/jeremy-angulo",
      icon: "https://img.icons8.com/color/344/github.png", // Placeholder icon
    },
  ];

  const achievements = [
    {
      title: "Recipient of the Toulouse INP Award for an exceptional international academic path.",
    },
    {
      title: "Winner of the Saint-Gobain 2024 Award for Best Consultant Support at the National Junior-Enterprise Congress.",
    },
    {
      title: "Supervised four client projects at N7 Consulting, generating €80,000 in revenue.",
    },
    {
      title: "Winner of the Vinci Energies Innovation Challenge for an AI-driven entrepreneurial project.",
    },
    {
      title: "Competed in the French Cup of Engineering Schools twice (2023, 2024), finishing in the top 20 on both occasions.",
    },
  ];

  const list = [
    {
      id: "entrepreneurship",
      title: "Entrepreneurship",
    },
    {
      id: "ai_deep_tech",
      title: "AI & Deep Tech",
    },
    {
      id: "it_consulting",
      title: "IT Consulting",
    },
    {
      id: "leadership_initiatives",
      title: "Leadership & Initiatives",
    },
  ];

// --- ENTREPRENEURSHIP PROJECTS ---

const entrepreneurshipProjects = [
  {
    name: "Storizzz - Founder & Product Lead",
    description: {
      hook: "Led an AI mobile app from a simple idea to a published product in the stores, with its first paying customers.",
      highlights: [
        { title: 'Architected', text: 'the product strategy & validated the market with a +300-person waitlist.' },
        { title: 'Managed', text: 'the full development lifecycle & grew a community of 9,000 followers.' },
        { title: 'Developed', text: 'the core app using Flutter & integrated cutting-edge AI APIs.' }
      ],
    },
    tags: [ { name: "Entrepreneurship", color: "blue-text-gradient" }, { name: "Product_Management", color: "green-text-gradient" } ],
    image: presentation_storizzz,
    source_link: "https://www.storizzz.app/",
  },
  {
    name: "Vinci Energies - Innovation Challenge Winner",
    description: {
      hook: "Pitched the winning project during an innovation challenge organized by Vinci Energies. Awarded €300",
      highlights: [
        { title: 'Conceptualized', text: 'an AI model to generate sign language video from subtitles.' },
        { title: 'Drove', text: 'the project from market research to a winning final pitch to executives.' },
        { title: 'Secured', text: '1st place against numerous competing teams.' }
      ],
    },
    tags: [ { name: "Pitching", color: "blue-text-gradient" }, { name: "Business_Strategy", color: "green-text-gradient" }, { name: "AI", color: "pink-text-gradient" } ],
    image: vinci,
  },
  {
    name: "N7 Consulting - Business Strategist",
    description: {
      hook: "Participated in the business strategy, prospection and consultant recruitment for a leading Junior-Enterprise.",
      highlights: [
        { title: 'Trained', text: 'and mentored 150+ junior entrepreneurs in AI at national congresses.' },
        { title: 'Executed', text: 'client strategies, contributing to €80,000 in revenue.' },
        { title: 'Built', text: 'an AI chatbot to automate blog generation, boosting web traffic by 80%.' }
      ],
    },
    tags: [ { name: "Strategy", color: "blue-text-gradient" }, { name: "Process_Optimization", color: "green-text-gradient" }],
    image: n7consulting,
    source_link: "https://www.n7consulting.fr/",
  },
];


// --- AI & DEEP TECH PROJECTS ---

const aiAndDeepTechProjects = [
  {
    name: "Master's Thesis - AI Research Lead",
    description: {
        hook: "Pioneered the first-ever scientific dataset for analyzing cross-country skiing using computer vision.",
        highlights: [
            { title: 'Constructed', text: 'a complete data pipeline using fine-tuned AI models.' },
            { title: 'Developed', text: 'novel ML algorithms to classify skier technique.' },
            { title: 'Delivered', text: 'a unique contribution to the sports science community.' },
        ],
    },
    tags: [ { name: "MachineLearning", color: "blue-text-gradient" }, { name: "ComputerVision", color: "green-text-gradient" }, { name: "R&D", color: "pink-text-gradient" } ],
    image: thesis,
    source_link: "https://ltu.diva-portal.org/smash/record.jsf?dswid=29&pid=diva2%3A1969152"
  },
  {
    name: "MAN-3D - R&D Project Lead",
    description: {
        hook: "Co-led a project to build a custom 3D scanner from scratch for a digital anatomy museum.",
        highlights: [
            { title: 'Advanced', text: 'the project from a university course into a full R&D initiative.' },
            { title: 'Guided', text: 'the design and prototyping of both hardware and software.' },
            { title: 'Transformed', text: 'a complex idea into a functional, value-adding tool.' },
        ],
    },
    tags: [ { name: "Prototyping", color: "blue-text-gradient" }, { name: "R&D", color: "pink-text-gradient" }, { name: "Innovation", color: "orange-text-gradient" } ],
    image: man3d,
    source_link:"https://www.univ-tlse3.fr/patrimoine-et-collections/medecine"
  },
  {
    name: "Continent Phone - Lead AI Researcher",
    description: {
        hook: "Headed the deep-tech R&D to tackle the challenge of real-time mobile call translation.",
        highlights: [
            { title: 'Conducted', text: 'extensive research on nascent LLMs and Speech-to-Speech models.' },
            { title: 'Architected', text: 'a pragmatic MVP using React Native after proving other concepts unfeasible.' },
            { title: 'Defined', text: 'the complete technical strategy for a scalable, cross-platform solution.' },
        ],
    },
    tags: [ { name: "AI_R&D", color: "blue-text-gradient" }, { name: "Mobile_Dev", color: "green-text-gradient" } ],
    image: presentation_continentphone,
  },
];


// --- IT CONSULTING PROJECTS ---

const itConsultingProjects = [
    {
        name: "CNES - Lead Consultant & Architect",
        description: {
            hook: "Delivered a software application for the AEROSAT nano-satellite mission",
            highlights: [
                { title: 'Piloted', text: 'the project from initial client workshops to final delivery.' },
                { title: 'Designed', text: 'the complete full-stack architecture using Python/Flask and React.' },
                { title: 'Ensured', text: 'the project met the highest standards of quality and security.' },
            ],
        },
        tags: [ { name: "Project_Management", color: "blue-text-gradient" }, { name: "Full-Stack", color: "green-text-gradient" } ],
        image: cnes,
    },
    {
        name: "Boost - Lead SaaS Architect",
        description: {
            hook: "Engineered a custom SaaS platform from the ground up for a startup client.",
            highlights: [
                { title: 'Analyzed', text: 'business requirements to design a scalable back-end API with Python/Django.' },
                { title: 'Served', text: 'as the key technical liaison to ensure seamless front-end integration.' },
                { title: 'Provided', text: 'a robust and secure foundation for the client\'s core business.' },
            ],
        },
        tags: [ { name: "SaaS", color: "blue-text-gradient" }, { name: "API_Design", color: "green-text-gradient" } ],
        image: presentation_boost,
        source_link: "https://boost-frontend-eu-34ab372e4bcf.herokuapp.com/"
    },
    {
        name: "Bocalenvers - Agile Project Lead",
        description: {
            hook: "Orchestrated the agile development of a business-specific tool mobile application",
            highlights: [
                { title: 'Navigated', text: 'the project through rapid, iterative development cycles using Flutter.' },
                { title: 'Handled', text: 'the entire process from requirements gathering to app store deployment.' },
                { title: 'Acted', text: 'as the primary client contact, ensuring transparency and alignment.' },
            ],
        },
        tags: [ { name: "Agile", color: "blue-text-gradient" }, { name: "Mobile_Dev", color: "green-text-gradient" }, { name: "Project_Delivery", color: "orange-text-gradient" } ],
        image: bocalenvers,
        source_link: "https://www.bocalenvers.org/"
    },
    {
        name: "Freelance - IT & Data Strategy Consultant",
        description: {
            hook: "Advised startups on leveraging data and technology to achieve their goals.",
            highlights: [
                { title: 'Interpreted', text: 'data to generate actionable business insights and drive decision-making.' },
                { title: 'Recommended', text: 'improvements for IT strategy and technical architecture.' },
                { title: 'Offered', text: 'guidance on entrepreneurial best practices and market positioning.' },
            ],
        },
        tags: [ { name: "Consulting", color: "blue-text-gradient" }, { name: "Data_Analysis", color: "green-text-gradient" }, { name: "IT_Strategy", color: "pink-text-gradient" } ],
        image: freelance,
    },
];


// --- LEADERSHIP & INITIATIVES PROJECTS ---

const leadershipAndInitiativesProjects = [
    {
        name: "Climbing - International Instructor & Judge",
        description: {
            hook: "Cultivated a journey in the world of climbing, progressing from a competitive athlete to an international leader.",
            highlights: [
                { title: 'Coordinated', text: 'corporate team-building events and technical courses in English in Sweden.' },
                { title: 'Volunteered', text: 'as a certified regional and national competition judge for the French Climbing Federation.' },
                { title: 'Mentored', text: 'and trained climbers of all levels, fostering a passion for the sport.' },
            ],
        },
        tags: [ { name: "Leadership", color: "green-text-gradient" }, { name: "International", color: "pink-text-gradient" }, { name: "Training", color: "orange-text-gradient" } ],
        image: klatterhuset,
        source_link: "https://www.klatterhuset.se/",
        
    },
    {
        name: "Camp Director & BAFA Trainer",
        description: {
            hook: "Animated and directed over 20 large-scale youth camps and trained future leaders in France and abroad.",
            highlights: [
                { title: 'Directed', text: 'all project phases: from budget allocation and logistics to team leadership.' },
                { title: 'Guided', text: 'and motivated teams of animators to deliver high-quality educational programs.' },
                { title: 'Designed', text: 'official BAFA training modules to certify youth work professionals.' },
            ],
        },
        tags: [ { name: "Leadership", color: "green-text-gradient" }, { name: "Training", color: "pink-text-gradient" }, { name: "Mentorship", color: "orange-text-gradient" } ],
        image: presentation_BAFA,
    },
    {
        name: "Gr'INP - Climbing Club President",
        description: {
            hook: "As President, directed all operations for the Toulouse-INP climbing club, fostering a dynamic and active community.",
            highlights: [
                { title: 'Oversaw', text: 'a team of instructors and was responsible for over 100 active members.' },
                { title: 'Participated', text: 'in the University French Cup 2023/2024, finishing in the top 20 twice.' },
                { title: 'Organized', text: 'several events, including competitions and social gatherings.' },
                { title: 'Administered', text: 'the club\'s budget and upheld all safety standards.' },
            ],
        },
        tags: [ { name: "Management", color: "blue-text-gradient" }, { name: "Leadership", color: "green-text-gradient" }, { name: "Community", color: "pink-text-gradient" } ],
        image: grinp,
    },
    {
        name: "N7 Chess Club - Team Leader & Organizer",
        description: {
            hook: "Acted as a key leader in the N7 Chess Club, organizing events and contributing to a major competitive success.",
            highlights: [
                { title: 'Facilitated', text: 'weekly training sessions to develop team skills and strategy.' },
                { title: 'Contributed', text: 'to a 2nd place finish at the French Engineering School Championships.' },
                { title: 'Arranged', text: 'a major Toulouse-area tournament, managing logistics and participants.' },
            ],
        },
        tags: [ { name: "Strategy", color: "blue-text-gradient" }, { name: "EventOrganization", color: "green-text-gradient" }, { name: "Teamwork", color: "pink-text-gradient" } ],
        image: n7chess,
    },
];


const experiences = [
  {
    title: "Business Analyst",
    company_name: "ALTEN (for Navblue, an Airbus subsidiary)",
    icon: alten,
    iconBg: "#383E56",
    date: "Sept 2025 - Present",
    points: [
      "Serving as the key bridge between the Product Owner and international technical teams to align product delivery with strategic goals.",
      "Prioritizing the product backlog and coordinating development within a fast-paced Agile (Scrum) framework.",
      "Ensuring application quality and performance through rigorous functional testing and validation of new features.",
      "Upgrading internal processes through automation using the Microsoft Power Platform and Python.",
    ],
  },
  {
    title: "IT Consultant (Mission for Boost)",
    company_name: "N7 Consulting",
    icon: boost,
    iconBg: "#FFFFFF",
    date: "Dec 2024 - Sept 2025",
    points: [
        "Engineered a custom SaaS platform for freelance employment management (“portage salarial”), analyzing client needs to design a scalable and bespoke architecture.",
        "Led the back-end API development using Python/Django, ensuring robust, secure, and efficient data handling.",
        "Served as the key technical liaison between the client and the front-end team to guarantee seamless integration and project alignment.",
    ],
  },
  {
    title: "AI Research (Master's Thesis)",
    company_name: "Luleå University of Technology",
    icon: ltu_square,
    iconBg: "#383E56",
    date: "Nov 2024 - July 2025",
    points: [
      "Led a pioneering research project to create an AI-powered ski coach, from data pipeline construction to model deployment.",
      "Created the first-ever scientific dataset for ski skating analysis by fine-tuning computer vision models (AlphaPose).",
      "Developed and implemented novel clustering models to analyze skier technique and automatically classify skill levels.",
      "Delivered a functional prototype that provided a unique and valuable contribution to the sports science community.",
    ],
  },
  {
    title: "Co-founder & Product Lead",
    company_name: "Storizzz",
    icon: zzz,
    iconBg: "#FFFFFF",
    date: "March 2024 - Oct 2025",
    points: [
      "Led the creation of an AI-powered mobile app from initial concept and market validation to a published product on the app stores.",
      "Defined the complete product strategy, managed the technical roadmap, and developed the core application using Flutter.",
      "Recruited and managed a team of freelance developers and UX/UI designers to accelerate time-to-market.",
      "Built an engaged user community of over 9,000 followers in 9 months and successfully secured the first paying customers.",
    ],
  },
  {
    title: "IT Consultant (Mission for CNES)",
    company_name: "N7 Consulting",
    icon: cnes_white,
    iconBg: "#383E56",
    date: "Feb 2024 - Oct 2024",
    points: [
        "Managed a project for the French Space Agency, from initial client workshops and budgeting to final delivery.",
        "Designed the complete software architecture for a robust, secured web application. Led the full-stack development using Python/Flask and React.",
        "Worked in agile sprints, organizing weekly meetings with the client to ensure alignment and satisfaction.",
    ],
  },
  {
    title: "IT Consultant (Mission for Bocalenvers)",
    company_name: "N7 Consulting",
    icon: bocalenvers,
    iconBg: "#FFFFFF",
    date: "Sept 2023 - June 2024",
    points: [
        "Managed the agile development of a cross-platform mobile application using Flutter to meet specific client business needs.",
        "Led the project through short, iterative development cycles, from requirements gathering to final deployment on the app stores.",
        "Acted as the primary point of contact for the client, ensuring transparent communication and alignment with project goals.",
    ],
  },
  {
    title: "IT Consultant (Mission for Continent-Phone)",
    company_name: "N7 Consulting",
    icon: continentphone,
    iconBg: "#383E56",
    date: "Nov 2022 - March 2024",
    points: [
      "Architected a cross-platform MVP using React Native that translates calls in real time, after strategically pivoting from unfeasible, high-latency concepts.",
      "Led an extensive R&D phase to tackle the complex challenge of real-time call translation, evaluating nascent LLMs and Speech-to-Speech models.",
      "Defined the complete technical roadmap and functional specifications for a scalable mobile solution designed for future web integration.",
    ],
  },
  {
    title: "3D Machine Prototyper",
    company_name: "Anatomy Museum, Faculty of Medicine",
    icon: paulsab_squared,
    iconBg: "#FFFFFF",
    date: "Feb 2021 - Oct 2022",
    points: [
      "Co-led the design and prototyping of a custom 3D scanning machine to create the digital anatomy museum of the Toulouse Medicine Faculty.",
      "Transformed a concept from a 3 months university course project into a 18 months functional hardware and software prototype.",
      "Project funded by the Toulouse University Commission.",
      "Our slogan : 'By students, for students'."
    ],
  },
    {
    title: "Climbing Instructor",
    company_name: "Klätterhuset (Sweden) & French Climbing Federation",
    icon: klatterhuset,
    iconBg: "#383E56",
    date: "Sept 2021 - June 2025",
    points: [
      "Organized and led team-building events and weekly climbing courses in English at a professional gym in Sweden.",
      "Certified as a regional and national bouldering competition judge by the French Climbing Federation (FFME), overseeing high-level events.",
      "Served as President of the Toulouse-INP climbing club, managing all club activities, events, members and budgets.",
      "Initiated a partnership with Arkose Climbing gyms, resulting in the sale of over 1,000 climbing sessions in the first year",
    ],
  },
    {
    title: "Camp Director & BAFA Trainer",
    company_name: "CIE Thales, Bloomdayz/Côté Sport, Cap Monde, PAJ, VALT",
    icon: bafa, // Placeholder icon
    iconBg: "#FFFFFF",
    date: "July 2021 - July 2025",
    points: [
        "Planned and directed over 20 youth camps, overseeing budgets, logistics, and scheduling.",
        "Led and motivated teams of animators and handled crisis situations.",
        "Designed and delivered official BAFA training modules, mentoring and certifying future youth work professionals.",
    ],
  },
];

 const educations = [
    {
      name: "Luleå University of Technology \n Luleå, Sweden",
      degree: "Magister of Data Science",
      branch: "Data Science \n Artificial Intelligence",
      marks: "GPA: 3.6/4.0",
      year: "2024 - 2025",
      image: ltu,
    },
    {
      name: "INP-ENSEEIHT (Centrale Toulouse) \n Toulouse, France",
      degree: "Engineering Master's Degree",
      branch: "Software Engineering \n Artificial Intelligence",
      marks: "GPA: 3.7/4.0",
      year: "2022 - 2025",
      image: enseeiht,
    },
    {
      name: "Université Paul Sabatier \n Toulouse, France",
      degree: "IT Bachelor's Degree",
      branch: "Computer Science \n - ",
      marks: "GPA: 3.9/4 (1st/160)",
      year: "(2020 - 2022)",
      image: paulsab,
    }
  ];
  
  const allProjects = [
    ...entrepreneurshipProjects,
    ...aiAndDeepTechProjects,
    ...itConsultingProjects,
    ...leadershipAndInitiativesProjects,
  ];

  export { list, profiles, achievements, experiences, educations, entrepreneurshipProjects, aiAndDeepTechProjects, itConsultingProjects, leadershipAndInitiativesProjects, allProjects };