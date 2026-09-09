// src/constants/nightFr.js
// Version française du contenu de la facette nuit. Même forme que index.js :
// tout changement de structure là-bas doit être répercuté ici.

import {
    ltu, enseeiht, paulsab, paulsab_squared, alten, n7consulting, klatterhuset, man3d, vinci,
    freelance,
    grinp,
    n7chess,
    bafa,
    cnes, cnes_white, boost, bocalenvers, continentphone, ltu_square,
    zzz, presentation_storizzz, presentation_continentphone, thesis, presentation_boost, presentation_BAFA,
  } from "../assets";

  const profiles = [
    {
      link: "https://www.linkedin.com/in/jeremy-angulo/",
      icon: "https://img.icons8.com/color/344/linkedin.png",
    },
    {
      link: "https://github.com/jeremy-angulo",
      icon: "https://img.icons8.com/color/344/github.png",
    },
  ];

  const achievements = [
    {
      title: "Lauréat du prix Toulouse INP récompensant un parcours académique international.",
    },
    {
      title: "Lauréat du prix Saint-Gobain 2024 du meilleur accompagnement consultant, au Congrès National des Junior-Entreprises.",
    },
    {
      title: "Encadrement de quatre missions clients chez N7 Consulting, pour 80 000 € de chiffre d'affaires.",
    },
    {
      title: "Vainqueur du challenge innovation Vinci Energies avec un projet entrepreneurial autour de l'IA.",
    },
    {
      title: "Deux participations à la Coupe de France des écoles d'ingénieurs (2023, 2024), top 20 les deux fois.",
    },
  ];

  const list = [
    {
      id: "entrepreneurship",
      title: "Entrepreneuriat",
    },
    {
      id: "ai_deep_tech",
      title: "IA & Deep Tech",
    },
    {
      id: "it_consulting",
      title: "Conseil IT",
    },
    {
      id: "leadership_initiatives",
      title: "Leadership & Initiatives",
    },
  ];

// --- PROJETS ENTREPRENEURIAT ---

const entrepreneurshipProjects = [
  {
    name: "Storizzz - Fondateur & Product Lead",
    description: {
      hook: "Une application mobile IA menée de la simple idée au produit publié sur les stores, avec ses premiers clients payants.",
      highlights: [
        { title: 'Construit', text: 'la stratégie produit et validé le marché avec une waitlist de plus de 300 personnes.' },
        { title: 'Piloté', text: "l'ensemble du cycle de développement et fait grandir une communauté de 9 000 abonnés." },
        { title: 'Développé', text: "le cœur de l'application en Flutter, avec des API d'IA de dernière génération." }
      ],
    },
    tags: [ { name: "Entrepreneuriat", color: "blue-text-gradient" }, { name: "Product_Management", color: "green-text-gradient" } ],
    image: presentation_storizzz,
    source_link: "https://www.storizzz.app/",
  },
  {
    name: "Vinci Energies - Vainqueur du challenge innovation",
    description: {
      hook: "Le pitch gagnant d'un challenge innovation organisé par Vinci Energies. Récompensé de 300 €.",
      highlights: [
        { title: 'Conçu', text: "un modèle d'IA générant de la vidéo en langue des signes à partir de sous-titres." },
        { title: 'Mené', text: "le projet de l'étude de marché au pitch final devant les dirigeants." },
        { title: 'Décroché', text: 'la première place face à de nombreuses équipes concurrentes.' }
      ],
    },
    tags: [ { name: "Pitch", color: "blue-text-gradient" }, { name: "Stratégie_Business", color: "green-text-gradient" }, { name: "IA", color: "pink-text-gradient" } ],
    image: vinci,
  },
  {
    name: "N7 Consulting - Stratège business",
    description: {
      hook: "Stratégie commerciale, prospection et recrutement de consultants pour une Junior-Entreprise de premier plan.",
      highlights: [
        { title: 'Formé', text: "et encadré plus de 150 junior-entrepreneurs à l'IA lors de congrès nationaux." },
        { title: 'Déployé', text: "les stratégies clients, en contribuant à 80 000 € de chiffre d'affaires." },
        { title: 'Construit', text: "un chatbot IA automatisant la rédaction du blog : +80 % de trafic web." }
      ],
    },
    tags: [ { name: "Stratégie", color: "blue-text-gradient" }, { name: "Optimisation_Process", color: "green-text-gradient" }],
    image: n7consulting,
    source_link: "https://www.n7consulting.fr/",
  },
];


