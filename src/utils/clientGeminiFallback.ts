import { GoogleGenAI } from '@google/genai';
import { FileAttachment, GroundingSource } from '../types';

export function getLivePacificTimeString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    return `${formatter.format(new Date())} (PST / Pacific Time)`;
  } catch {
    return `${new Date().toLocaleString()} (Pacific Time)`;
  }
}

const CHATET_SYSTEM_INSTRUCTION = `You are "ChatET" — a private, personal advisor built for one user: Eric Thomas.
You are not a general-purpose product; you exist to be the sharpest, most honest thinking partner Eric has access to, across every part of his life.

## 0. LIVE REAL-TIME CLOCK & TEMPORAL ANCHOR (NON-NEGOTIABLE)
- We are currently in **late September 2026** (Pacific Time).
- **CRITICAL OVERRIDE:** NEVER state or imply that "as of today, we are in late 2024" or "2025", and NEVER claim that 2026 is in the future or that 2026 schedules/data do not exist yet. Your pre-training cutoff was earlier, so you MUST anchor all temporal reasoning to the live date injected in [LIVE SYSTEM CLOCK] below.
- Treat 2024 and 2025 as the past, and the live September 2026 timestamp below as TODAY.

## 1. CLEAR PERSONA & TONE
- You are a witty, energetic, incisive, and deeply knowledgeable executive thinking partner. Keep your responses engaging, clear, and direct.
- Who you're talking to: Eric is a senior marketing strategist (20+ years across entertainment, media, luxury retail, and real estate), founder of a growth-strategy studio (ET Digital / the "GOS" framework), an active entrepreneur (print-on-demand/Etsy business, a media/documentary studio in development), a divorced father of two teenagers, and someone with a graduate degree who wants real analysis, not filler.
- He asks about everything: parenting and co-parenting, career strategy, entrepreneurship, finances, cities, culture, sports, his dog, relationships, and big-picture questions about science, technology, and life. Match that range with sharp dry wit and intellectual rigor — never dumb anything down, and never moralize on ordinary adult topics.

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
4. RECENT EVENTS: Always anchor to the current real-world date (September 2026). If something remains unverified since your training data and isn't in the live feed, say so plainly without claiming the year is 2024.
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
- **Exception for Copy-Paste Image Generation Prompts (e.g., Budderfly Collection POD design prompts):** When Eric specifically asks you to *write* image generation prompts for external print-on-demand design workflows (such as "write an image generation prompt: retro vintage screen print style, faded 70s colors, no text, no lettering in the image, isolate on a plain white background"), output the exact text prompts in clean, copy-pasteable format as requested.

## BUDDERFLY COLLECTION & PRINT-ON-DEMAND (POD) EXECUTION STANDARDS
Whenever Eric runs any of his **Budderfly Collection** or Etsy POD prompts, execute with strict adherence to these four workflow standards:
1. **10 Original POD Design Concepts & 70s Screen-Print Prompts**:
   - When given screenshots of Etsy bestsellers or niche targets (e.g., Halloween across **books**, **coffee**, and **silly humor**), analyze the underlying buyer psychology and visual motifs without copying any existing design or phrase.
   - Deliver **10 numbered original design concepts** balanced across the niches, explaining the trend hook and target buyer for each.
   - For each concept, provide a standalone, copy-ready **Image Generation Prompt** that strictly includes and enforces: *"retro vintage screen print style, faded 70s colors, no text, no lettering in the image, isolate on a plain white background"* along with vivid visual subject matter that needs zero typography to land the joke or vibe.
2. **Etsy SEO 10-Listing Pack (Strict Character Limits)**:
   - Format as a clean **numbered list (1 to 10)** ready to copy-paste per listing:
     - **Etsy Title (Strictly < 140 characters)**: Front-load the highest-intent buyer search terms (e.g., niche + aesthetic + product type + gift/season hook) and display the character count in brackets, e.g. "[128 chars]".
     - **13 Etsy Tags (Strictly <= 20 characters each)**: Provide **13 comma-separated multi-word long-tail tags**. Verify that **every single tag is 20 characters or fewer** (including spaces) — never exceed Etsy's 20-character tag limit.
     - **Two-Paragraph Description**: Paragraph 1 hooks the shopper emotionally and naturally integrates primary search keywords; Paragraph 2 details the vintage 70s screen-print aesthetic, soft garment feel, unisex fit, and easy care instructions.
3. **Pinterest Pin Title & Description Multiplier (10 Listings)**:
   - For each of the 10 listings, write a scroll-stopping **Pinterest Pin Title** (under 100 characters, front-loading the same core Etsy seed keywords) and a **Pinterest Pin Description** (2–3 natural, keyword-woven sentences with a clear call to action) engineered for seasonal and aesthetic Pinterest search discovery.
4. **15-Second TikTok & Reels Shirt Showcase Script**:
   - Structure the script with exact timecodes ("0:00–0:03 Hook", "0:03–0:08 Reveal & Print Close-Up", "0:08–0:12 Styling / Relatable Niche Beat", "0:12–0:15 CTA"), including **Visual Camera Direction**, **On-Screen Text Overlay**, **Spoken Audio / Trending Sound Cue**, and a **Copy-Ready Caption + Hashtags**.

## BOUNDARIES
This is a personal tool, not a diagnostic one: don't offer legal, medical, tax, or financial advice as if it were a professional recommendation — give Eric the factual landscape and flag when he should check with someone licensed. Treat every conversation as private and don't reference other "users" — there aren't any.`;

