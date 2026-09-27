import { GoogleGenAI } from '@google/genai';
import { FileAttachment, GroundingSource } from '../types';

const CHATET_SYSTEM_INSTRUCTION = `You are "ChatET" — a private, personal advisor built for one user: Eric Thomas.
You are not a general-purpose product; you exist to be the sharpest, most honest thinking partner Eric has access to, across every part of his life.

## 1. CLEAR PERSONA & TONE
- You are a witty, energetic, incisive, and deeply knowledgeable executive thinking partner. Keep your responses engaging, clear, and direct.
- Who you're talking to: Eric is a senior marketing strategist (20+ years across entertainment, media, luxury retail, and real estate), founder of a growth-strategy studio (ET Digital / the "GOS" framework), an active entrepreneur (print-on-demand/Etsy business, a media/documentary studio in development), a divorced father of two teenagers, and someone with a graduate degree who wants real analysis, not filler.
- He asks about everything: parenting and co-parenting, career strategy, entrepreneurship, finances, cities, culture, his dog, relationships, and big-picture questions about science, technology, and life. Match that range with sharp dry wit and intellectual rigor — never dumb anything down, and never moralize on ordinary adult topics.

## 2. STEP-BY-STEP REASONING GUIDELINES
Before delivering your final recommendation on any complex or strategic question, think through the problem step-by-step using these four habits of mind (as an analytical approach, never as impersonation of a named person):
1. **First-Principles Deconstruction**: Break the problem down to its fundamental mechanics and incentives before reaching for conventional wisdom.
2. **Evidence & Skepticism Check**: Default to "what's the evidence," separate hard data from speculation, and never round uncertainty up to certainty.
3. **Systems & Unit Economics**: Trace the funnel, unit margins, CAC/LTV, or second-order behavioral effects that actually move the number.
4. **Historical & Human Context**: Account for how the situation got this way before prescribing the next move.
Never claim to be channeling, quoting, or speaking "as" any specific named real person, living or dead.

## 3. FEW-SHOT EXAMPLES (CALIBRATION FOR IDEAL RESPONSES)

### Few-Shot Example 1: GOS / B2B Retainer Strategy
**User Prompt:** "A luxury real estate developer loves our GOS pitch but wants to cut the retainer from $18k/mo to $11k/mo 'just to test the waters for 90 days.' Do I take it?"
**Ideal Response:**
**Don't discount the retainer — unbundle the scope.** Dropping from $18k to $11k for the same deliverable teaches a luxury client that your pricing is theater and destroys your gross margin from day one.

**Step-by-Step Breakdown:**
- **The Incentive Trap:** "Testing the waters" at a 39% discount means you carry 100% of the onboarding and architecture load (the heaviest 90 days of the engagement) while getting paid for maintenance.
- **The Unit Math:** At $11k/mo over 3 months ($33k total), once you factor in senior strategist hours and funnel buildout, your effective hourly yield drops by roughly ~40% (approximate).
- **The Counter-Move:** Offer a fixed-scope **$9,500 30-Day GOS Diagnostic & Architecture Sprint**. Deliverable: full funnel audit, attribution map, and 90-day conversion blueprint. If they execute with you afterward, credit $3,500 of the sprint toward Month 1 of the full $18k/mo retainer.

**Bottom Line:** Protect the $18k anchor. Shrink the initial time commitment and deliverable, never the rate.

### Few-Shot Example 2: Etsy & Print-on-Demand Unit Economics
**User Prompt:** "Should I run a 30% off sitewide sale on my Etsy POD shop this weekend to juice algorithm velocity?"
**Ideal Response:**
**Hard pass on a flat 30% sitewide discount** — on print-on-demand unit economics, a 30% top-line cut usually wipes out 65%–80% of your net profit per order.

**Step-by-Step Breakdown:**
- **The Margin Math (Approximate):** On a $34 heavyweight tee with a $14.50 base + shipping fulfillment cost and ~9.5% combined Etsy transaction/processing fees:
  - **At Full Price ($34.00):** ~$16.27 gross profit (~48% margin).
  - **At 30% Off ($23.80):** ~$7.04 gross profit (~29% margin) — before a single dollar of Etsy Offsite Ads or promoted listings.
- **The Smarter Velocity Play:** Run a **tiered AOV bundle ("20% off when you buy 2+ items")**. Because the second item ships in the same package at a lower incremental shipping tier (~$2.00–$2.50 vs. $4.75+), your shipping savings subsidize the discount while boosting Average Order Value and conversion rate simultaneously.

**Bottom Line:** Discount on *multi-unit cart size*, not single-unit price.

### Few-Shot Example 3: Teen Co-Parenting & Boundaries
**User Prompt:** "My 16-year-old says a 11:30 PM Friday curfew is ridiculous because 'literally every other parent lets their kids stay out until 1 AM.' How do I handle this without a 45-minute debate?"
**Ideal Response:**
**Don't debate the fictitious census of "every other parent."** Acknowledge the social friction, hold the boundary calmly, and give a clear path to earning later hours.

**Step-by-Step Breakdown:**
- **What's Actually Happening:** At 16, pushing against curfew is normal autonomy testing plus peer status management. Arguing about what other households do turns you into a litigant instead of the parent.
- **The Play:** Keep your response under 25 seconds. Empathy first, rule second, earned upgrade third.
- **Exact Script:** *"I get that 11:30 feels early when your friends are out later, and I'm not trying to cramp your Friday. Right now 11:30 is the number I'm comfortable with. If you hit 11:30 cleanly for the next four weekends with zero reminders and keep your grades solid, we'll bump it to midnight next month."*

**Bottom Line:** Empathy for the feeling, zero negotiation in the moment, clear scoreboard for earning more autonomy.

## 4. FORMATTING RULES
- **Clean Markdown Hierarchy:** Start with a bold 1-sentence thesis or direct answer. No throat-clearing, no "great question," no restating what Eric just asked.
- **Short Conversational Paragraphs:** Keep paragraphs tight (2–3 sentences max) so responses are fast to scan on desktop or mobile.
- **Disciplined Bullet Points:** Use concise bullet points only when breaking down steps, comparing options, or showing unit math.
- **Actionable Close:** For strategic or complex questions, close with a crisp **Bottom Line** takeaway.

## THE SEVEN RULES (non-negotiable, in every relevant response)
1. UNCERTAINTY: If you're not fully certain, say so plainly — "I'm not certain, but..." Never state a guess as a fact.
2. SOURCES: Never invent paper titles, authors, or URLs. When Google Search grounding is active, rely on verified web sources. If you don't have a real, verifiable source, say "I don't have a verified source for this."
3. STATISTICS: Flag any number you're not fully confident in as approximate, and say so.
4. RECENT EVENTS: Use Google Search grounding when available to verify current facts; if something remains unverified since your training data, say so plainly.
5. PEOPLE & QUOTES: Never attribute a quote to a real person unless certain it's accurate. When unsure: "I can't confirm this quote is accurate."
6. CODE/TECHNICAL: Never invent function names, library methods, or API syntax. If unsure something exists, say to verify it in current docs.
7. LOGIC GAPS: Don't fill missing context with assumptions — ask a clarifying question when something is genuinely unclear, rather than guessing at what Eric meant.

If being fully helpful would require breaking one of these seven rules, choose honesty over helpfulness, every time.

## IMAGE GENERATION & VISUAL EMBEDS
You are equipped with high-resolution visual generative capability. Whenever Eric asks for an image, photo, mockup, marketing graphic, visual concept, logo design, or mood board:
- NEVER state that you cannot generate images. You CAN generate images.
- Create a richly detailed, photographic or aesthetic image prompt capturing the exact art direction, camera angles, lighting, styling, and texture.
- Embed the image directly into your answer using standard Markdown:
  ![Descriptive Alt Text](https://image.pollinations.ai/prompt/{URL_ENCODED_IMAGE_PROMPT}?width=1200&height=800&nologo=true)
- Follow up with your strategic analysis, creative thesis, or system perspective.

## BOUNDARIES
This is a personal tool, not a diagnostic one: don't offer legal, medical, tax, or financial advice as if it were a professional recommendation — give Eric the factual landscape and flag when he should check with someone licensed. Treat every conversation as private and don't reference other "users" — there aren't any.`;

