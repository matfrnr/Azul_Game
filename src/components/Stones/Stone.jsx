import React from "react";
import PropTypes from "prop-types";
import { STONE_COLORS, STONE_TYPES } from "../../constants";
import styles from "./Stone.module.scss";

import mindStone from "../../assets/stones/mind.png";
import powerStone from "../../assets/stones/power.png";
import realityStone from "../../assets/stones/reality.png";
import spaceStone from "../../assets/stones/space.png";
import timeStone from "../../assets/stones/time.png";

const STONE_IMAGES = {
  [STONE_TYPES.MIND]: mindStone,
  [STONE_TYPES.REALITY]: realityStone,
  [STONE_TYPES.SPACE]: spaceStone,
  [STONE_TYPES.POWER]: powerStone,
  [STONE_TYPES.TIME]: timeStone,
};

export const Stone = ({ stoneType, size = "medium", className = "" }) => {
  const color = STONE_COLORS[stoneType];
  const image = STONE_IMAGES[stoneType];
  const backgroundColor = color ? `${color}33` : "rgba(255,255,255,0.15)";
  const borderColor = color ? `${color}bb` : "rgba(255,255,255,0.35)";
  const boxShadow = color ? `0 0 18px ${color}55` : "0 0 15px rgba(0,0,0,0.25)";

  return (
    <div
      className={`${styles.stone} ${styles[size]} ${className}`}
      data-stone-type={stoneType}
      style={{ backgroundColor, boxShadow, border: `1px solid ${borderColor}` }}
    >
      {image ? (
        <img
          src={image}
          alt={`${stoneType} stone`}
          className={styles.stoneImage}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      ) : (
        <span className={styles.stoneLabel}>{stoneType?.[0] || "?"}</span>
      )}
      <div className={styles.glow} style={{ backgroundColor: color }} />
    </div>
  );
};

Stone.propTypes = {
  stoneType: PropTypes.string.isRequired,
  size: PropTypes.oneOf(["small", "medium", "large"]),
  className: PropTypes.string,
};

export default Stone;