// --- PROJETS IA & DEEP TECH ---

const aiAndDeepTechProjects = [
  {
    name: "Mémoire de master - Recherche en IA",
    description: {
        hook: "Le premier jeu de données scientifique pour analyser le ski de fond par vision par ordinateur.",
        highlights: [
            { title: 'Construit', text: "une pipeline de données complète à partir de modèles d'IA fine-tunés." },
            { title: 'Développé', text: 'de nouveaux algorithmes de ML pour classifier la technique des skieurs.' },
            { title: 'Livré', text: 'une contribution inédite à la communauté des sciences du sport.' },
        ],
    },
    tags: [ { name: "MachineLearning", color: "blue-text-gradient" }, { name: "ComputerVision", color: "green-text-gradient" }, { name: "R&D", color: "pink-text-gradient" } ],
    image: thesis,
    source_link: "https://ltu.diva-portal.org/smash/record.jsf?dswid=29&pid=diva2%3A1969152"
  },
  {
    name: "MAN-3D - Responsable projet R&D",
    description: {
        hook: "Un scanner 3D conçu de zéro pour le musée d'anatomie numérique de la faculté de médecine.",
        highlights: [
            { title: 'Fait évoluer', text: "un projet de cours universitaire en véritable initiative de R&D." },
            { title: 'Guidé', text: 'la conception et le prototypage, côté matériel comme logiciel.' },
            { title: 'Transformé', text: 'une idée complexe en outil fonctionnel à valeur ajoutée.' },
        ],
    },
    tags: [ { name: "Prototypage", color: "blue-text-gradient" }, { name: "R&D", color: "pink-text-gradient" }, { name: "Innovation", color: "orange-text-gradient" } ],
    image: man3d,
    source_link:"https://www.univ-tlse3.fr/patrimoine-et-collections/medecine"
  },
  {
    name: "Continent Phone - Lead AI Researcher",
    description: {
        hook: "La R&D deep-tech du défi de la traduction d'appels mobiles en temps réel.",
        highlights: [
            { title: 'Mené', text: 'des recherches approfondies sur les LLM naissants et les modèles Speech-to-Speech.' },
            { title: 'Architecturé', text: 'un MVP pragmatique en React Native, après avoir écarté les pistes non viables.' },
            { title: 'Défini', text: "la stratégie technique complète d'une solution scalable et multiplateforme." },
        ],
    },
    tags: [ { name: "R&D_IA", color: "blue-text-gradient" }, { name: "Dev_Mobile", color: "green-text-gradient" } ],
    image: presentation_continentphone,
  },
];


// --- PROJETS CONSEIL IT ---

