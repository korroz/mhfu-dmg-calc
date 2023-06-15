import { produce } from 'immer';
import React, { useState } from 'react';

const sharpnessRaw = [0.5, 0.75, 1.0, 1.125, 1.25, 1.3, 1.5];
const sharpnessElement = [0.25, 0.5, 0.75, 1.0, 1.0625, 1.125, 1.2];
const sharpnessIndex = ['red', 'orange', 'yellow', 'green', 'blue', 'white', 'purple'];

const weaponClassMultiplier = [4.8, 4.8, 1.4, 1.4, 5.2, 5.2, 2.3, 2.3];
const weaponClassIndex = ['greatsword', 'longsword', 'sword and shield', 'dual blades', 'hammer', 'hunting horn', 'lance', 'gunlance'];

interface Weapon {
  raw: number;
  classMultiplierIndex: number;
  element: number;
  affinity: number;
  sharpnessIndex: number;
}

interface Motion {
  value: number;
  sharpnessModifier: number;
  // damageMultiplier: number; // GS sweetspot
  // elementModifier: number; // DB shenanigans
}

interface Monster {
  hzRaw: number;
  hzElement: number;
  defense: number;
  rage: number;
}

interface Damage {
  raw: number;
  element: number;
  critRaw: number;
  avgRaw: number;
}

export function DamageCalculator() {
  // True raw: Raw / WeaponMultiplier
  // True element: Element / 10
  // RAW: TrueRaw * Motion * Sharpness * Hitzone * Defense * Rage * Crit
  // ELE: TrueElement * Shapness * Hitzone * Defense * Rage

  // Sword and shield attack power values
  // const dvalues = [84, 98, 112, 126, 140, 154, 168, 182, 196, 210, 224, 238, 252, 266, 280, 294, 308, 322, 336, 350, 364, 378, 392, 406, 420, 434, 448, 462, 490];
  // Apparently weapon raw starts at 60 and ends at at 350 with steps of 10, except for 340 (which no weapon seem to have a version of).
  // const rawSteps = [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 350];

  const [weapon, setWeapon] = useState<Weapon>({
    raw: 252 / 1.4,
    classMultiplierIndex: weaponClassIndex.indexOf('sword and shield'),
    element: 570 / 10 * 1,
    affinity: .35,
    sharpnessIndex: sharpnessIndex.indexOf('green'),
  });
  const [moves, setMoves] = useState<Motion[]>([
    { value: .14, sharpnessModifier: 1.12 },
    { value: .13, sharpnessModifier: 1.12 },
    { value: .11, sharpnessModifier: 1.12 }
  ]);
  const [monster, setMonster] = useState<Monster>({
    hzRaw: .50,
    hzElement: .20,
    defense: 1,
    rage: 1,
  });

  const [damage, totalDamage] = calculateDamage(weapon, moves, monster);
  return <div className='damage-calculator'>
    <Weapon value={weapon} onChange={setWeapon} />
    <Moves values={moves} onChange={setMoves} />
    <Monster value={monster} onChange={setMonster} />
    <Summary weapon={weapon} moves={moves} monster={monster} />
    <Damage total={totalDamage} moves={damage} />
  </div>;
}

function Weapon({ value: weapon, onChange: upstream }: { value: Weapon, onChange: (value: Weapon) => void }) {
  const classMultiplier = weaponClassMultiplier[weapon.classMultiplierIndex];
  return <div className='weapon'>
    <h2>Weapon</h2>
    <label htmlFor='weapon-class'>Type</label>
    <select name='weapon-class' value={weapon.classMultiplierIndex} onChange={e => upstream({ ...weapon, classMultiplierIndex: Number(e.target.value)})}>
      {weaponClassIndex.map((wc, i) => <option key={i} value={i}>{wc}</option>)}
    </select>
    <NumberInput name='weapon-damage' label='Damage' value={bloatRaw(weapon.raw, classMultiplier)} onChange={v => upstream({ ...weapon, raw: v / classMultiplier })} />
    <NumberInput name='weapon-element' label='Element' value={bloatElement(weapon.element)} onChange={v => upstream({ ...weapon, element: v / 10 })} />
    <NumberInput name='weapon-affinity' label='Affinity' value={displayValue(weapon.affinity)} onChange={v => upstream({ ...weapon, affinity: v / 100 })} />
    <label htmlFor='weapon-sharpness'>Sharpness</label>
    <select name='weapon-sharpness' value={weapon.sharpnessIndex} onChange={e => upstream({ ...weapon, sharpnessIndex: Number(e.target.value)})}>
      {sharpnessIndex.map((si, i) => <option key={i} value={i}>{si}</option>)}
    </select>
    {/* <pre>{JSON.stringify(weapon, undefined, 2)}</pre> */}
  </div>;
}

function NumberInput({ name, label, value, onChange }: { name: string, label: string | JSX.Element, value: number, onChange: (value: number) => void }) {
  return <>
    <label htmlFor={name}>{label}</label>
    <input name={name} type='number' onChange={e => onChange(e.target.valueAsNumber)} value={value} />
  </>
}

