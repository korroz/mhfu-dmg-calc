import React from 'react';

export function DamageCalculator() {
  // True raw: Raw / WeaponMultiplier
  // True element: Element / 10
  // RAW: TrueRaw * Motion * Sharpness * Hitzone * Defense * Rage * Crit
  // ELE: TrueElement * Shapness * Hitzone * Defense * Rage
  return <div className="">Hello</div>;
}

interface WeaponStats {
  readonly raw: number;
}