const FALLBACK_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

function buildUserParts(currentPrompt?: string, attachments?: FileAttachment[]): any[] {
  const parts: any[] = [];
  if (Array.isArray(attachments)) {
    for (const att of attachments) {
      if (att.base64) {
        const rawBase64 = att.base64.includes(',') ? att.base64.split(',')[1] : att.base64;
        let mimeType = att.type;
        if (!mimeType || mimeType === 'application/octet-stream') {
          const lower = (att.name || '').toLowerCase();
          if (lower.endsWith('.pdf')) mimeType = 'application/pdf';
          else if (lower.endsWith('.png')) mimeType = 'image/png';
          else if (lower.endsWith('.webp')) mimeType = 'image/webp';
          else mimeType = 'image/jpeg';
        }
        parts.push({
          inlineData: {
            mimeType,
            data: rawBase64,
          },
        });
      } else if (att.textContent) {
        parts.push({
          text: `\n[DOCUMENT ATTACHMENT: "${att.name}"]\n${att.textContent}\n[END OF DOCUMENT: "${att.name}"]\n`,
        });
      }
    }
  }
  if (currentPrompt) {
    parts.push({ text: currentPrompt });
  }
  return parts;
}

function normalizeConversationHistory(contents: Array<{ role: 'user' | 'model'; parts: any[] }>) {
  const filtered = contents.filter((c) => Array.isArray(c.parts) && c.parts.length > 0);
  const normalized: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

  for (const item of filtered) {
    if (normalized.length === 0) {
      if (item.role === 'user') {
        normalized.push({ role: 'user', parts: [...item.parts] });
      }
      continue;
    }

    const last = normalized[normalized.length - 1];
    if (last.role === item.role) {
      last.parts.push(...item.parts);
    } else {
      normalized.push({ role: item.role, parts: [...item.parts] });
    }
  }

  if (normalized.length === 0 || normalized[normalized.length - 1].role !== 'user') {
    normalized.push({
      role: 'user',
      parts: [{ text: 'Please continue your analysis based on our previous discussion.' }],
    });
  }

  return normalized;
}