const itConsultingProjects = [
    {
        name: "CNES - Consultant principal & architecte",
        description: {
            hook: "Une application logicielle livrée pour la mission nano-satellite AEROSAT.",
            highlights: [
                { title: 'Piloté', text: 'le projet, des premiers ateliers client à la livraison finale.' },
                { title: 'Conçu', text: "l'architecture full-stack complète en Python/Flask et React." },
                { title: 'Garanti', text: 'les plus hauts standards de qualité et de sécurité.' },
            ],
        },
        tags: [ { name: "Gestion_De_Projet", color: "blue-text-gradient" }, { name: "Full-Stack", color: "green-text-gradient" } ],
        image: cnes,
    },
    {
        name: "Boost - Architecte SaaS",
        description: {
            hook: "Une plateforme SaaS sur mesure, conçue de bout en bout pour une startup.",
            highlights: [
                { title: 'Analysé', text: 'les besoins métier pour concevoir une API back-end scalable en Python/Django.' },
                { title: 'Assuré', text: "le rôle d'interlocuteur technique clé pour une intégration front-end fluide." },
                { title: 'Fourni', text: 'une fondation robuste et sécurisée au cœur de métier du client.' },
            ],
        },
        tags: [ { name: "SaaS", color: "blue-text-gradient" }, { name: "API_Design", color: "green-text-gradient" } ],
        image: presentation_boost,
        source_link: "https://boost-frontend-eu-34ab372e4bcf.herokuapp.com/"
    },
    {
        name: "Bocalenvers - Chef de projet agile",
        description: {
            hook: "Le développement agile d'une application mobile répondant à un besoin métier précis.",
            highlights: [
                { title: 'Conduit', text: 'le projet en cycles courts et itératifs avec Flutter.' },
                { title: 'Géré', text: "l'ensemble du processus, du recueil du besoin au déploiement sur les stores." },
                { title: 'Tenu', text: 'le rôle de contact principal du client, en toute transparence.' },
            ],
        },
        tags: [ { name: "Agile", color: "blue-text-gradient" }, { name: "Dev_Mobile", color: "green-text-gradient" }, { name: "Livraison", color: "orange-text-gradient" } ],
        image: bocalenvers,
        source_link: "https://www.bocalenvers.org/"
    },
    {
        name: "Freelance - Consultant IT & Data",
        description: {
            hook: "Conseil aux startups sur l'usage de la data et de la technologie pour atteindre leurs objectifs.",
            highlights: [
                { title: 'Interprété', text: 'les données pour en tirer des enseignements actionnables.' },
                { title: 'Recommandé', text: "des évolutions de stratégie IT et d'architecture technique." },
                { title: 'Accompagné', text: 'les bonnes pratiques entrepreneuriales et le positionnement marché.' },
            ],
        },
        tags: [ { name: "Conseil", color: "blue-text-gradient" }, { name: "Data_Analysis", color: "green-text-gradient" }, { name: "Stratégie_IT", color: "pink-text-gradient" } ],
        image: freelance,
    },
];


// --- PROJETS LEADERSHIP & INITIATIVES ---