function Moves({ values: moves, onChange: upstream }: { values: Motion[], onChange: (values: Motion[]) => void }) {
  return <div className='moves'>
    <h2>Moves</h2>
    <button onClick={() => upstream(moves.concat({ value: .1, sharpnessModifier: 1 }))}>+</button>
    <ul>
      {moves.map((move, i) => <li key={i}>
        <button onClick={() => upstream(moves.filter((_, index) => index !== i))}>-</button>
        <NumberInput name={'motion-value' + i} label='Motion value' value={displayValue(move.value)} onChange={v => upstream(produce(moves, draft => { draft[i].value = v / 100; }))} />
        <NumberInput name={'motion-sharp' + i} label='Sharpness modifier' value={move.sharpnessModifier} onChange={v => upstream(produce(moves, draft => { draft[i].sharpnessModifier = v; }))} />
      </li>)}
    </ul>
    {/* <pre>{JSON.stringify(moves, undefined, 2)}</pre> */}
  </div>;
}

function Monster({ value: monster, onChange: upstream }: { value: Monster, onChange: (value: Monster) => void }) {
  return <div className='monster'>
    <h2>Monster</h2>
    <NumberInput name='monster-hz-raw' label='Raw hitzone value' value={monster.hzRaw * 100} onChange={v => upstream(produce(monster, draft => { draft.hzRaw = v / 100 }))} />
    <NumberInput name='monster-hz-element' label='Element hitzone value' value={monster.hzElement * 100} onChange={v => upstream(produce(monster, draft => { draft.hzElement = v / 100 }))} />
    {/* <pre>{JSON.stringify(monster, undefined, 2)}</pre> */}
  </div>;
}

function Summary({ weapon, moves, monster }: { weapon: Weapon, moves: Motion[], monster: Monster }) {
  return <div className='summary'>
    <h2>Summary</h2>
    <div>
      <code>Weapon: {weaponClassIndex[weapon.classMultiplierIndex]}</code>
    </div>
    <div>
      <code>Raw (true): {bloatRaw(weapon.raw, weaponClassMultiplier[weapon.classMultiplierIndex])} ({weapon.raw}), Element: {bloatElement(weapon.element)}, Affinity: {displayValue(weapon.affinity)}%, Sharp: {sharpnessIndex[weapon.sharpnessIndex]}</code>
    </div>
    <div>
      <code>Monster - Raw HZV: {displayValue(monster.hzRaw)}, Elemental HZV: {displayValue(monster.hzElement)}</code>
    </div>
    <div>
      <code>Moves: {moves.map(m => displayValue(m.value)).join(' + ')}</code>
    </div>
  </div>;
}
function Damage({ total, moves }: { total: Damage, moves: Damage[] }) {
  return <div className='damage'>
    <h2>Damage</h2>
    {moves.map((d, i) => <div key={i}><code>Raw: {d.raw} (+{d.critRaw} crit), Element: {d.element}</code></div>)}
    <p>
      <code>Total: {total.raw + total.element} ({total.raw} raw + {total.element} elemental), Avg total with affinity: {Math.round((total.avgRaw + total.element) * 100) / 100}</code>
      {/* <pre>{JSON.stringify(damage)}</pre> */}
    </p>
  </div>;
}

function bloatRaw(raw: number, classMultiplier: number) {
  return Math.round(raw * classMultiplier);
}
function bloatElement(element: number) {
  return Math.round(element * 10);
}
function displayValue(monsterHunterMultiplier: number) {
  return Math.round(monsterHunterMultiplier * 100);
}

function calculateDamage(weapon: Weapon, moves: Motion[], monster: Monster): [Damage[], Damage] {
  const damage = moves.map<Damage>(move => {
    const motionValue = move.value;
    const sharpRaw = move.sharpnessModifier * sharpnessRaw[weapon.sharpnessIndex];
    const sharpElement = move.sharpnessModifier * sharpnessElement[weapon.sharpnessIndex];
    const crit = weapon.affinity > 0 ? .25 :
      weapon.affinity < 0 ? -.25 :
      0;
    const raw = weapon.raw * motionValue * sharpRaw * monster.hzRaw * monster.defense * monster.rage;
    const rawCrit = Math.floor(raw + raw * crit) - Math.floor(raw);
    const element = weapon.element * sharpElement * monster.hzElement * monster.defense * monster.rage;
    return {
      raw: Math.floor(raw),
      element: Math.floor(element),
      critRaw: rawCrit,
      avgRaw: rawCrit * Math.abs(weapon.affinity) + Math.floor(raw)
    };
  });
  const totalDamage = damage.reduce((a, b) => ({
    raw: a.raw + b.raw,
    element: a.element + b.element,
    critRaw: a.critRaw + b.critRaw,
    avgRaw: a.avgRaw + b.avgRaw
  }));
  return [
    damage,
    totalDamage
  ];
}