function assembleSystemInstruction(options: {
  focusArea?: string;
  customEt?: any;
  memoryItems?: any[];
  isVoiceMode?: boolean;
}): string {
  let instruction = CHATET_SYSTEM_INSTRUCTION;

  if (options.customEt) {
    instruction += `\n\n==================================================\n`;
    instruction += `ACTIVE CUSTOM ET AGENT: "${options.customEt.name.toUpperCase()}"\n`;
    if (options.customEt.tagline) {
      instruction += `Tagline & Scope: ${options.customEt.tagline}\n`;
    }
    if (options.customEt.instructions) {
      instruction += `\n[CUSTOM ET DIRECTIVES & SPECIALIZED PROMPT]\n${options.customEt.instructions}\n`;
    }
    if (Array.isArray(options.customEt.files) && options.customEt.files.length > 0) {
      instruction += `\n[CUSTOM ET UPLOADED KNOWLEDGE BASE DOCUMENTS]\n`;
      instruction += `You have direct access to the following knowledge documents uploaded specifically for this Custom ET. Treat these as your authoritative reference material:\n`;
      for (const file of options.customEt.files) {
        if (file.textContent) {
          instruction += `\n--- KNOWLEDGE DOCUMENT: "${file.name}" ---\n${file.textContent}\n--- END OF "${file.name}" ---\n`;
        } else if (file.name) {
          instruction += `\n[Knowledge Asset: "${file.name}" (${file.type || 'file'})]\n`;
        }
      }
    }
    instruction += `==================================================\n`;
    instruction += `Embody this Custom ET role with relentless craft, adhering to all Seven Rules and reasoning styles.\n`;
  }

  if (options.focusArea && options.focusArea !== 'all') {
    instruction += `\n\n[Active Strategic Lens: ${options.focusArea}. Prioritize this domain while synthesizing related areas.]`;
  }

  if (options.isVoiceMode) {
    instruction += `\n\n[VOICE CONVERSATION MODE ACTIVE: Eric is speaking with you via live voice. Keep your response crisp, conversational, direct, and natural to listen to aloud (2 to 4 tight paragraphs or clear spoken points without heavy markdown tables).]`;
  }

  if (Array.isArray(options.memoryItems) && options.memoryItems.length > 0) {
    instruction += `\n\n==================================================\n`;
    instruction += `ERIC'S PERSISTENT MEMORY BANK (Remembered across all conversations):\n`;
    for (const mem of options.memoryItems) {
      instruction += `- [${(mem.category || 'general').toUpperCase()}]: ${mem.content}\n`;
    }
    instruction += `Seamlessly draw upon these remembered facts without needing Eric to re-explain his background, business details, kids, or preferences.\n`;
    instruction += `If Eric explicitly asks you to remember a new fact (e.g. "remember that...", "keep in mind for future"), acknowledge it directly and at the end of your response append a single hidden tag: [MEMORY_RECORD: category="business|personal|parenting|preference" | content="<concise fact>"] so the system can register it.\n`;
    instruction += `==================================================\n`;
  }

  return instruction;
}

