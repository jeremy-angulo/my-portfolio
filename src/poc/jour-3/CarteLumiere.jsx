// src/poc/jour-3/CarteLumiere.jsx
// Enveloppe d'éclairage : elle pose sous et sur son enfant deux calques
// décoratifs (une ombre directionnelle, un reflet) orientés par la MÊME lumière
// que le ciel — les variables `--ldx/--ldy/--shx/--shy/--pdx/--pdy` écrites sur
// `.j3-root` par le pilote.
//
// Aucune lecture de rect par carte : tout vient des variables globales. Seul le
// mode « hover » écoute le pointeur, et seulement pour incliner la carte vers
// lui (usePointerVars, qui n'entraîne aucun re-render).

import React, { useRef } from "react";
import usePointerVars from "../shared/usePointerVars";
import useHoverCapable from "../shared/useHoverCapable";
import useReducedMotion from "../shared/useReducedMotion";

/**
 * @param {{ as?: React.ElementType, mode?: "sun"|"hover"|"fixe", tilt?: number,
 *           variant?: "full"|"lite", radius?: number, className?: string,
 *           style?: object, children?: React.ReactNode }} props
 * - `mode="sun"`   : orientation vers le soleil (portrait).
 * - `mode="hover"` : inclinaison vers le pointeur au survol (cartes piliers).
 * - `mode="fixe"`  : ni l'un ni l'autre (formulaire, cartes formation).
 * - `variant="lite"` : ombre seule, sans reflet.
 */
const CarteLumiere = ({
  as: As = "div",
  mode = "fixe",
  tilt = 0,
  variant = "full",
  radius = 20,
  className,
  style,
  children,
  ...reste
}) => {
  const ref = useRef(null);
  const survolPossible = useHoverCapable();
  const mouvementReduit = useReducedMotion();
  const inclinable = mode === "hover" && tilt > 0 && survolPossible && !mouvementReduit;

  // Ratio du pointeur À L'INTÉRIEUR de la carte (0..1), pour l'inclinaison.
  usePointerVars(ref, {
    enabled: inclinable,
    unit: "ratio",
    rest: { x: 0.5, y: 0.5 },
  });

  const classes = ["j3-lit", `j3-lit--${mode}`, `j3-lit--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <As
      ref={ref}
      className={classes}
      style={{ "--j3-tilt": String(tilt), "--j3-r": `${radius}px`, ...style }}
      {...reste}
    >
      <span className="j3-lit__ombre" aria-hidden="true" />
      {children}
      {variant === "full" && (
        <span className="j3-lit__reflet" aria-hidden="true">
          <span className="j3-lit__reflet-in" />
        </span>
      )}
    </As>
  );
};

export default CarteLumiere;
