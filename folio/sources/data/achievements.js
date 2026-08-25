import labData from './lab.js'
import projectsData from './projects.js'

// [ groupe, titre, description, total, unique ]
// titre/description : { en, fr } — résolus par I18n.pick dans Achievements.js

export default
[
    [
        'landingLeave',
        { en: 'I’m going on an adventure!', fr: 'Je pars à l’aventure !' },
        { en: 'Get out of the landing area.', fr: 'Sors de la zone d’arrivée.' },
        1
    ],
    [
        'areas',
        { en: 'Traveler', fr: 'Grand voyageur' },
        { en: 'Vist every area.', fr: 'Visite toutes les zones.' },
        13,
        true // Unique
    ],
    [
        'projects',
        { en: 'But can you fix the wifi?', fr: 'Mais tu sais réparer le wifi ?' },
        { en: 'Check every project in the <strong>projects</strong> area.', fr: 'Regarde chaque projet de la zone <strong>projets</strong>.' },
        projectsData.length,
        true // Unique
    ],
    [
        'lab',
        { en: 'I\'m a bit of a scientist myself', fr: 'Un peu scientifique moi-même' },
        { en: 'Check every project in the <strong>lab</strong> area.', fr: 'Regarde chaque expérience du <strong>labo</strong>.' },
        labData.length,
        true // Unique
    ],
    [
        'cookie',
        { en: 'Wake & bake', fr: 'Premier de la fournée' },
        { en: 'Accept <strong>1</strong> cookies.', fr: 'Accepte <strong>1</strong> cookie.' },
        1
    ],
    [
        'cookie',
        { en: 'Making some dough', fr: 'La pâte monte' },
        { en: 'Accept <strong>10</strong> cookies.', fr: 'Accepte <strong>10</strong> cookies.' },
        10
    ],
    [
        'cookie',
        { en: 'So baked right now', fr: 'Bien cuit' },
        { en: 'Accept <strong>100</strong> cookies.', fr: 'Accepte <strong>100</strong> cookies.' },
        100
    ],
    [
        'cookie',
        { en: 'Cookie Clicker', fr: 'Cookie Clicker' },
        { en: 'Accept <strong>1000</strong> cookies.', fr: 'Accepte <strong>1000</strong> cookies.' },
        1000
    ],
    [
        'sea',
        { en: 'Under the sea', fr: 'Sous l’océan' },
        { en: 'Go make friend with the fishes.', fr: 'Va te faire des amis chez les poissons.' },
        1
    ],
    [
        'upsideDown',
        { en: 'Turtle', fr: 'Tortue' },
        { en: 'Get upside down.', fr: 'Retrouve-toi sur le toit.' },
        1
    ],
    [
        'frontFlip',
        { en: 'Teeth first', fr: 'Les dents d’abord' },
        { en: 'Do a front flip and land on your 4 wheels.', fr: 'Fais un front flip et retombe sur tes 4 roues.' },
        1
    ],
    [
        'backFlip',
        { en: 'Flip of faith', fr: 'Salto de la foi' },
        { en: 'Do a back flip and land on your 4 wheels.', fr: 'Fais un back flip et retombe sur tes 4 roues.' },
        1
    ],
    [
        'suspensions',
        { en: 'Lowrider', fr: 'Lowrider' },
        { en: 'Use the vehicle suspensions.', fr: 'Utilise les suspensions du véhicule.' },
        4
    ],
    [
        'honk',
        { en: 'Honk', fr: 'Tût tût' },
        { en: 'Honk me like one of your french driver.', fr: 'Klaxonne comme un vrai conducteur français.' },
        10
    ],
    [
        'explosiveCrates',
        { en: 'Great Explosion Murder God Dynamight', fr: 'Great Explosion Murder God Dynamight' },
        { en: 'Blow up every explosive crate.', fr: 'Fais exploser toutes les caisses explosives.' },
        20,
        true // Unique
    ],
    [
        'goHigh',
        { en: 'Limit the sky', fr: 'Le ciel pour limite' },
        { en: 'Reach <strong>15 meters</strong> high.', fr: 'Atteins <strong>15 mètres</strong> de haut.' },
        15
    ],
    [
        'strike',
        { en: 'F*** it, dude. Let\'s go bowling', fr: 'Allez, on va au bowling' },
        { en: 'Accomplished a strike.', fr: 'Réussis un strike.' },
        1
    ],
    [
        'toiletDown',
        { en: 'Do not disturb', fr: 'Ne pas déranger' },
        { en: 'Knock down the latrine.', fr: 'Renverse les latrines.' },
        1
    ],
    [
        'circuitFinish',
        { en: 'Participation medal', fr: 'Médaille de participation' },
        { en: 'Finish a race.', fr: 'Termine une course.' },
        1
    ],
    [
        'circuitFinishFast',
        { en: 'KA-CHOW!', fr: 'KATCHAO !' },
        { en: 'Finish a race in less than <strong>30s</strong>.', fr: 'Termine une course en moins de <strong>30 s</strong>.' },
        1
    ],
    [
        'circuitLeaderboard',
        { en: 'For the record', fr: 'Pour la postérité' },
        { en: 'Save a time on the leaderboard.', fr: 'Enregistre un temps au classement.' },
        1
    ],
    [
        'fullDay',
        { en: 'Don’t you have work to do?', fr: 'Tu n’as pas du travail, toi ?' },
        { en: 'Spend a full day cycle here in one go.', fr: 'Passe un cycle jour/nuit entier d’une traite.' },
        1
    ],
    [
        'distanceDriven',
        { en: 'Baby step', fr: 'Premiers tours de roue' },
        { en: 'Drive 1km.', fr: 'Roule 1 km.' },
        1
    ],
    [
        'distanceDriven',
        { en: 'Are we there yet?', fr: 'On est bientôt arrivés ?' },
        { en: 'Drive 10km.', fr: 'Roule 10 km.' },
        10
    ],
    [
        'distanceDriven',
        { en: 'Honey, I’m home!', fr: 'Chérie, je suis rentré !' },
        { en: 'Drive 100km.', fr: 'Roule 100 km.' },
        100
    ],
    [
        'sacrifice',
        { en: 'One for the god of Chaos', fr: 'Un pour le dieu du Chaos' },
        { en: 'Sacrifice yourself into the altar.', fr: 'Sacrifie-toi dans l’autel.' },
        1
    ],
    [
        'weatherSnow',
        { en: 'Do you want to build a snowman?', fr: 'Je voudrais un bonhomme de neige' },
        { en: 'Witness snowy weather.', fr: 'Assiste à une chute de neige.' },
        1
    ],
    [
        'weatherRain',
        { en: 'I’m singing in the rain', fr: 'Singin’ in the rain' },
        { en: 'Witness a rainy weather.', fr: 'Assiste à une averse.' },
        1
    ],
    [
        'lightning',
        { en: '1.21 Gigawatts!', fr: '2,21 gigowatts !' },
        { en: 'Get hit by a lightning.', fr: 'Fais-toi frapper par la foudre.' },
        1
    ],
    [
        'waterfall',
        { en: 'Gamer instinct', fr: 'Instinct de gamer' },
        { en: 'What did you expect? A treasure?', fr: 'Tu t’attendais à quoi ? Un trésor ?' },
        1
    ],
    [
        'reset',
        { en: 'Clean your room', fr: 'Range ta chambre' },
        { en: 'Put back everything as it was.', fr: 'Remets tout comme c’était.' },
        1
    ],
    [
        'statueDown',
        { en: 'Revolution!', fr: 'Révolution !' },
        { en: 'Tear that statue down.', fr: 'Fais tomber cette statue.' },
        1
    ],
    [
        'konami',
        { en: 'Up up down down…', fr: 'Haut haut bas bas…' },
        { en: 'You know the rest.', fr: 'Tu connais la suite.' },
        1
    ],
    [
        'debug',
        { en: 'It\'s not a bug, it\'s a feature', fr: 'C’est pas un bug, c’est une feature' },
        { en: 'Access the debug UI.', fr: 'Ouvre l’interface de debug.' },
        1
    ],
    [
        'hacker',
        { en: 'Hacker', fr: 'Hacker' },
        { en: 'This one can’t be achieved.', fr: 'Celui-ci ne peut pas être obtenu.' },
        1
    ],
]