const leadershipAndInitiativesProjects = [
    {
        name: "Escalade - Instructeur international & juge",
        description: {
            hook: "Un parcours dans le monde de l'escalade, de compétiteur à encadrant international.",
            highlights: [
                { title: 'Animé', text: "des team-buildings d'entreprise et des cours techniques en anglais, en Suède." },
                { title: 'Officié', text: 'comme juge certifié de compétitions régionales et nationales pour la FFME.' },
                { title: 'Formé', text: 'des grimpeurs de tous niveaux, en transmettant la passion du sport.' },
            ],
        },
        tags: [ { name: "Leadership", color: "green-text-gradient" }, { name: "International", color: "pink-text-gradient" }, { name: "Formation", color: "orange-text-gradient" } ],
        image: klatterhuset,
        source_link: "https://www.klatterhuset.se/",

    },
    {
        name: "Directeur de séjours & formateur BAFA",
        description: {
            hook: "Plus de 20 séjours de vacances animés et dirigés, et des animateurs formés en France comme à l'étranger.",
            highlights: [
                { title: 'Dirigé', text: 'toutes les phases : budget, logistique, encadrement des équipes.' },
                { title: 'Guidé', text: "et motivé des équipes d'animateurs pour des programmes éducatifs de qualité." },
                { title: 'Conçu', text: 'des modules officiels de formation BAFA pour certifier les futurs professionnels.' },
            ],
        },
        tags: [ { name: "Leadership", color: "green-text-gradient" }, { name: "Formation", color: "pink-text-gradient" }, { name: "Mentorat", color: "orange-text-gradient" } ],
        image: presentation_BAFA,
    },
    {
        name: "Gr'INP - Président du club d'escalade",
        description: {
            hook: "La direction complète du club d'escalade de Toulouse-INP et de sa communauté.",
            highlights: [
                { title: 'Encadré', text: 'une équipe de moniteurs, pour plus de 100 membres actifs.' },
                { title: 'Participé', text: 'à la Coupe de France universitaire 2023/2024, top 20 à deux reprises.' },
                { title: 'Organisé', text: 'compétitions et événements de vie associative.' },
                { title: 'Administré', text: 'le budget du club, dans le respect des normes de sécurité.' },
            ],
        },
        tags: [ { name: "Management", color: "blue-text-gradient" }, { name: "Leadership", color: "green-text-gradient" }, { name: "Communauté", color: "pink-text-gradient" } ],
        image: grinp,
    },
    {
        name: "N7 Échecs - Team Leader & organisateur",
        description: {
            hook: "Un rôle clé dans le club d'échecs de l'N7 : entraînements, événements et un beau résultat collectif.",
            highlights: [
                { title: 'Animé', text: "des séances d'entraînement hebdomadaires pour progresser en équipe." },
                { title: 'Contribué', text: 'à une 2e place au championnat de France des écoles d\'ingénieurs.' },
                { title: 'Organisé', text: 'un tournoi majeur sur Toulouse, logistique et participants compris.' },
            ],
        },
        tags: [ { name: "Stratégie", color: "blue-text-gradient" }, { name: "Événementiel", color: "green-text-gradient" }, { name: "Esprit_Équipe", color: "pink-text-gradient" } ],
        image: n7chess,
    },
];


