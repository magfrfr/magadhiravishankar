// All site copy and data. No strings in components.

export const META = {
  name: 'magadhi.',
  fullName: 'Magadhi Ravishankar',
  tagline: 'Biotech undergrad at the brain–machine edge. Chennai, always.',
  est: 'est. 17.01.06',
  version: 'v4.6',
};

// Boot sequence copy — the site "tunes in" before the hero.
export const LOADER = {
  line: 'acquiring signal',
  done: 'signal acquired',
};

// Marquee band between the work and the inventory. Facts only — every line
// here already appears somewhere else on the site.
export const TICKER = [
  'biotech at the brain–machine edge',
  '70.6% BCI accuracy',
  'top 20 national',
  '150+ startups vetted',
  'jack of all trades, master of some',
  'chennai, always',
];

// The CD player. public/music/track.wav is a generated placeholder tone —
// drop the real song in its place and put the real title/artist here.
export const MUSIC = {
  title: 'no track yet',
  artist: 'placeholder tone',
  src: '/music/track.wav',
};

export const SOCIALS = [
  { label: 'magadhiravishankar', href: 'https://www.linkedin.com/in/magadhiravishankar/', kind: 'LinkedIn' },
  { label: '@magadhiii', href: 'https://www.instagram.com/magadhiii/', kind: 'Instagram' },
  { label: 'mww404', href: 'https://in.pinterest.com/mww404/', kind: 'Pinterest' },
  { label: 'magadhi.rs@gmail.com', href: 'mailto:magadhi.rs@gmail.com', kind: 'Email' },
];

// Chapter ids anchor the 3D scene: the orb morphs moon → wireframe globe →
// tennis ball → moon as these sections pass the viewport center.
export const CHAPTERS = [
  {
    id: 'hero',
    eyebrow: 'signal acquired · 60 fps',
    title: null,
  },
  {
    id: 'builder',
    eyebrow: 'experience · 2024 → 2026',
    title: 'the work so far',
    lines: [],
    experience: [
      {
        when: 'dec 2024 – dec 2025',
        role: 'Customer Strategy & Founder’s Office',
        org: 'Walkins',
        points: [
          'Top 20 nationally — Localhost HQ',
          'Secured grants, incubation approval and government certification',
        ],
      },
      {
        when: 'may – jul 2025',
        role: 'Investment Analysis',
        org: 'Alpha Seed Network',
        points: [
          '150+ startups vetted',
          'Reports on viability, market positioning and strategic fit',
        ],
      },
      {
        when: '2026',
        role: 'Motor Imagery BCI',
        org: 'personal project',
        points: [
          'PhysioNet EEG · 64 channels · left vs right hand imagery',
          '8–30 Hz mu/beta · CSP features · SVM 70.6% test, 75.5% cross-validated',
        ],
      },
    ],
    tags: ['70.6% BCI accuracy', 'top 20 national', '150+ startups vetted'],
    photos: [],
  },
  {
    id: 'everything',
    eyebrow: 'jack of all trades · master of some',
    title: 'all of it',
    lines: [
      'Jack of all trades, master of some.',
      'The pattern is the same every time: repeat the hard thing until it stops being hard.',
    ],
    tags: [],
    photos: [],
    toybox: true,
  },
  {
    id: 'connect',
    eyebrow: 'signal found',
    title: 'say hi',
    lines: [
      'Most useful where technical depth and real-world execution are the same job. If you’re building something real, say hi.',
    ],
    tags: [],
    photos: [],
  },
];

// The inventory: everything she does, grouped for the jack-of-all-trades section.
export const CATEGORIES = [
  { id: 'stage', label: 'stage', items: ['ghungroo', 'tanpura', 'guitar'] },
  { id: 'sport', label: 'sport', items: ['tennis', 'paddle', 'goggles', 'horse', 'bicycle', 'dumbbell'] },
  { id: 'offhours', label: 'off hours', items: ['wheel', 'book', 'palette', 'camera'] },
];

export const ITEMS = [
  { id: 'ghungroo', name: 'bharatanatyam', fact: 'the rhythm is spoken first — tha ka dhi mi' },
  { id: 'tanpura', name: 'carnatic singing', fact: 'same rhythm, sung' },
  { id: 'guitar', name: 'guitar', fact: 'a little, honestly' },
  { id: 'tennis', name: 'tennis', fact: 'played competitively' },
  { id: 'paddle', name: 'table tennis', fact: 'also competitively' },
  { id: 'goggles', name: 'swimming', fact: 'professional' },
  { id: 'horse', name: 'horse riding', fact: 'someone said it was hard' },
  { id: 'bicycle', name: 'cycling', fact: 'city distances, no excuses' },
  { id: 'dumbbell', name: 'gym', fact: 'shows up anyway' },
  { id: 'wheel', name: 'driving', fact: 'long roads, loud music' },
  { id: 'book', name: 'books', fact: 'reads everything' },
  { id: 'palette', name: 'art', fact: 'hands, not prompts' },
  { id: 'camera', name: 'photography', fact: 'usually of the sea' },
];

export const BUNNIES = {
  ash: { name: 'ash', palette: 'brown' },
  kiko: { name: 'kiko', palette: 'lavender' },
};
