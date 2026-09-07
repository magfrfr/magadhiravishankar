// All site copy and data. No strings in components.

export const META = {
  name: 'magadhi.',
  fullName: 'Magadhi Ravishankar',
  tagline: 'Biotech undergrad at the brain-machine edge.',
  est: 'est. 17.01.06',
  version: 'v7.1',
};

// Boot sequence copy. Plain on purpose: the loader is the first thing a
// recruiter sees, and it should not sound like a game.
export const LOADER = {
  line: 'loading',
  done: 'ready',
};

// The one call to action, held in the top corner and repeated at the sign-off.
export const CONTACT = {
  label: 'get in touch',
  href: 'mailto:magadhi.rs@gmail.com',
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
    eyebrow: 'biotech · neuro-AI',
    title: null,
  },
  {
    id: 'builder',
    eyebrow: 'selected work · 2024 → 2026',
    title: 'the work so far',
    lines: [],
    // Editorial work list: the headline number is the thing a reader keeps, so
    // it has to be real. `metric` is optional — an entry with no honest figure
    // leaves the column empty rather than carrying an invented one.
    experience: [
      {
        when: '2026',
        role: 'Motor Imagery BCI',
        org: 'personal project',
        metric: '68.3%',
        metricLabel: 'cross-validated',
        points: [
          'PhysioNet EEG · 64 channels · left vs right hand imagery',
          '8–30 Hz mu/beta band · CSP fitted per fold · SVM over LDA',
        ],
        stack: ['Python', 'MNE', 'scikit-learn', 'CSP', 'SVM'],
        href: 'https://github.com/magfrfr/motor-imagery-bci',
      },
      {
        when: 'may – jun 2026',
        role: 'Web Development Intern',
        org: 'AGT Go Digital',
        points: [
          'Custom WordPress child theme: theme.json design tokens, PHP block templates, hand-written CSS',
          'Static export pipeline so a PHP site ships as flat files on Vercel',
        ],
        stack: ['WordPress', 'PHP', 'theme.json', 'CSS', 'Vercel'],
        href: 'https://magadhi-portfolio.vercel.app',
      },
      {
        when: 'dec 2024 – dec 2025',
        role: 'Customer Strategy & Founder’s Office',
        org: 'Walkins',
        metric: 'Top 20',
        metricLabel: 'nationally, Localhost HQ',
        points: [
          'Secured grants, incubation approval and government certification',
        ],
        stack: ['Strategy', 'Fundraising', 'Ops'],
      },
      {
        when: 'may – jul 2025',
        role: 'Investment Analysis',
        org: 'Alpha Seed Network',
        metric: '150+',
        metricLabel: 'startups vetted',
        points: [
          'Reports on viability, market positioning and strategic fit',
        ],
        stack: ['Due diligence', 'Market research'],
      },
    ],
    tags: [],
    photos: [],
  },
  {
    id: 'everything',
    eyebrow: 'outside the lab',
    title: 'all of it',
    lines: [
      'The pattern is the same every time: repeat the hard thing until it stops being hard.',
    ],
    tags: [],
    photos: [],
    range: true,
  },
  {
    id: 'connect',
    eyebrow: 'contact',
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
