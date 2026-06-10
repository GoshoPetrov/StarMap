'use strict';

// ══════════════════════════════════════════════
//  SOLAR SYSTEM DATA
// ══════════════════════════════════════════════

const SOLAR_SYSTEM_DATA = [
  {
    id:'sun', name:'The Sun', type:'star',
    radius:5, color:0xFDB813, emissive:0xFDB813, emissiveIntensity:1.0,
    textureUrl:'https://www.solarsystemscope.com/textures/download/2k_sun.jpg',
    orbitRadius:0, orbitPeriod:0, axialTilt:7.25,
    facts:{ 'Diameter':'1,392,700 km','Mass':'1.989 × 10³⁰ kg','Surface Temp':'5,500 °C','Type':'G-type main-sequence star',
            funFact:'The Sun contains 99.86% of the mass in the solar system.' }
  },
  {
    id:'mercury', name:'Mercury', type:'planet',
    radius:0.5, color:0xB5B5B5,
    textureUrl:'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg',
    orbitRadius:9, orbitPeriod:0.24, axialTilt:0.03,
    facts:{ 'Diameter':'4,879 km','Day Length':'58.6 Earth days','Distance from Sun':'57.9M km','Moons':'0',
            funFact:'Mercury has no atmosphere and extreme temperature swings.' }
  },
  {
    id:'venus', name:'Venus', type:'planet',
    radius:0.95, color:0xE8C56B,
    textureUrl:'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg',
    orbitRadius:14, orbitPeriod:0.62, axialTilt:177.4,
    facts:{ 'Diameter':'12,104 km','Day Length':'243 Earth days','Distance from Sun':'108.2M km','Moons':'0',
            funFact:'Venus rotates backwards and has the hottest surface in the solar system.' }
  },
  {
    id:'earth', name:'Earth', type:'planet',
    radius:1.0, color:0x2E6DB4,
    textureUrl:'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
    orbitRadius:20, orbitPeriod:1.0, axialTilt:23.44,
    moons:[
      { id:'moon', name:'The Moon', radius:0.27, color:0xAAAAAA,
        textureUrl:'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
        orbitRadius:2.5, orbitPeriod:0.075,
        facts:{ 'Diameter':'3,474 km','Distance from Earth':'384,400 km','Moons':'N/A',
                funFact:'The Moon is slowly drifting away from Earth at ~3.8 cm/year.' } }
    ],
    facts:{ 'Diameter':'12,756 km','Day Length':'24 hours','Distance from Sun':'149.6M km','Moons':'1',
            funFact:'Earth is the only known planet with life.' }
  },
  {
    id:'mars', name:'Mars', type:'planet',
    radius:0.6, color:0xC1440E,
    textureUrl:'https://www.solarsystemscope.com/textures/download/2k_mars.jpg',
    orbitRadius:28, orbitPeriod:1.88, axialTilt:25.19,
    moons:[
      { id:'phobos', name:'Phobos', radius:0.18, color:0x8A7A6A, orbitRadius:1.4, orbitPeriod:0.009,
        facts:{ 'Diameter':'22.4 km', funFact:'Phobos will crash into Mars in ~50 million years.' } },
      { id:'deimos', name:'Deimos', radius:0.13, color:0x9A8A7A, orbitRadius:2.2, orbitPeriod:0.034,
        facts:{ 'Diameter':'12.6 km', funFact:'Deimos is one of the smallest known moons in the solar system.' } }
    ],
    facts:{ 'Diameter':'6,792 km','Day Length':'24.6 hours','Distance from Sun':'227.9M km','Moons':'2',
            funFact:'Mars has the tallest volcano in the solar system: Olympus Mons.' }
  },
  {
    id:'jupiter', name:'Jupiter', type:'planet',
    radius:3.5, color:0xC88B3A,
    textureUrl:'https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg',
    orbitRadius:52, orbitPeriod:11.86, axialTilt:3.13,
    moons:[
      { id:'io',       name:'Io',       radius:0.32, color:0xFFEE44, orbitRadius:5,   orbitPeriod:0.0048,
        facts:{ 'Diameter':'3,643 km', funFact:'Io is the most volcanically active body in the solar system.' } },
      { id:'europa',   name:'Europa',   radius:0.28, color:0xD4C8A8, orbitRadius:6.5, orbitPeriod:0.0097,
        facts:{ 'Diameter':'3,122 km', funFact:'Europa likely has a liquid ocean beneath its icy surface.' } },
      { id:'ganymede', name:'Ganymede', radius:0.45, color:0x8899AA, orbitRadius:8.5, orbitPeriod:0.0196,
        facts:{ 'Diameter':'5,268 km', funFact:'Ganymede is the largest moon in the solar system, bigger than Mercury.' } },
      { id:'callisto', name:'Callisto', radius:0.40, color:0x667788, orbitRadius:11,  orbitPeriod:0.0456,
        facts:{ 'Diameter':'4,821 km', funFact:'Callisto has the most cratered surface of any body in the solar system.' } }
    ],
    facts:{ 'Diameter':'142,984 km','Day Length':'9.9 hours','Distance from Sun':'778.5M km','Moons':'95',
            funFact:'The Great Red Spot is a storm larger than Earth that has raged for 350+ years.' }
  },
  {
    id:'saturn', name:'Saturn', type:'planet',
    radius:3.0, color:0xEAD6A3,
    textureUrl:'https://www.solarsystemscope.com/textures/download/2k_saturn.jpg',
    rings:{ innerRadius:3.8, outerRadius:6.5, color:0xC8A96B, opacity:0.7,
            textureUrl:'https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png' },
    orbitRadius:88, orbitPeriod:29.46, axialTilt:26.73,
    moons:[
      { id:'titan',     name:'Titan',     radius:0.44, color:0xE8A030, orbitRadius:10, orbitPeriod:0.0436,
        facts:{ 'Diameter':'5,151 km', funFact:'Titan has a thick nitrogen atmosphere and lakes of liquid methane.' } },
      { id:'enceladus', name:'Enceladus', radius:0.20, color:0xEEEEEE, orbitRadius:7,  orbitPeriod:0.0130,
        facts:{ 'Diameter':'504 km', funFact:'Enceladus shoots geysers of water ice into space.' } }
    ],
    facts:{ 'Diameter':'120,536 km','Day Length':'10.7 hours','Distance from Sun':'1.43B km','Moons':'146',
            funFact:"Saturn is less dense than water — it would float in a large enough ocean." }
  },
  {
    id:'uranus', name:'Uranus', type:'planet',
    radius:2.0, color:0x7DE8E8,
    textureUrl:'https://www.solarsystemscope.com/textures/download/2k_uranus.jpg',
    orbitRadius:120, orbitPeriod:84.01, axialTilt:97.77,
    facts:{ 'Diameter':'51,118 km','Day Length':'17.2 hours','Distance from Sun':'2.87B km','Moons':'28',
            funFact:'Uranus rotates on its side — its axis is tilted nearly 98 degrees.' }
  },
  {
    id:'neptune', name:'Neptune', type:'planet',
    radius:1.9, color:0x3F54BA,
    textureUrl:'https://www.solarsystemscope.com/textures/download/2k_neptune.jpg',
    orbitRadius:152, orbitPeriod:164.8, axialTilt:28.32,
    moons:[
      { id:'triton', name:'Triton', radius:0.25, color:0xCCDDEE, orbitRadius:4, orbitPeriod:0.016,
        facts:{ 'Diameter':'2,707 km', funFact:'Triton orbits Neptune backwards and will be torn apart in ~3.6B years.' } }
    ],
    facts:{ 'Diameter':'49,528 km','Day Length':'16.1 hours','Distance from Sun':'4.50B km','Moons':'16',
            funFact:'Neptune has the fastest winds in the solar system, up to 2,100 km/h.' }
  },
  {
    id:'pluto', name:'Pluto', type:'dwarf planet',
    radius:0.22, color:0xC4A882,
    orbitRadius:190, orbitPeriod:248.0, axialTilt:122.53, orbitInclination:17,
    facts:{ 'Diameter':'2,377 km','Day Length':'6.4 Earth days','Distance from Sun':'5.9B km avg','Moons':'5',
            funFact:'Pluto has a heart-shaped nitrogen ice plain called Tombaugh Regio.' }
  }
];

const ASTEROID_BELT_CFG = { innerRadius:35, outerRadius:48, count:2000, color:0x888888 };