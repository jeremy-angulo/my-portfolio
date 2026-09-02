// src/poc/PocRouter.jsx
// Routeur des pages de comparaison : /poc (index) et /poc/<slug> (un POC).
// Chaque POC est chargé à la demande ; le fond du repli suit sa facette.

import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import PocIndex from "./PocIndex";
import registry, { bySlug } from "./registry";

// Un composant paresseux par POC, créé UNE fois au chargement du module :
// appeler React.lazy() pendant le rendu remonterait le POC à chaque frame.
const LAZY = Object.fromEntries(registry.map((poc) => [poc.slug, lazy(poc.load)]));

const PocSlot = () => {
  const { slug } = useParams();
  const entry = bySlug(slug);
  if (!entry) return <Navigate to="/poc" replace />;

  const Page = LAZY[entry.slug];
  const dark = entry.facet === "night";

  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, background: dark ? "#050816" : "#faf6ee" }}
        />
      }
    >
      <Page />
    </Suspense>
  );
};

const PocRouter = () => (
  <Routes>
    <Route index element={<PocIndex />} />
    <Route path=":slug" element={<PocSlot />} />
    <Route path="*" element={<Navigate to="/poc" replace />} />
  </Routes>
);

export default PocRouter;