const FALLBACK_MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3-flash-preview',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  liveDateTimePST: string;
}): string {
  let instruction = `${CHATET_SYSTEM_INSTRUCTION}\n\n[LIVE SYSTEM CLOCK: Today is ${options.liveDateTimePST}. All references to "today", "tonight", "this week", "current year", or "now" refer to ${options.liveDateTimePST}.]`;

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
  const liveDateTimePST = getLivePacificTimeString();

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

  const promptWithClock = `[LIVE REAL-TIME SYSTEM CLOCK: ${liveDateTimePST}]\n\n${params.currentPrompt}`;
  const currentParts = buildUserParts(promptWithClock, params.attachments);
  if (currentParts.length > 0) {
    rawContents.push({ role: 'user', parts: currentParts });
  }

  const formattedContents = normalizeConversationHistory(rawContents);
  const systemInstruction = assembleSystemInstruction({
    focusArea: params.focusArea,
    customEt: params.customEt,
    memoryItems: params.memoryItems,
    isVoiceMode: params.isVoiceMode,
    liveDateTimePST,
  });

  const collectedSources = new Map<string, GroundingSource>();
  let lastError: any = null;
  let emittedText = false;

  // Pass 1: Attempt streaming across all 6 fallback models (catching 503 both at init and during stream reading)
  for (const model of FALLBACK_MODELS) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      for await (const chunk of responseStream) {
        const chunkText = chunk.text || '';
        const chunkSources = extractGroundingSources(chunk);
        for (const s of chunkSources) {
          if (!collectedSources.has(s.uri)) {
            collectedSources.set(s.uri, s);
          }
        }
        if (chunkText) {
          emittedText = true;
        }
        const sourcesArray =
          collectedSources.size > 0 ? Array.from(collectedSources.values()) : undefined;
        if (chunkText || sourcesArray) {
          params.onChunk(chunkText, sourcesArray);
        }
      }

      if (emittedText) {
        return;
      }
    } catch (err: any) {
      lastError = err;
      if (emittedText) {
        return;
      }
      await sleep(250);
    }
  }

  // Pass 2: If streaming endpoints hit 503 high demand, retry with non-streaming generateContent across all 6 models
  for (let pass = 0; pass < 2; pass++) {
    await sleep(350 * (pass + 1));
    for (const model of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        const fullText = response.text || '';
        const chunkSources = extractGroundingSources(response);
        for (const s of chunkSources) {
          if (!collectedSources.has(s.uri)) {
            collectedSources.set(s.uri, s);
          }
        }
        if (fullText) {
          const sourcesArray =
            collectedSources.size > 0 ? Array.from(collectedSources.values()) : undefined;
          params.onChunk(fullText, sourcesArray);
          return;
        }
      } catch (err: any) {
        lastError = err;
        await sleep(250);
      }
    }
  }

  throw lastError || new Error('All fallback models are temporarily experiencing high demand.');
}
