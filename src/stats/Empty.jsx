// src/stats/Empty.jsx — état vide commun des tuiles : la phrase seule,
// « Aucune donnée sur la période. », en 13.5 px muted (ni icône ni cadre) ;
// la tuile garde sa tête et son corps à hauteur minimale.

const Empty = ({ text = "Aucune donnée sur la période." }) => (
  <p className="stats-empty">{text}</p>
);

export default Empty;
