// All site copy and data. No strings in components.

export const META = {
  name: 'magadhi.',
  fullName: 'Magadhi Ravishankar',
  tagline: 'Biotech undergrad at the brain-machine edge.',
  est: 'est. 17.01.06',
  version: 'v7.4',
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

// Who she is and when she is free. The one question a visitor scanning the
// hero should be able to answer without scrolling: is she available, and when.
// No CGPA here, by her call.
export const PROFILE = {
  degree: 'B.Tech Biotechnology',
  school: 'Manipal University Jaipur',
  graduating: 'graduating mid-2027',
  // Hers, 2026-10-01: the hero does not advertise availability, and nothing
  // anywhere says she is "free". That reads as an unbooked freelancer, which
  // is the opposite of what the rest of the page is doing. The dates survive
  // on the contact screen as the practical fact a lab needs, phrased as the
  // next thing she is doing rather than as a vacancy.
  nextUp: 'research internship, Jan – Jun 2027',
  // the compressed hero version: who and where, nothing about being available
  short: 'b.tech biotechnology · manipal university jaipur',
};

// The file lives in public/ and ships at the site root.
export const CV = {
  label: 'download CV',
  href: '/Magadhi-Ravishankar-CV.pdf',
  file: 'Magadhi-Ravishankar-CV.pdf',
  note: 'pdf · 1 page',
};

export const SOCIALS = [
  { label: 'magadhiravishankar', href: 'https://www.linkedin.com/in/magadhiravishankar/', kind: 'LinkedIn' },
  { label: 'magfrfr', href: 'https://github.com/magfrfr', kind: 'GitHub' },
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
        // The lead entry gets the room a case study needs. `the catch` is the
        // point of the whole block: she found the leak herself and the number
        // on this site went DOWN because of it. Do not soften it, and do not
        // restore the pre-leak 75.5%.
        study: {
          label: 'case study',
          rows: [
            {
              k: 'data',
              v: 'PhysioNet motor imagery. 224 trials from 5 subjects, 64 channels at 160 Hz.',
            },
            {
              k: 'method',
              v: '8–30 Hz mu/beta bandpass, CSP decomposition, bandpower features across C3, Cz and C4. LDA against SVM.',
            },
            {
              k: 'the catch',
              v: 'The first version scored 75.5%. CSP had been fitted over the whole dataset before the split, so the spatial filters had already seen the test trials. Refitting CSP inside every fold dropped it to 68.3%. That is the honest number and it is the one on this page.',
            },
            {
              k: 'result',
              v: '68.3% cross-validated against a 50% chance baseline. Leave-one-subject-out sits at 50.0%: the filters do not transfer to a head they were not fitted on, which is the open problem in the field rather than a bug in the pipeline.',
            },
          ],
        },
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
    tools: true,
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
  { id: 'ghungroo', name: 'bharatanatyam', fact: 'the rhythm is spoken first, tha ka dhi mi' },
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

// The tools band at the foot of the work chapter. Straight off her resume, so
// nothing here is aspirational.
export const TOOLS = [
  {
    id: 'technical',
    label: 'technical',
    items: ['Python', 'MNE', 'scikit-learn', 'EEG signal processing', 'machine learning', 'JavaScript', 'React', 'Next.js', 'cell culture'],
  },
  {
    id: 'strategy',
    label: 'strategy',
    items: ['customer strategy', 'go-to-market', 'investor reporting', 'pitch development', 'market research'],
  },
  {
    id: 'languages',
    label: 'languages',
    items: ['English', 'Hindi', 'Tamil'],
  },
];

export const BUNNIES = {
  ash: { name: 'ash', palette: 'brown' },
  kiko: { name: 'kiko', palette: 'lavender' },
};
