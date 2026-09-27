import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

function getFormattedPacificNow(clientTimestamp?: string): {
  fullDateTimePST: string;
  isoDatePST: string;
  compactDateYYYYMMDD: string;
} {
  const now = new Date();
  const fullFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const partsFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = partsFormatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value || "2026";
  const month = parts.find((p) => p.type === "month")?.value || "09";
  const day = parts.find((p) => p.type === "day")?.value || "27";

  return {
    fullDateTimePST: clientTimestamp || `${fullFormatter.format(now)} (PST / Pacific Time)`,
    isoDatePST: `${year}-${month}-${day}`,
    compactDateYYYYMMDD: `${year}${month}${day}`,
  };
}

const ERIC_AI_SYSTEM_INSTRUCTION = `You are "ChatET" — a private, personal advisor built for one user: Eric Thomas.
You are not a general-purpose product; you exist to be the sharpest, most honest thinking partner Eric has access to, across every part of his life.

## 0. LIVE REAL-TIME CLOCK & TEMPORAL ANCHOR (NON-NEGOTIABLE)
- We are currently in **late September 2026** (specifically **Sunday, September 27, 2026**, Pacific Time).
- **CRITICAL OVERRIDE:** NEVER state or imply that "as of today, we are in late 2024" or "2025", and NEVER claim that 2026 is in the future or that 2026 schedules/data do not exist yet. Your pre-training cutoff was earlier, so you MUST anchor all temporal reasoning to the live date injected below and the verified real-time web/schedule data provided in the prompt context.
- Treat 2024 and 2025 as the past, and **September 27, 2026** as TODAY.

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
2. SOURCES: Never invent paper titles, authors, or URLs. When live web/search data is provided, rely on those verified sources. If you don't have a real, verifiable source, say "I don't have a verified source for this."
3. STATISTICS: Flag any number you're not fully confident in as approximate, and say so.
4. RECENT EVENTS: Always anchor to the current real-world date (September 2026) and the live web/sports grounding data supplied in the context. If a specific detail isn't in the live feed, state what is verified and what isn't.
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

const MODELS_FALLBACK = [
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * Fetches live 2026 web search results, news RSS items, and live sports scoreboards
 * directly on the server so ChatET always has up-to-the-minute September 2026 facts
 * even when Gemini's native search tool quota is rate-limited.
 */
async function fetchLiveWebAndSportsContext(
  prompt: string,
  compactDateYYYYMMDD: string
): Promise<{
  contextBlock: string;
  sources: Array<{ title: string; uri: string }>;
}> {
  const sources: Array<{ title: string; uri: string }> = [];
  const sections: string[] = [];

  const cleanQuery = prompt.replace(/\s+/g, " ").trim().slice(0, 180);
  if (!cleanQuery) {
    return { contextBlock: "", sources: [] };
  }

  const lower = cleanQuery.toLowerCase();
  const isSportsOrGamesQuery =
    /\b(game|games|schedule|schedules|score|scores|nfl|football|ncaaf|college football|mlb|baseball|nba|wnba|basketball|nhl|hockey|soccer|premier league|matchup|kickoff|playing today|who plays|tonight|sunday)\b/i.test(
      lower
    );

  // Add "September 2026" context to search query if it asks about temporal/current info without a year
  const searchQuery = /\b202\d\b/.test(cleanQuery)
    ? cleanQuery
    : `${cleanQuery} September 2026`;

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 3200) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  const tasks: Promise<void>[] = [];

  // 1. Live ESPN Sports Scoreboard & Schedule (NFL, MLB, NCAAF, WNBA)
  if (isSportsOrGamesQuery) {
    tasks.push(
      (async () => {
        const leagues: Array<{ label: string; url: string; pageUrl: string }> = [];
        if (/\b(mlb|baseball)\b/i.test(lower)) {
          leagues.push({
            label: "MLB Baseball",
            url: `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${compactDateYYYYMMDD}`,
            pageUrl: "https://www.espn.com/mlb/scoreboard",
          });
        } else if (/\b(ncaaf|college football|cfb)\b/i.test(lower)) {
          leagues.push({
            label: "NCAA College Football",
            url: `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard`,
            pageUrl: "https://www.espn.com/college-football/scoreboard",
          });
        } else {
          // Default to NFL + MLB for general "games today / schedule" on Sept 27, 2026
          leagues.push({
            label: "NFL Football",
            url: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`,
            pageUrl: "https://www.espn.com/nfl/scoreboard",
          });
          leagues.push({
            label: "MLB Baseball",
            url: `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${compactDateYYYYMMDD}`,
            pageUrl: "https://www.espn.com/mlb/scoreboard",
          });
        }

        for (const league of leagues) {
          try {
            const res = await fetchWithTimeout(league.url);
            if (!res.ok) continue;
            const data: any = await res.json();
            const events = Array.isArray(data?.events) ? data.events : [];
            if (events.length === 0) continue;

            const gameLines: string[] = [];
            for (const ev of events.slice(0, 16)) {
              const comp = ev.competitions?.[0];
              const competitors = Array.isArray(comp?.competitors) ? comp.competitors : [];
              const away = competitors.find((c: any) => c.homeAway === "away") || competitors[0];
              const home = competitors.find((c: any) => c.homeAway === "home") || competitors[1];
              const awayName = away?.team?.displayName || away?.team?.name || "";
              const homeName = home?.team?.displayName || home?.team?.name || "";
              const awayRecord = away?.records?.[0]?.summary ? ` (${away.records[0].summary})` : "";
              const homeRecord = home?.records?.[0]?.summary ? ` (${home.records[0].summary})` : "";
              const statusDetail = ev.status?.type?.detail || ev.status?.type?.shortDetail || "";
              const broadcast =
                comp?.broadcasts?.[0]?.names?.join(", ") || comp?.geoBroadcasts?.[0]?.media?.shortName || "";

              // Convert UTC date to Pacific Time (PST/PDT)
              let pstTimeStr = statusDetail;
              if (ev.date) {
                try {
                  const d = new Date(ev.date);
                  pstTimeStr = new Intl.DateTimeFormat("en-US", {
                    timeZone: "America/Los_Angeles",
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "short",
                  }).format(d);
                } catch {
                  // fallback
                }
              }

              const scorePart =
                ev.status?.type?.state === "in" || ev.status?.type?.state === "post"
                  ? ` — Score: ${awayName} ${away?.score ?? 0}, ${homeName} ${home?.score ?? 0} (${statusDetail})`
                  : "";

              gameLines.push(
                `- ${awayName}${awayRecord} at ${homeName}${homeRecord} | Time (Pacific): ${pstTimeStr}${
                  broadcast ? ` | TV: ${broadcast}` : ""
                }${scorePart}`
              );
            }

            if (gameLines.length > 0) {
              sections.push(
                `### LIVE ${league.label.toUpperCase()} SCHEDULE & SCOREBOARD (ESPN Real-Time Feed):\n` +
                  gameLines.join("\n")
              );
              sources.push({
                title: `ESPN Live ${league.label} Scoreboard & Schedule`,
                uri: league.pageUrl,
              });
            }
          } catch {
            // ignore individual league failure
          }
        }
      })()
    );
  }

  // 2. Live DuckDuckGo Web Search Snippets
  tasks.push(
    (async () => {
      try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
        const res = await fetchWithTimeout(ddgUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          },
        });
        if (!res.ok) return;
        const html = await res.text();
        const matches = [
          ...html.matchAll(
            /<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
          ),
        ].slice(0, 5);

        if (matches.length > 0) {
          const webLines: string[] = [];
          for (const m of matches) {
            const rawHref = m[1] || "";
            const uddgMatch = rawHref.match(/uddg=([^&]+)/);
            const cleanUrl = uddgMatch ? decodeURIComponent(uddgMatch[1]) : rawHref;
            const title = decodeHtmlEntities(m[2] || "");
            const snippet = decodeHtmlEntities(m[3] || "");
            if (title && snippet) {
              webLines.push(`- **${title}**: ${snippet} (Source: ${cleanUrl})`);
              if (cleanUrl.startsWith("http")) {
                sources.push({ title, uri: cleanUrl });
              }
            }
          }
          if (webLines.length > 0) {
            sections.push(`### LIVE WEB SEARCH RESULTS:\n${webLines.join("\n")}`);
          }
        }
      } catch {
        // ignore timeout
      }
    })()
  );

  // 3. Live Google News RSS Feed
  tasks.push(
    (async () => {
      try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
          cleanQuery
        )}&hl=en-US&gl=US&ceid=US:en`;
        const res = await fetchWithTimeout(rssUrl);
        if (!res.ok) return;
        const xml = await res.text();
        const items = [
          ...xml.matchAll(
            /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<\/item>/g
          ),
        ].slice(0, 5);

        if (items.length > 0) {
          const newsLines: string[] = [];
          for (const item of items) {
            const title = decodeHtmlEntities(item[1] || "");
            const link = (item[2] || "").trim();
            const pubDate = decodeHtmlEntities(item[3] || "");
            if (title) {
              newsLines.push(`- ${title} (Published: ${pubDate})`);
              if (link.startsWith("http") && sources.length < 6) {
                sources.push({ title, uri: link });
              }
            }
          }
          if (newsLines.length > 0) {
            sections.push(`### LIVE GOOGLE NEWS HEADLINES:\n${newsLines.join("\n")}`);
          }
        }
      } catch {
        // ignore timeout
      }
    })()
  );

  await Promise.allSettled(tasks);

  // Deduplicate sources by URI
  const uniqueSources: Array<{ title: string; uri: string }> = [];
  const seen = new Set<string>();
  for (const s of sources) {
    if (!seen.has(s.uri)) {
      seen.add(s.uri);
      uniqueSources.push(s);
    }
  }

  return {
    contextBlock: sections.join("\n\n"),
    sources: uniqueSources.slice(0, 6),
  };
}

