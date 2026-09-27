import React, { useState } from 'react';
import {
  Search,
  ArrowUpRight,
  Copy,
  Check,
  PenLine,
} from 'lucide-react';

export interface PromptPlaybookItem {
  id: string;
  category:
    | 'gos'
    | 'audits'
    | 'visuals'
    | 'web_intel'
    | 'pod'
    | 'parenting'
    | 'memory';
  categoryLabel: string;
  capabilityTag: string;
  title: string;
  description: string;
  prompt: string;
  recommendedEtId?: string;
  requiresWebSearch?: boolean;
}

export const PROMPT_LIBRARY_ITEMS: PromptPlaybookItem[] = [
  {
    id: 'pl-gos-counter',
    category: 'gos',
    categoryLabel: 'GOS & B2B Growth',
    capabilityTag: 'Deal Architecture',
    title: 'Unbundle a Retainer Discount Request',
    description:
      'Turns a prospect asking for a 40% retainer discount into a paid 30-day Diagnostic Sprint without lowering your monthly anchor.',
    prompt:
      'A luxury real estate prospect loves our GOS pitch but wants to cut the retainer from $18k/mo to $11k/mo "just to test the waters for 90 days." Build me a counter-offer architecture that unbundles scope into a paid 30-day Diagnostic Sprint and protects the $18k/mo anchor.',
    recommendedEtId: 'et-gos-architect',
  },
  {
    id: 'pl-gos-funnel',
    category: 'gos',
    categoryLabel: 'GOS & B2B Growth',
    capabilityTag: 'Funnel Diagnostics',
    title: '4-Pillar GOS Pipeline Velocity Audit',
    description:
      'Diagnoses conversion drop-offs between Authority Infiltration, High-Fidelity Diagnosis, Solution Engineering, and Retention.',
    prompt:
      'Our inbound discovery calls are booking well, but high-ticket prospects stall for 3+ weeks after we send the proposal. Audit this bottleneck through the 4 GOS Pillars and give me a step-by-step live-close protocol.',
    recommendedEtId: 'et-gos-architect',
  },
  {
    id: 'pl-audit-termsheet',
    category: 'audits',
    categoryLabel: 'Deal & Document Audits',
    capabilityTag: 'First-Principles Redline',
    title: 'Poke Holes in a Revenue-Share or Production Deal',
    description:
      'Exposes hidden accounting traps, unilateral termination clauses, and asymmetric risk before you commit time or IP.',
    prompt:
      'A production partner wants a 50/50 split on net profits for a documentary project where I bring the core IP and distribution relationships. Audit the incentive asymmetry from first principles and give me the exact redline terms I should demand.',
    recommendedEtId: 'et-deal-skeptic',
  },
  {
    id: 'pl-audit-deck',
    category: 'audits',
    categoryLabel: 'Deal & Document Audits',
    capabilityTag: 'Multimodal File Audit',
    title: '7-Rule Stress-Test on Any Attached PDF or Deck',
    description:
      'Drop any PDF contract, pitch deck, or spreadsheet into the chat bar and run an unsweetened logic and unit-economics audit.',
    prompt:
      'Audit the attached document using the Seven Rules. List every unverified assumption, logic gap, unit-economics vulnerability, and the top 3 clarifying questions I should ask before moving forward.',
    recommendedEtId: 'et-deal-skeptic',
  },
  {
    id: 'pl-visual-penthouse',
    category: 'visuals',
    categoryLabel: '8K Visuals & Mockups',
    capabilityTag: 'Inline Image Render',
    title: 'Luxury Architectural Pitch Deck Render',
    description:
      'ChatET generates a high-resolution 8K editorial concept directly inside the chat response alongside creative direction.',
    prompt:
      'Generate an image of a sleek, minimalist luxury penthouse living room overlooking Manhattan at dusk, with warm recessed architectural lighting, floor-to-ceiling glass, and curated modern art, followed by 3 positioning hooks for a high-end real estate pitch deck.',
  },
  {
    id: 'pl-visual-pod',
    category: 'visuals',
    categoryLabel: '8K Visuals & Mockups',
    capabilityTag: 'Product Mockup + SEO',
    title: 'Etsy Heavyweight Apparel Mockup & Listing Strategy',
    description:
      'Renders a studio-grade apparel or drinkware concept and writes high-converting Etsy title tags and positioning.',
    prompt:
      'Generate an image of a premium heavyweight washed-black oversized t-shirt on a minimalist concrete studio backdrop with subtle architectural line art, and give me the unit-margin pricing strategy and 13 high-intent Etsy SEO tags.',
    recommendedEtId: 'et-pod-economist',
  },
  {
    id: 'pl-visual-doc',
    category: 'visuals',
    categoryLabel: '8K Visuals & Mockups',
    capabilityTag: 'Storyboard + Thesis',
    title: 'Cinematic Documentary Keyframe & Distribution Play',
    description:
      'Creates a 35mm documentary keyframe look-and-feel and pairs it with independent distribution vs. streamer licensing math.',
    prompt:
      'Generate a cinematic 35mm documentary film still of an indie music producer working late in a vintage analog recording studio with warm tungsten lighting, and break down the first-principles economics of direct-to-audience distribution versus a streamer buyout.',
  },
  {
    id: 'pl-web-market',
    category: 'web_intel',
    categoryLabel: 'Live Web Intelligence',
    capabilityTag: 'Google Search Grounded',
    title: 'Live Market & Competitor Benchmark Brief',
    description:
      'Uses real-time Google Search grounding to pull current market figures, recent industry shifts, and clickable source links.',
    prompt:
      'Use live web search to analyze current B2B growth agency retainer benchmarks and how AI automation is shifting senior strategy pricing this year. Cite verified sources.',
    requiresWebSearch: true,
  },
  {
    id: 'pl-web-science',
    category: 'web_intel',
    categoryLabel: 'Live Web Intelligence',
    capabilityTag: 'Scientific Skepticism',
    title: 'Evidence-First Deep Dive on Health, Tech, or Science',
    description:
      'Separates peer-reviewed consensus from hype on longevity, canine health, AI hardware, or macroeconomics.',
    prompt:
      'What does current verifiable evidence actually say about optimal daily exercise, joint-health nutrition, and cognitive enrichment for an active dog during high-intensity work weeks? Flag any approximate claims.',
    requiresWebSearch: true,
  },
  {
    id: 'pl-pod-margin',
    category: 'pod',
    categoryLabel: 'Etsy & POD Economics',
    capabilityTag: 'Contribution Margin Math',
    title: 'Print-on-Demand Fee & Offsite Ads Stress-Test',
    description:
      'Itemizes blank cost, shipping tiers, 6.5% transaction fees, payment processing, and 12%–15% Offsite Ads impact.',
    prompt:
      'Calculate the exact net profit and margin sensitivity on a $36 heavyweight POD tee ($14.80 base + shipping cost) across three scenarios: organic Etsy sale, Etsy Ads at $0.45 CPC (3.2% CVR), and a mandatory 12% Offsite Ad order.',
    recommendedEtId: 'et-pod-economist',
  },
  {
    id: 'pl-pod-bundle',
    category: 'pod',
    categoryLabel: 'Etsy & POD Economics',
    capabilityTag: 'AOV Escalator',
    title: 'Multi-Unit Bundle Discount That Protects Margin',
    description:
      'Uses second-item incremental shipping savings to subsidize a 2+ item cart promotion instead of running a margin-killing flat sale.',
    prompt:
      'Design a 2-item and 3-item bundle promotion for my Etsy shop where the incremental shipping savings on the second unit fund the discount. Show the step-by-step unit math so my net margin stays above 45%.',
    recommendedEtId: 'et-pod-economist',
  },
  {
    id: 'pl-parent-coparent',
    category: 'parenting',
    categoryLabel: 'Parenting & Life',
    capabilityTag: 'Low-Friction Comms',
    title: '2-Sentence Calm Co-Parenting Logistics Script',
    description:
      'Strips out defensiveness and emotional bait to resolve schedule changes or household critiques in two neutral sentences.',
    prompt:
      'My co-parent sent a long text frustrated about a schedule mix-up on teenage pickup times this week. Give me a calm, zero-friction 2-sentence reply that fixes the logistics without opening a debate.',
    recommendedEtId: 'et-coparenting',
  },
  {
    id: 'pl-parent-teen',
    category: 'parenting',
    categoryLabel: 'Parenting & Life',
    capabilityTag: 'Adolescent Autonomy',
    title: 'Teen Curfew & Accountability Without a 45-Minute Debate',
    description:
      'Pairs empathy with a clear, non-negotiable boundary and an earned scoreboard for more independence.',
    prompt:
      'My teenager says an 11:30 PM Friday curfew is unfair because "everyone else stays out until 1 AM." Give me a 25-second script that acknowledges the social friction, holds the line calmly, and sets a 4-week scoreboard to earn a later curfew.',
    recommendedEtId: 'et-coparenting',
  },
  {
    id: 'pl-memory-teach',
    category: 'memory',
    categoryLabel: 'Memory & Custom ETs',
    capabilityTag: 'Permanent Memory',
    title: 'Teach ChatET a Permanent Fact on the Fly',
    description:
      'Any time you say "Remember that...", ChatET automatically extracts and saves the fact to your Cloud Memory Bank.',
    prompt:
      'Remember that my minimum engagement floor for new ET Digital advisory clients is $9,500 for a 30-day diagnostic sprint or $18,000/month for full GOS retainer architecture. Confirm how this fits our positioning.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Capabilities' },
  { id: 'gos', label: 'GOS & B2B Growth' },
  { id: 'audits', label: 'Deal & Doc Audits' },
  { id: 'visuals', label: '8K Visuals & Mockups' },
  { id: 'web_intel', label: 'Live Web Intel' },
  { id: 'pod', label: 'Etsy & POD Math' },
  { id: 'parenting', label: 'Parenting & Life' },
  { id: 'memory', label: 'Memory & Custom ETs' },
];

