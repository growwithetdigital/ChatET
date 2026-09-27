import { FocusArea, RuleItem } from '../types';

export const SEVEN_RULES: RuleItem[] = [
  {
    id: 1,
    name: 'UNCERTAINTY',
    summary: "Say plainly: 'I'm not certain, but...'",
    standard: 'Never state a guess as a fact. Acknowledge boundaries of certainty immediately.',
  },
  {
    id: 2,
    name: 'SOURCES',
    summary: "Say: 'I don't have a verified source for this.'",
    standard: 'Never invent paper titles, authors, citations, or URLs.',
  },
  {
    id: 3,
    name: 'STATISTICS',
    summary: 'Flag approximate numbers explicitly',
    standard: 'Flag any figure or metric not 100% verified as approximate.',
  },
  {
    id: 4,
    name: 'RECENT EVENTS',
    summary: 'Flag potential recency boundaries',
    standard: 'Never present stale or training-cutoff information as guaranteed current reality.',
  },
  {
    id: 5,
    name: 'PEOPLE & QUOTES',
    summary: "Say: 'I can't confirm this quote is accurate.'",
    standard: 'Never attribute a quote or speech to a real person unless certified exact.',
  },
  {
    id: 6,
    name: 'CODE / TECHNICAL',
    summary: 'Direct verification in current documentation',
    standard: 'Never fabricate function names, API endpoints, or library syntaxes.',
  },
  {
    id: 7,
    name: 'LOGIC GAPS',
    summary: 'Ask clarifying questions instead of guessing',
    standard: "Never assume unstated context. Surface the missing variables directly to Eric.",
  },
];

export const FOCUS_AREAS: FocusArea[] = [
  {
    id: 'all',
    label: 'Holistic / All Domains',
    shortLabel: 'Holistic',
    description: 'Full multi-disciplinary synthesis across all thinking lenses.',
    iconName: 'Compass',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'gos',
    label: 'Growth & GOS Strategy',
    shortLabel: 'GOS & Growth',
    description: 'ET Digital, growth funnels, enterprise client systems, and incentive dynamics.',
    iconName: 'TrendingUp',
    color: 'from-cyan-400 to-teal-500',
  },
  {
    id: 'ventures',
    label: 'Ventures & Studio Dev',
    shortLabel: 'Ventures & POD',
    description: 'Print-on-demand / Etsy economics, documentary & media studio models.',
    iconName: 'Boxes',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'parenting',
    label: 'Parenting & Co-Parenting',
    shortLabel: 'Parenting',
    description: 'Raising two teenagers, high-context communication, and co-parenting logistics.',
    iconName: 'Users',
    color: 'from-emerald-400 to-cyan-500',
  },
  {
    id: 'first_principles',
    label: 'First-Principles & Skepticism',
    shortLabel: 'First-Principles',
    description: 'Fundamental mechanics, scientific skepticism, tech, and cultural history.',
    iconName: 'Cpu',
    color: 'from-sky-400 to-blue-600',
  },
  {
    id: 'life_personal',
    label: 'Life, Dog & Personal Strategy',
    shortLabel: 'Life & Personal',
    description: 'Daily operational clarity, cities, dog care, finances, and long-term vitality.',
    iconName: 'HeartHandshake',
    color: 'from-teal-400 to-cyan-600',
  },
];

export const TAILORED_PROMPTS = [
  {
    title: 'GOS Strategy Audit',
    area: 'gos',
    prompt: 'Stress-test my Growth Operating System (GOS) framework for a high-ticket client. What are the key points of failure in the conversion funnel?',
  },
  {
    title: 'Print-on-Demand Unit Economics',
    area: 'ventures',
    prompt: 'Break down the margin sensitivity for my Etsy print-on-demand line if customer acquisition costs climb by 25%.',
  },
  {
    title: 'Documentary Studio Distribution',
    area: 'ventures',
    prompt: 'What are the first-principles economics of launching an independent documentary studio today versus traditional licensing?',
  },
  {
    title: 'Co-Parenting Teenagers',
    area: 'parenting',
    prompt: "I need a rational strategy for handling curfew, school accountability, and co-parenting alignment with two teenagers without turning it into a battle.",
  },
  {
    title: 'AI Impact on Marketing Agencies',
    area: 'first_principles',
    prompt: 'From first principles, what parts of a senior marketing strategist’s deliverable are commoditizable by LLMs, and what parts are structurally defensible?',
  },
  {
    title: 'Visual Concept / Architectural Render',
    area: 'ventures',
    prompt: 'Generate an image of a sleek, minimalist luxury penthouse living room overlooking Manhattan at dusk, with warm recessed architectural lighting and curated modern art for a pitch deck.',
  },
  {
    title: 'Document & Strategy Audit',
    area: 'gos',
    prompt: 'I have a strategy document and deck ready to evaluate. What framework should we run to identify leverage points, conversion friction, and unvalidated assumptions?',
  },
  {
    title: 'Dog Health & Routine Optimization',
    area: 'life_personal',
    prompt: 'How can I optimize my dog’s daily exercise, nutrition pacing, and travel routine alongside high-intensity work weeks?',
  },
];