function extractGroundingSources(chunkOrResponse: any): Array<{ title: string; uri: string }> {
  const sources: Array<{ title: string; uri: string }> = [];
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

async function generateStreamWithFallback(
  ai: GoogleGenAI,
  contents: any[],
  systemInstruction: string
) {
  let lastError: any = null;

  for (const model of MODELS_FALLBACK) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      return { stream: responseStream, model };
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} stream failed, attempting next fallback...`, err?.message || err);
    }
  }
  throw lastError;
}

async function generateContentWithFallback(
  ai: GoogleGenAI,
  contents: any[],
  systemInstruction: string
) {
  let lastError: any = null;

  for (const model of MODELS_FALLBACK) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      return { response, model };
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, attempting next fallback...`, err?.message || err);
    }
  }
  throw lastError;
}

function buildUserParts(currentPrompt?: string, attachments?: any[]): any[] {
  const parts: any[] = [];
  if (Array.isArray(attachments)) {
    for (const att of attachments) {
      if (att.base64) {
        const rawBase64 = att.base64.includes(",") ? att.base64.split(",")[1] : att.base64;
        let mimeType = att.type;
        if (!mimeType || mimeType === "application/octet-stream") {
          const lower = (att.name || "").toLowerCase();
          if (lower.endsWith(".pdf")) mimeType = "application/pdf";
          else if (lower.endsWith(".png")) mimeType = "image/png";
          else if (lower.endsWith(".webp")) mimeType = "image/webp";
          else mimeType = "image/jpeg";
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

function normalizeConversationHistory(contents: Array<{ role: "user" | "model"; parts: any[] }>) {
  const filtered = contents.filter((c) => Array.isArray(c.parts) && c.parts.length > 0);
  const normalized: Array<{ role: "user" | "model"; parts: any[] }> = [];

  for (const item of filtered) {
    if (normalized.length === 0) {
      if (item.role === "user") {
        normalized.push({ role: "user", parts: [...item.parts] });
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

  if (normalized.length === 0 || normalized[normalized.length - 1].role !== "user") {
    normalized.push({
      role: "user",
      parts: [{ text: "Please continue your analysis based on our previous discussion." }],
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
  let instruction = `${ERIC_AI_SYSTEM_INSTRUCTION}\n\n[LIVE SYSTEM CLOCK: Today is ${options.liveDateTimePST}. All references to "today", "tonight", "this week", "current year", or "now" refer to ${options.liveDateTimePST}.]`;

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
          instruction += `\n[Knowledge Asset: "${file.name}" (${file.type || "file"})]\n`;
        }
      }
    }
    instruction += `==================================================\n`;
    instruction += `Embody this Custom ET role with relentless craft, adhering to all Seven Rules and reasoning styles.\n`;
  }

  if (options.focusArea && options.focusArea !== "all") {
    instruction += `\n\n[Active Strategic Lens: ${options.focusArea}. Prioritize this domain while synthesizing related areas.]`;
  }

  if (options.isVoiceMode) {
    instruction += `\n\n[VOICE CONVERSATION MODE ACTIVE: Eric is speaking with you via live voice. Keep your response crisp, conversational, direct, and natural to listen to aloud (2 to 4 tight paragraphs or clear spoken points without heavy markdown tables).]`;
  }

  if (Array.isArray(options.memoryItems) && options.memoryItems.length > 0) {
    instruction += `\n\n==================================================\n`;
    instruction += `ERIC'S PERSISTENT MEMORY BANK (Remembered across all conversations):\n`;
    for (const mem of options.memoryItems) {
      instruction += `- [${(mem.category || "general").toUpperCase()}]: ${mem.content}\n`;
    }
    instruction += `Seamlessly draw upon these remembered facts without needing Eric to re-explain his background, business details, kids, or preferences.\n`;
    instruction += `If Eric explicitly asks you to remember a new fact (e.g. "remember that...", "keep in mind for future"), acknowledge it directly and at the end of your response append a single hidden tag: [MEMORY_RECORD: category="business|personal|parenting|preference" | content="<concise fact>"] so the system can register it.\n`;
    instruction += `==================================================\n`;
  }

  return instruction;
}

// API Routes
app.get("/api/health", (req, res) => {
  const { fullDateTimePST } = getFormattedPacificNow();
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    currentTimePST: fullDateTimePST,
    timestamp: new Date().toISOString(),
  });
});

// Dedicated Image Generation route with prompt enhancement
app.post("/api/image/generate", async (req, res) => {
  const { prompt, style = "editorial", width = 1200, height = 800 } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const styleModifiers: Record<string, string> = {
    editorial:
      "luxury architectural editorial photography, 8k resolution, Leica 50mm, Hasselblad, sharp focus, natural elegant lighting",
    photorealistic:
      "award-winning documentary photography, cinematic lighting, 35mm film grain, authentic details, 8k",
    minimalist:
      "high-end minimalist Scandinavian design, clean lines, negative space, studio lighting, museum quality",
    cyberpunk:
      "cinematic dark tech, turquoise and cyan neon glow, slate textures, volumetric lighting, Octane render",
    product:
      "luxury commercial product mockup, studio lighting, clean background, photorealistic, 8k, crisp reflections",
  };

  const modifier = styleModifiers[style] || styleModifiers.editorial;
  const fullPrompt = `${prompt}, ${modifier}`;
  const encodedPrompt = encodeURIComponent(fullPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

  res.json({
    imageUrl,
    prompt,
    enhancedPrompt: fullPrompt,
    width,
    height,
  });
});

// Gemini TTS Speech Generation endpoint
app.post("/api/tts", async (req, res) => {
  const { text, voiceName = "Charon" } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing text for speech synthesis" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  try {
    const ai = getGeminiClient();
    const cleanText = text
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[MEMORY_RECORD:.*?\]/gi, "")
      .replace(/[#*`_~]/g, "")
      .trim()
      .slice(0, 3500);

    if (!cleanText) {
      return res.status(400).json({ error: "No speakable text content" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: cleanText,
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"].includes(voiceName)
                ? voiceName
                : "Charon",
            },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const base64Audio = inlineData?.data;
    const mimeType = inlineData?.mimeType || "audio/pcm;rate=24000";

    if (!base64Audio) {
      return res.status(500).json({ error: "No audio returned from TTS model" });
    }

    res.json({
      audioBase64: base64Audio,
      mimeType,
      sampleRate: 24000,
    });
  } catch (error: any) {
    console.error("Gemini TTS error:", error?.message || error);
    res.status(500).json({ error: error?.message || "TTS generation failed" });
  }
});

// Gemini Audio Transcription endpoint
app.post("/api/transcribe", async (req, res) => {
  const { audioBase64, mimeType = "audio/webm" } = req.body;
  if (!audioBase64 || typeof audioBase64 !== "string") {
    return res.status(400).json({ error: "Missing audio data" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  try {
    const ai = getGeminiClient();
    const rawBase64 = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
    const audioPart = {
      inlineData: {
        mimeType,
        data: rawBase64,
      },
    };

    let transcriptText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            audioPart,
            { text: "Transcribe this spoken audio accurately into plain text. Output only the exact words spoken." },
          ],
        },
      });
      transcriptText = response.text || "";
    } catch {
      const fallbackRes = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            audioPart,
            { text: "Transcribe this spoken audio accurately into plain text. Output only the exact words spoken." },
          ],
        },
      });
      transcriptText = fallbackRes.text || "";
    }

    res.json({ text: transcriptText.trim() });
  } catch (error: any) {
    console.error("Audio transcription error:", error?.message || error);
    res.status(500).json({ error: error?.message || "Audio transcription failed" });
  }
});

// Chat streaming endpoint via Server-Sent Events
app.post("/api/chat/stream", async (req, res) => {
  const {
    messages,
    currentPrompt,
    focusArea,
    attachments,
    customEt,
    memoryItems,
    useWebSearch = true,
    isVoiceMode = false,
    clientLocalTime,
  } = req.body;

  if (
    !currentPrompt &&
    (!attachments || attachments.length === 0) &&
    (!messages || messages.length === 0)
  ) {
    return res.status(400).json({ error: "Missing message content" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.write(
      `data: ${JSON.stringify({
        text: "Notice: GEMINI_API_KEY is not configured in the environment. Please ensure the API key is attached in Settings > Secrets.",
        done: true,
      })}\n\n`
    );
    return res.end();
  }

  try {
    const ai = getGeminiClient();
    const { fullDateTimePST, compactDateYYYYMMDD } = getFormattedPacificNow(clientLocalTime);

    const rawContents: Array<{
      role: "user" | "model";
      parts: any[];
    }> = [];

    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (m.role === "user" || m.role === "model") {
          const parts: any[] = [];
          if (m.attachments && Array.isArray(m.attachments)) {
            parts.push(...buildUserParts(undefined, m.attachments));
          }
          if (m.content) {
            parts.push({ text: m.content });
          }
          if (parts.length > 0) {
            rawContents.push({
              role: m.role,
              parts,
            });
          }
        }
      }
    }

    const collectedSources = new Map<string, { title: string; uri: string }>();
    let enrichedPrompt = currentPrompt || "";

    // Fetch live web & sports schedule context when web search is enabled or temporal/current keywords are detected
    const needsLiveContext =
      Boolean(useWebSearch) ||
      /\b(today|tonight|yesterday|tomorrow|schedule|game|games|score|scores|nfl|mlb|nba|ncaaf|football|baseball|news|current|latest|2025|2026|weather|price|rate|rates|stock)\b/i.test(
        enrichedPrompt
      );

    if (needsLiveContext && enrichedPrompt) {
      const liveData = await fetchLiveWebAndSportsContext(enrichedPrompt, compactDateYYYYMMDD);
      for (const s of liveData.sources) {
        if (!collectedSources.has(s.uri)) {
          collectedSources.set(s.uri, s);
        }
      }
      if (liveData.contextBlock) {
        enrichedPrompt = `[LIVE REAL-TIME SYSTEM CLOCK: ${fullDateTimePST}]\n[VERIFIED LIVE WEB & SPORTS DATA RETRIEVED FOR THIS QUERY]:\n${liveData.contextBlock}\n\n[ERIC'S MESSAGE]:\n${currentPrompt}`;
      } else {
        enrichedPrompt = `[LIVE REAL-TIME SYSTEM CLOCK: ${fullDateTimePST}]\n\n${currentPrompt}`;
      }
    } else if (enrichedPrompt) {
      enrichedPrompt = `[LIVE REAL-TIME SYSTEM CLOCK: ${fullDateTimePST}]\n\n${currentPrompt}`;
    }

    const currentParts = buildUserParts(enrichedPrompt, attachments);
    if (currentParts.length > 0) {
      rawContents.push({
        role: "user",
        parts: currentParts,
      });
    }

    const formattedContents = normalizeConversationHistory(rawContents);

    const systemInstruction = assembleSystemInstruction({
      focusArea,
      customEt,
      memoryItems,
      isVoiceMode,
      liveDateTimePST: fullDateTimePST,
    });

    const { stream: responseStream } = await generateStreamWithFallback(
      ai,
      formattedContents,
      systemInstruction
    );

    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      const chunkSources = extractGroundingSources(chunk);
      for (const s of chunkSources) {
        if (!collectedSources.has(s.uri)) {
          collectedSources.set(s.uri, s);
        }
      }

      if (chunkText || chunkSources.length > 0) {
        res.write(
          `data: ${JSON.stringify({
            text: chunkText || "",
            sources: collectedSources.size > 0 ? Array.from(collectedSources.values()) : undefined,
            done: false,
          })}\n\n`
        );
      }
    }

    res.write(
      `data: ${JSON.stringify({
        sources: collectedSources.size > 0 ? Array.from(collectedSources.values()) : undefined,
        done: true,
      })}\n\n`
    );
    res.end();
  } catch (error: any) {
    console.error("Gemini API stream error:", error);
    const errorMessage = error?.message || "An error occurred while generating counsel.";
    res.write(`data: ${JSON.stringify({ error: errorMessage, done: true })}\n\n`);
    res.end();
  }
});

// Chat non-streaming endpoint
app.post("/api/chat", async (req, res) => {
  const {
    messages,
    currentPrompt,
    focusArea,
    attachments,
    customEt,
    memoryItems,
    useWebSearch = true,
    isVoiceMode = false,
    clientLocalTime,
  } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in the environment.",
      });
    }

    const ai = getGeminiClient();
    const { fullDateTimePST, compactDateYYYYMMDD } = getFormattedPacificNow(clientLocalTime);

    const rawContents: Array<{
      role: "user" | "model";
      parts: any[];
    }> = [];

    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (m.role === "user" || m.role === "model") {
          const parts: any[] = [];
          if (m.attachments && Array.isArray(m.attachments)) {
            parts.push(...buildUserParts(undefined, m.attachments));
          }
          if (m.content) {
            parts.push({ text: m.content });
          }
          if (parts.length > 0) {
            rawContents.push({
              role: m.role,
              parts,
            });
          }
        }
      }
    }

    const collectedSources = new Map<string, { title: string; uri: string }>();
    let enrichedPrompt = currentPrompt || "";

    if (Boolean(useWebSearch) && enrichedPrompt) {
      const liveData = await fetchLiveWebAndSportsContext(enrichedPrompt, compactDateYYYYMMDD);
      for (const s of liveData.sources) {
        if (!collectedSources.has(s.uri)) {
          collectedSources.set(s.uri, s);
        }
      }
      if (liveData.contextBlock) {
        enrichedPrompt = `[LIVE REAL-TIME SYSTEM CLOCK: ${fullDateTimePST}]\n[VERIFIED LIVE WEB & SPORTS DATA RETRIEVED FOR THIS QUERY]:\n${liveData.contextBlock}\n\n[ERIC'S MESSAGE]:\n${currentPrompt}`;
      } else {
        enrichedPrompt = `[LIVE REAL-TIME SYSTEM CLOCK: ${fullDateTimePST}]\n\n${currentPrompt}`;
      }
    } else if (enrichedPrompt) {
      enrichedPrompt = `[LIVE REAL-TIME SYSTEM CLOCK: ${fullDateTimePST}]\n\n${currentPrompt}`;
    }

    const currentParts = buildUserParts(enrichedPrompt, attachments);
    if (currentParts.length > 0) {
      rawContents.push({
        role: "user",
        parts: currentParts,
      });
    }

    const formattedContents = normalizeConversationHistory(rawContents);

    const systemInstruction = assembleSystemInstruction({
      focusArea,
      customEt,
      memoryItems,
      isVoiceMode,
      liveDateTimePST: fullDateTimePST,
    });

    const { response } = await generateContentWithFallback(
      ai,
      formattedContents,
      systemInstruction
    );

    for (const s of extractGroundingSources(response)) {
      if (!collectedSources.has(s.uri)) {
        collectedSources.set(s.uri, s);
      }
    }

    const sources = Array.from(collectedSources.values());

    res.json({
      text: response.text,
      sources: sources.length > 0 ? sources : undefined,
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ChatET server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