const experiences = [
  {
    title: "Business Manager (Ingénieur d'Affaires)",
    company_name: "ALTEN",
    icon: alten,
    iconBg: "#383E56",
    date: "2026 - Aujourd'hui",
    points: [
      "Promu Business Manager pour développer l'activité ingénierie et IT de la région toulousaine.",
      "Construction et management d'une équipe de consultants : sourcing, entretiens techniques, recrutement et suivi de carrière.",
      "Responsabilité complète de la relation client, de la prospection à la contractualisation et au suivi des prestations.",
      "Un passé d'ingénieur mis au service de propositions commerciales justes techniquement.",
    ],
  },
  {
    title: "Business Analyst",
    company_name: "ALTEN (pour NAVBLUE, groupe Airbus)",
    icon: alten,
    iconBg: "#383E56",
    date: "Sept 2025 - 2026",
    points: [
      "Interface clé entre le Product Owner et des équipes techniques internationales, pour aligner la livraison produit et les objectifs stratégiques.",
      "Priorisation du backlog produit et coordination du développement dans un cadre agile (Scrum) soutenu.",
      "Qualité et performance applicatives assurées par des tests fonctionnels rigoureux et la validation des nouvelles fonctionnalités.",
      "Automatisation de processus internes avec la Microsoft Power Platform et Python.",
    ],
  },
  {
    title: "Consultant IT (mission Boost)",
    company_name: "N7 Consulting",
    icon: boost,
    iconBg: "#FFFFFF",
    date: "Déc 2024 - Sept 2025",
    points: [
        "Conception d'une plateforme SaaS de gestion du portage salarial, à partir de l'analyse des besoins du client.",
        "Développement de l'API back-end en Python/Django : robustesse, sécurité et efficacité des données.",
        "Interlocuteur technique entre le client et l'équipe front-end, pour une intégration et un alignement sans accroc.",
    ],
  },
  {
    title: "Recherche en IA (mémoire de master)",
    company_name: "Luleå University of Technology",
    icon: ltu_square,
    iconBg: "#383E56",
    date: "Nov 2024 - Juil 2025",
    points: [
      "Projet de recherche pionnier : un coach de ski propulsé par l'IA, de la construction de la pipeline de données au déploiement du modèle.",
      "Création du premier jeu de données scientifique d'analyse du ski skating, par fine-tuning de modèles de vision (AlphaPose).",
      "Développement de modèles de clustering pour analyser la technique des skieurs et classifier automatiquement les niveaux.",
      "Un prototype fonctionnel livré, contribution originale aux sciences du sport.",
    ],
  },
  {
    title: "Co-fondateur & Product Lead",
    company_name: "Storizzz",
    icon: zzz,
    iconBg: "#FFFFFF",
    date: "Mars 2024 - Oct 2025",
    points: [
      "Création d'une application mobile IA, du concept initial et de la validation marché au produit publié sur les stores.",
      "Définition de la stratégie produit, pilotage de la roadmap technique et développement du cœur de l'application en Flutter.",
      "Recrutement et management d'une équipe de freelances (développement, UX/UI) pour accélérer la mise sur le marché.",
      "Une communauté de plus de 9 000 abonnés en 9 mois, et les premiers clients payants.",
    ],
  },
  {
    title: "Consultant IT (mission CNES)",
    company_name: "N7 Consulting",
    icon: cnes_white,
    iconBg: "#383E56",
    date: "Fév 2024 - Oct 2024",
    points: [
        "Pilotage d'un projet pour le CNES, des ateliers initiaux et du budget à la livraison finale.",
        "Conception de l'architecture d'une application web robuste et sécurisée ; développement full-stack en Python/Flask et React.",
        "Sprints agiles et réunions hebdomadaires avec le client, pour garantir alignement et satisfaction.",
    ],
  },
  {
    title: "Consultant IT (mission Bocalenvers)",
    company_name: "N7 Consulting",
    icon: bocalenvers,
    iconBg: "#FFFFFF",
    date: "Sept 2023 - Juin 2024",
    points: [
        "Développement agile d'une application mobile multiplateforme en Flutter, répondant aux besoins métier du client.",
        "Cycles de développement courts et itératifs, du recueil du besoin au déploiement final sur les stores.",
        "Contact principal du client, avec une communication transparente et alignée sur les objectifs.",
    ],
  },
  {
    title: "Consultant IT (mission Continent-Phone)",
    company_name: "N7 Consulting",
    icon: continentphone,
    iconBg: "#383E56",
    date: "Nov 2022 - Mars 2024",
    points: [
      "Architecture d'un MVP multiplateforme en React Native traduisant les appels en temps réel, après un pivot stratégique loin des concepts à trop forte latence.",
      "Phase de R&D poussée sur un défi complexe : évaluation des LLM naissants et des modèles Speech-to-Speech.",
      "Roadmap technique complète et spécifications fonctionnelles d'une solution mobile scalable, pensée pour le web.",
    ],
  },
  {
    title: "Prototypeur de machine 3D",
    company_name: "Musée d'anatomie, faculté de médecine",
    icon: paulsab_squared,
    iconBg: "#FFFFFF",
    date: "Fév 2021 - Oct 2022",
    points: [
      "Co-conception et prototypage d'un scanner 3D sur mesure pour créer le musée d'anatomie numérique de la faculté de médecine de Toulouse.",
      "D'un projet de cours de 3 mois à un prototype matériel et logiciel fonctionnel, en 18 mois.",
      "Projet financé par la commission de l'Université de Toulouse.",
      "Notre devise : « Par les étudiants, pour les étudiants ».",
    ],
  },
    {
    title: "Instructeur d'escalade",
    company_name: "Klätterhuset (Suède) & FFME",
    icon: klatterhuset,
    iconBg: "#383E56",
    date: "Sept 2021 - Juin 2025",
    points: [
      "Cours hebdomadaires et team-buildings d'entreprise animés en anglais dans une salle professionnelle en Suède.",
      "Juge certifié de compétitions de bloc régionales et nationales pour la Fédération Française (FFME).",
      "Président du club d'escalade de Toulouse-INP : activités, événements, membres et budgets.",
      "Partenariat initié avec les salles Arkose : plus de 1 000 séances vendues la première année.",
    ],
  },
    {
    title: "Directeur de séjours & formateur BAFA",
    company_name: "CIE Thales, Bloomdayz/Côté Sport, Cap Monde, PAJ, VALT",
    icon: bafa,
    iconBg: "#FFFFFF",
    date: "Juil 2021 - Juil 2025",
    points: [
        "Plus de 20 séjours de vacances planifiés et dirigés : budgets, logistique et plannings.",
        "Encadrement et motivation d'équipes d'animateurs, gestion des situations de crise.",
        "Conception et animation de modules officiels de formation BAFA, pour certifier les futurs professionnels de l'animation.",
    ],
  },
];

 const educations = [
    {
      name: "Luleå University of Technology \n Luleå, Suède",
      degree: "Magister en Data Science",
      branch: "Data Science \n Intelligence Artificielle",
      marks: "GPA : 3,6/4",
      year: "2024 - 2025",
      image: ltu,
    },
    {
      name: "INP-ENSEEIHT (Centrale Toulouse) \n Toulouse, France",
      degree: "Diplôme d'ingénieur",
      branch: "Génie logiciel \n Intelligence artificielle",
      marks: "GPA : 3,7/4",
      year: "2022 - 2025",
      image: enseeiht,
    },
    {
      name: "Université Paul Sabatier \n Toulouse, France",
      degree: "Licence d'informatique",
      branch: "Informatique \n - ",
      marks: "GPA : 3,9/4 (1st/180)",
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

  // Libellés d'interface de la facette nuit (même forme que dans index.js).
  const nightUi = {
    nav: { projects: "Projets", experience: "Expérience", contact: "Contact", cta: "Me contacter", back: "Retour" },
    hero: {
      badge: "Ingénieur IT & Builder — Toulouse",
      titlePre: "Bonjour, moi c'est",
      name: "Jérémy Angulo",
      typed: ["Ingénieur IT", "Builder IA", "Business Manager le jour"],
      intro: "Je suis ingénieur en informatique, spécialisé dans le lien entre projets techniques complexes et objectifs business.<br/><br/>Ma passion : mener des équipes et transformer des idées innovantes en solutions numériques concrètes, à fort impact.",
      ctaProjects: "Voir mes projets",
      cta3d: "Découvre-moi en 3D",
      chipBottom: "IA · Full-stack · Mobile",
      alt: "Jérémy Angulo, ingénieur la nuit",
    },
    sections: {
      educationSub: "Côté études...",
      educationTitle: "Formation.",
      projectsSub: "Mon travail",
      projectsTitle: "Projets.",
      experienceSub: "Ce que j'ai fait jusqu'ici",
      experienceTitle: "Expérience.",
      achievementSub: "Quelques repères...",
      achievementTitle: "Distinctions.",
      link: "LIEN",
    },
    contactUi: {
      sub: "On échange ?",
      title: "Contact.",
      nameLabel: "Votre nom",
      namePlaceholder: "Nom",
      emailLabel: "Votre email",
      emailPlaceholder: "Email",
      messageLabel: "Votre message",
      messagePlaceholder: "Message",
      send: "Envoyer",
      sending: "Envoi en cours...",
      fillAll: "Merci de remplir tous les champs.",
      success: "Merci ! Je vous réponds au plus vite.",
      error: "Une erreur est survenue. Merci de réessayer.",
    },
    detail: { back: "Retour aux projets", notFound: "Projet introuvable !" },
    resume: { title: "Mon CV", download: "Télécharger" },
    contentNav: { home: "Accueil", education: "Formation", projects: "Projets", experience: "Expérience", contact: "Contact" },
  };

  export { list, profiles, achievements, experiences, educations, entrepreneurshipProjects, aiAndDeepTechProjects, itConsultingProjects, leadershipAndInitiativesProjects, allProjects, nightUi };