interface PromptLibraryViewProps {
  onRunPrompt: (prompt: string, recommendedEtId?: string, enableWebSearch?: boolean) => void;
  onLoadPromptIntoInput: (prompt: string, recommendedEtId?: string) => void;
}

export const PromptLibraryView: React.FC<PromptLibraryViewProps> = ({
  onRunPrompt,
  onLoadPromptIntoInput,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = PROMPT_LIBRARY_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="text-xs text-cyan-400 font-medium mb-1">
              Playbooks · Multimodal · Live Search · 8K Renders
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
              ChatET Prompt Library
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Curated high-leverage prompts showcasing the sharpest things ChatET can do across growth strategy, deal redlining, POD unit math, 8K image generation, and family logistics.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 flex-shrink-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playbooks..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Interactive Category Filter Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Prompt Playbook Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                {/* Unboxed Metadata Kicker */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-cyan-400 font-medium">{item.categoryLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.capabilityTag}</span>
                </div>

                <h3 className="text-base font-bold font-heading text-white leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>

                {/* Prompt Preview Box */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 font-mono leading-relaxed">
                  &ldquo;{item.prompt}&rdquo;
                </div>
              </div>

              {/* Card Action Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onLoadPromptIntoInput(item.prompt, item.recommendedEtId)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    title="Load into chat box so you can edit or attach files before sending"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    <span>Edit in Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.prompt)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="Copy prompt text"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onRunPrompt(item.prompt, item.recommendedEtId, item.requiresWebSearch)
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <span>Run Now</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