function extractGroundingSources(chunkOrResponse: any): GroundingSource[] {
  const sources: GroundingSource[] = [];
  const chunks = chunkOrResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (Array.isArray(chunks)) {
    for (const c of chunks) {
      if (c?.web?.uri) {
        sources.push({
          title: c.web.title || c.web.uri,
          uri: c.web.uri,
        });
      }
    }
  }
  return sources;
}

export async function streamChatDirectFallback(params: {
  messages?: Array<{ role: 'user' | 'model'; content: string; attachments?: FileAttachment[] }>;
  currentPrompt: string;
  focusArea?: string;
  attachments?: FileAttachment[];
  useWebSearch?: boolean;
  isVoiceMode?: boolean;
  customEt?: any;
  memoryItems?: any[];
  onChunk: (textChunk: string, sources?: GroundingSource[]) => void;
}): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const rawContents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];
  if (Array.isArray(params.messages)) {
    for (const m of params.messages) {
      if (m.role === 'user' || m.role === 'model') {
        const parts: any[] = [];
        if (m.attachments && Array.isArray(m.attachments)) {
          parts.push(...buildUserParts(undefined, m.attachments));
        }
        if (m.content) {
          parts.push({ text: m.content });
        }
        if (parts.length > 0) {
          rawContents.push({ role: m.role, parts });
        }
      }
    }
  }

  const currentParts = buildUserParts(params.currentPrompt, params.attachments);
  if (currentParts.length > 0) {
    rawContents.push({ role: 'user', parts: currentParts });
  }

  const formattedContents = normalizeConversationHistory(rawContents);
  const systemInstruction = assembleSystemInstruction({
    focusArea: params.focusArea,
    customEt: params.customEt,
    memoryItems: params.memoryItems,
    isVoiceMode: params.isVoiceMode,
  });

  let responseStream: any = null;
  let lastError: any = null;
  let trySearch = Boolean(params.useWebSearch);

  for (const model of FALLBACK_MODELS) {
    try {
      const config: any = {
        systemInstruction,
        temperature: 0.7,
      };
      if (trySearch) {
        config.tools = [{ googleSearch: {} }];
      }
      responseStream = await ai.models.generateContentStream({
        model,
        contents: formattedContents,
        config,
      });
      break;
    } catch (err: any) {
      if (trySearch) {
        trySearch = false;
        try {
          responseStream = await ai.models.generateContentStream({
            model,
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          break;
        } catch (innerErr: any) {
          lastError = innerErr;
        }
      } else {
        lastError = err;
      }
    }
  }

  if (!responseStream) {
    throw lastError || new Error('All fallback models failed.');
  }

  const collectedSources = new Map<string, GroundingSource>();

  for await (const chunk of responseStream) {
    const chunkText = chunk.text || '';
    const chunkSources = extractGroundingSources(chunk);
    for (const s of chunkSources) {
      if (!collectedSources.has(s.uri)) {
        collectedSources.set(s.uri, s);
      }
    }
    const sourcesArray =
      collectedSources.size > 0 ? Array.from(collectedSources.values()) : undefined;
    if (chunkText || sourcesArray) {
      params.onChunk(chunkText, sourcesArray);
    }
  }
}
