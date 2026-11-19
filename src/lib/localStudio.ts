import { deriveArtDirection } from "./artDirection";
import type { ArtDirection, BriefSection, DesignRationaleItem, GeneratedBundle, Intake, SitemapPage } from "./types";
import { SECTION_DEFS } from "./types";

function id(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

function tonesList(intake: Intake) {
  return intake.tones.length ? intake.tones.join(", ") : "considered and clear";
}

function nameOf(intake: Intake) {
  return intake.clientName.trim() || intake.projectName.trim() || "the studio";
}

function paragraphs(...blocks: string[]) {
  return blocks.filter(Boolean).join("\n\n");
}

function architectureBundle(intake: Intake): { sections: BriefSection[]; sitemap: SitemapPage[] } {
  const n = nameOf(intake);
  return {
    sections: [
      {
        id: "executive-summary",
        title: "Executive Summary",
        body: paragraphs(
          `${n} should feel like a materials library you can walk through, not a project database. The website exists to help a specific kind of homeowner recognize themselves: someone already past the Pinterest phase, looking for a quiet partner who will stay with a house for years.`,
          `The primary job of the first release is to earn a private inquiry, not to catalogue every drawing the studio has ever produced. ${intake.coreGoal || "The site should attract commissions that match the studio’s actual pace and craft."} Budget and timeline (${intake.budget || "to be confirmed"}, ${intake.timeline || "to be confirmed"}) suggest a focused marketing site with a carefully edited work index, not a custom platform.`,
        ),
      },
      {
        id: "audience-positioning",
        title: "Audience & Positioning",
        body: paragraphs(
          `Primary reader: ${intake.audience || "design-literate homeowners considering a long-term house."} They are comparing two or three architects, often after an unsatisfactory first experience elsewhere. They will judge the studio by restraint — what is left unsaid, how photographs are sequenced, whether the language sounds like the rooms.`,
          `Positioning line: ${n} is the studio you hire when the house has to outlast the mood board. Competitors tend to either dramatize the author or flatten the work into a grid. This site should do neither. It should let materials, light, and a few complete houses carry the argument.`,
        ),
      },
      {
        id: "conversion-flow",
        title: "Core Conversion Flow",
        body: paragraphs(
          `Home establishes atmosphere and a single invitation to look at finished houses. Work presents three to five complete projects in depth rather than a thumbnail dump. Approach explains how a commission actually unfolds. Inquire is a short, human letter — not a lead form with eighteen fields.`,
          `Success is a composed inquiry from a qualified household, plus an optional request to visit the studio. Secondary paths: press or collaboration, handled as a quiet link rather than a campaign. Nothing in the public flow should demand a budget number; that conversation belongs in the first meeting.`,
        ),
      },
      {
        id: "tone-voice",
        title: "Tone & Voice Guidelines",
        body: paragraphs(
          `Voice is ${tonesList(intake)}, with a reserve of ${intake.voiceReserve}/100 (lower is more restrained). Write in complete sentences. Prefer nouns you can touch — timber, lime, north light — over abstractions like “bespoke luxury.” Never claim awards the studio has not named in writing.`,
          `Do not use “we craft spaces” or “timeless elegance.” The studio may say “we draw slowly,” “the house should feel inevitable,” or “we stay through the punch list.” Captions are factual: place, year, typologies. First person plural is allowed; first person singular is reserved for a signed note from the principal.`,
        ),
      },
      {
        id: "discovery-questions",
        title: "Discovery Questions",
        body: paragraphs(
          `1. Which three finished houses must appear in the first release, and which are still too private?\n2. What should a first-time visitor understand in the first fifteen seconds that a typical architecture site buries in About?\n3. How does a commission actually start — letter, call, or a visit — and what should the inquire page promise?\n4. Are there typologies the studio wants to stop attracting?\n5. Which photographs are authorized for web, and who holds the credit line?`,
        ),
      },
      {
        id: "deliverables-risks",
        title: "Deliverables & Risks",
        body: paragraphs(
          `Deliverables: art direction, a six-page marketing site, a work index with two levels of depth, a written inquire flow, and a handoff document the studio can maintain without a developer standing by. Photography direction is included; a new shoot is optional and scoped separately.`,
          `Risks: over-building a CMS the studio will not tend; publishing a private site before consent; letting the archive dilute the three houses that should do the talking. Mitigation: edit ruthlessly, keep proprietary notes off the public templates, and launch with a still, complete set rather than a “coming soon” grid.`,
        ),
      },
    ],
    sitemap: [
      { id: id("page", 0), name: "Home", purpose: "Atmosphere, one complete house in view, and a calm invitation to the work.", sections: ["Full-bleed opening photograph", "One-sentence studio stance", "Featured house", "Inquire cue"], heroCopy: "Houses that feel inevitable, drawn slowly." },
      { id: id("page", 1), name: "Work", purpose: "An edited index of complete projects, not a complete archive.", sections: ["Typology filter, used sparingly", "Project covers", "Selected drawings"], heroCopy: "A few houses, told in full." },
      { id: id("page", 2), name: "Approach", purpose: "How a commission unfolds from the first letter to the last site visit.", sections: ["Phases", "What the studio needs from a client", "What the studio will not rush"], heroCopy: "The drawing is a conversation that lasts years." },
      { id: id("page", 3), name: "Studio", purpose: "People, the room they work in, and the way they collaborate with builders.", sections: ["Short history", "Portraits", "Collaborators"], heroCopy: "A small room, a long table, a practice." },
      { id: id("page", 4), name: "Journal", purpose: "Occasional notes on making, not a content engine.", sections: ["Essays", "Site photographs", "Reading list"], heroCopy: "Notes from the drawing table." },
      { id: id("page", 5), name: "Inquire", purpose: "A short, human letter that starts a private conversation.", sections: ["How to write to the studio", "What to include", "Quiet contact details"], heroCopy: "Tell us about the house you have in mind." },
    ],
  };
}

function coffeeBundle(intake: Intake): { sections: BriefSection[]; sitemap: SitemapPage[] } {
  const n = nameOf(intake);
  return {
    sections: [
      {
        id: "executive-summary",
        title: "Executive Summary",
        body: paragraphs(
          `${n} should feel like stepping up to the cupping table: warm, exact, and uninterested in pretending to be a marketplace. The site’s first job is to make a seasonal subscription feel like a relationship with a roaster, not a checkout coupon.`,
          `${intake.coreGoal || "Sell subscriptions and tell origin stories without flattening the craft."} With a ${intake.budget || "focused"} budget and ${intake.timeline || "a seasonal calendar"}, the first release should cover the roast list, the subscription, the café if it exists, and a journal that can be quiet when the harvest is loud.`,
        ),
      },
      {
        id: "audience-positioning",
        title: "Audience & Positioning",
        body: paragraphs(
          `Primary readers: ${intake.audience || "home baristas and neighborhood regulars."} They already know what a roast date is. A second audience arrives with a gift in mind and needs a shorter path: one bag, one note, one good explanation of why this coffee exists.`,
          `Position ${n} as a roaster you can trust when the label gets out of the way. The site should smell like the shop — paper, heat, a little fruit — and never like a growth team. Competitors over-design the bag and under-write the farm. Do the opposite.`,
        ),
      },
      {
        id: "conversion-flow",
        title: "Core Conversion Flow",
        body: paragraphs(
          `Home leads with what is roasting now and a single subscription invitation. Coffees is a tasting list, not a catalog grid of identical cards. Subscription explains cadence, pause, and gift with plain language. Visit (or Café) carries hours and the human texture of the room.`,
          `The conversion is a first bag or a first cycle, followed by a reason to stay through the next harvest. Wholesale is a door, not a department: a short request form, reviewed by a person. Public pages should never expose wholesale terms.`,
        ),
      },
      {
        id: "tone-voice",
        title: "Tone & Voice Guidelines",
        body: paragraphs(
          `Voice is ${tonesList(intake)}, reserve ${intake.voiceReserve}/100. Be hospitable without becoming cute. Sensory words are welcome if they are true; “notes of nostalgia” are not. Prefer “washed process, red apple, cocoa” to “journey into terroir.”`,
          `Banned: “fuel your day,” “crafted for champions,” any claim about productivity. Allowed: roast dates, water guidance, the name of a producer, a sentence about why a lot was bought. Sign journal notes. Keep the menu typography as careful as the bag.`,
        ),
      },
      {
        id: "discovery-questions",
        title: "Discovery Questions",
        body: paragraphs(
          `1. Which coffees must be on the site on opening day, and which rotate too quickly to design around?\n2. How should a first-time buyer choose if they do not already speak in tasting notes?\n3. What does a paused or gifted subscription need to feel like in writing?\n4. Which origin stories have permission, and which photographs belong to producers?\n5. What, if anything, should be said about a future space that is not yet public?`,
        ),
      },
      {
        id: "deliverables-risks",
        title: "Deliverables & Risks",
        body: paragraphs(
          `Deliverables: art direction, a roast list pattern, subscription narrative and flow, a café or visit page, and a light journal. E-commerce hooks are scoped to the existing cart; we will not invent a new fulfillment stack in this brief.`,
          `Risks: leaking wholesale pricing, promising a room that is not leased, or building a blog the roaster will not write. Mitigation: keep proprietary notes in the intake, not the templates; launch with a cadence the team already lives; treat empty journal states as designed silence.`,
        ),
      },
    ],
    sitemap: [
      { id: id("page", 0), name: "Home", purpose: "What is roasting now, and why a subscription belongs in the kitchen.", sections: ["Seasonal hero", "This week’s coffees", "Subscription invitation", "The room"], heroCopy: "Coffee for the table, roasted for the week you are actually in." },
      { id: id("page", 1), name: "Coffees", purpose: "A tasting list with origin, process, and a plain recommendation.", sections: ["Current lots", "Tasting notes", "Brew guidance"], heroCopy: "A short list, roasted often." },
      { id: id("page", 2), name: "Subscription", purpose: "Cadence, pause, gifts, and the promise of the next harvest.", sections: ["How it works", "Household and office", "Gifts"], heroCopy: "The harvest, arriving on purpose." },
      { id: id("page", 3), name: "Café", purpose: "Hours, the feel of the room, and how to be a regular.", sections: ["Hours", "What we pour", "The neighborhood"], heroCopy: "A counter, a window, a second cup." },
      { id: id("page", 4), name: "Journal", purpose: "Producer visits and roasting notes, published only when there is something to say.", sections: ["Letters from origin", "Roast notes"], heroCopy: "Letters, not a feed." },
      { id: id("page", 5), name: "Visit", purpose: "How to find the roastery and how to write to the team.", sections: ["Map and hours", "Wholesale door", "Contact"], heroCopy: "Come by, or write ahead." },
    ],
  };
}

function fintechBundle(intake: Intake): { sections: BriefSection[]; sitemap: SitemapPage[] } {
  const n = nameOf(intake);
  return {
    sections: [
      {
        id: "executive-summary",
        title: "Executive Summary",
        body: paragraphs(
          `${n} should read like a precise memo you are relieved to have received: calm, senior, and free of the swagger that haunts too many fintech sites. The website exists to book a discovery call with counsel or a founder who already knows they need a serious compliance partner.`,
          `${intake.coreGoal || "Qualify and book discovery conversations with Series A–B teams."} The ${intake.budget || "stated budget"} and ${intake.timeline || "stated timeline"} support a durable advisory site with room for legal review, not a campaign microsite. Public pages will never list clients or auditors the firm has not cleared.`,
        ),
      },
      {
        id: "audience-positioning",
        title: "Audience & Positioning",
        body: paragraphs(
          `Primary readers: ${intake.audience || "founders, general counsel, and operations leads in regulated financial products."} They are scanning for signs of judgment — what the firm refuses, how it writes about risk, whether the work sounds reusable or merely expensive.`,
          `Position ${n} as the partner you call before the policy is drafted, not after the letter from the regulator. Avoid both the law-firm crest and the startup gradient. The firm is a studio of specialists. The site should feel like vellum and graphite, with a single signal color reserved for genuine calls to action.`,
        ),
      },
      {
        id: "conversion-flow",
        title: "Core Conversion Flow",
        body: paragraphs(
          `Home states the practice in one paragraph and offers a single action: request a conversation. Services explains engagements without turning them into SKUs. Industries shows pattern recognition, not testimonials that cannot be cleared. Insights holds short, dated notes that prove the firm is in the work.`,
          `The conversion is a scheduled discovery call, qualified by a short, respectful form (role, product type, what is at stake). No chat widget, no fake urgency. A secondary path for speaking and press is available but visually quiet.`,
        ),
      },
      {
        id: "tone-voice",
        title: "Tone & Voice Guidelines",
        body: paragraphs(
          `Voice is ${tonesList(intake)}, reserve ${intake.voiceReserve}/100. Prefer short, exact sentences. Define a term the first time it appears. Never scare, never flatter. “We help you navigate complexity” is banned. “We draft the program, train the team, and stay through the exam” is acceptable if true.`,
          `Do not use stock urgency, client logos without written consent, or any claim about guaranteed outcomes. The word “innovative” is not needed. The word “material” is. Sign thought leadership. Let legal review the insights index before launch.`,
        ),
      },
      {
        id: "discovery-questions",
        title: "Discovery Questions",
        body: paragraphs(
          `1. Which engagements can be described in public language, and which must remain generic?\n2. What must a founder understand on the first screen that a typical compliance site hides behind “Our approach”?\n3. Who is allowed to speak for the firm in Insights, and what is the review path?\n4. Which claims about examinations, frameworks, or geographies are currently accurate?\n5. What contact path is actually monitored — and overnight, who answers?`,
        ),
      },
      {
        id: "deliverables-risks",
        title: "Deliverables & Risks",
        body: paragraphs(
          `Deliverables: art direction, a five-to-six page advisory site, a services model that can survive legal review, an insights pattern, and a discovery-call handoff. A component library is included so later policy pages do not drift.`,
          `Risks: accidental disclosure of a roster or auditor; over-promising a jurisdiction; a form that collects more than the firm is prepared to store. Mitigation: keep proprietary notes out of public copy, minimize form fields, and treat legal review as a design constraint, not a last-minute gate.`,
        ),
      },
    ],
    sitemap: [
      { id: id("page", 0), name: "Home", purpose: "State the practice and offer one calm action: a conversation.", sections: ["Positioning paragraph", "Engagement snapshot", "Request a conversation"], heroCopy: "Compliance counsel for teams who would rather get it right the first time." },
      { id: id("page", 1), name: "Services", purpose: "Engagements described with enough precision to self-qualify.", sections: ["Program design", "Examinations", "Training", "Ongoing counsel"], heroCopy: "Work we will sign our name to." },
      { id: id("page", 2), name: "Industries", purpose: "Pattern recognition across product types, without naming unreleased clients.", sections: ["Payments", "Lending", "Banking as a service", "Crypto where lawful"], heroCopy: "The same judgment, in different product rooms." },
      { id: id("page", 3), name: "Insights", purpose: "Short, dated notes that prove the firm is in the work.", sections: ["Memoranda", "Talks", "Reading"], heroCopy: "Letters from the desk, not a newsroom." },
      { id: id("page", 4), name: "Firm", purpose: "People, posture, and the way engagements are staffed.", sections: ["Principals", "How we work", "Careers, quietly"], heroCopy: "A small firm, senior on purpose." },
      { id: id("page", 5), name: "Contact", purpose: "A respectful path to a discovery call.", sections: ["What to include", "Scheduling", "Other inquiries"], heroCopy: "Tell us what is at stake. We will write back." },
    ],
  };
}

function genericBundle(intake: Intake): { sections: BriefSection[]; sitemap: SitemapPage[] } {
  const n = nameOf(intake);
  const goal = intake.coreGoal || "Give a qualified visitor a clear next step and a reason to trust the work.";
  return {
    sections: [
      {
        id: "executive-summary",
        title: "Executive Summary",
        body: paragraphs(
          `This brief frames a marketing website for ${n} in ${intake.industry || "its category"}. The site should feel authored — typographic, calm, and specific — and it should be measurable against one outcome: ${goal}`,
          `Scope is bounded by ${intake.budget || "the agreed budget"} and ${intake.timeline || "the agreed timeline"}. We will design a complete first release, not a speculative platform.`,
        ),
      },
      {
        id: "audience-positioning",
        title: "Audience & Positioning",
        body: paragraphs(
          `Primary audience: ${intake.audience || "the people who can actually hire or buy."} They will arrive mid-comparison. The site must answer, in the first screen, why this practice is the right one and what happens if they write in.`,
          `${n} should be positioned with a sentence only this client could say. Avoid category clichés. Use the tone palette (${tonesList(intake)}) as a filter on every heading.`,
        ),
      },
      {
        id: "conversion-flow",
        title: "Core Conversion Flow",
        body: paragraphs(
          `Home states the offer and points to proof. A work or services index does the convincing. About or Approach supplies judgment and method. Contact is a short, human request, not a maze.`,
          `Secondary paths (journal, careers, press) stay visually quieter than the primary conversion. Do not invent urgency. Do not collect fields the team will not read.`,
        ),
      },
      {
        id: "tone-voice",
        title: "Tone & Voice Guidelines",
        body: paragraphs(
          `Voice is ${tonesList(intake)}, with a reserve of ${intake.voiceReserve}/100. Write in the client’s real vocabulary. Prefer concrete nouns and verbs a practitioner would use in the room.`,
          `Banned: empty claims of innovation, stock urgency, and metaphors the client would not say aloud. Allowed: precise process language, named constraints, and a point of view about quality.`,
        ),
      },
      {
        id: "discovery-questions",
        title: "Discovery Questions",
        body: paragraphs(
          `1. What must a first-time visitor understand before they scroll?\n2. Which proofs (projects, services, writing) are cleared for the first release?\n3. What is the actual conversion, and who answers it?\n4. Which topics are strategically useful but politically sensitive?\n5. What will the client realistically update without us?`,
        ),
      },
      {
        id: "deliverables-risks",
        title: "Deliverables & Risks",
        body: paragraphs(
          `Deliverables: art direction, a focused page set, a component system, and a written handoff. Copy in this brief is a starting point for collaboration, not finished legal language.`,
          `Risks: scope creeping into a product, publishing uncleared facts, or designing a journal no one will write. Mitigation: keep the first release small, keep proprietary notes off public templates, and design empty states as if they might last.`,
        ),
      },
    ],
    sitemap: [
      { id: id("page", 0), name: "Home", purpose: "State the offer, show one proof, and invite a conversation.", sections: ["Positioning", "Featured proof", "Primary action"], heroCopy: `${n}: a clear offer, plainly said.` },
      { id: id("page", 1), name: "Work", purpose: "Proof, edited for the first release.", sections: ["Index", "Selected case"], heroCopy: "A few pieces, told properly." },
      { id: id("page", 2), name: "Approach", purpose: "How the work actually happens.", sections: ["Method", "What we need", "What we refuse"], heroCopy: "The method, without the mythology." },
      { id: id("page", 3), name: "About", purpose: "People and posture.", sections: ["Story", "Team"], heroCopy: "The practice behind the work." },
      { id: id("page", 4), name: "Notes", purpose: "Occasional writing, only when there is something to say.", sections: ["Essays"], heroCopy: "Notes, not a feed." },
      { id: id("page", 5), name: "Contact", purpose: "A short, human request.", sections: ["How to write", "What happens next"], heroCopy: "Write to us. We read everything that arrives." },
    ],
  };
}


function defaultRationale(intake: Intake, flavor: "architecture" | "coffee" | "fintech" | "hotel" | "generic"): DesignRationaleItem[] {
  const n = nameOf(intake);
  if (flavor === "architecture") {
    return [
      {
        recommendation: "Lead with three complete houses, not a searchable archive.",
        reasoning: "The intended client already knows how to read a grid and is looking for judgment. A complete house, told slowly, is a stronger proof than a catalogue.",
        businessObjective: "Attract private residential commissions that match the studio's actual pace.",
        implementation: "Home and Work show three to five finished houses in depth. The archive, if it exists, stays one click further back and visually quieter.",
      },
      {
        recommendation: "Make Inquire a letter, not a lead form.",
        reasoning: "Eighteen fields signal a marketing engine. A short human letter signals a practice that will stay through the punch list.",
        businessObjective: "Earn composed inquiries from qualified households, not volume RFPs.",
        implementation: "One writable field, a clear promise of what happens next, and no public request for budget numbers.",
      },
      {
        recommendation: "Keep typography quiet and material, with generous margins.",
        reasoning: `Voice is reserved (${intake.voiceReserve}/100). The site should feel like the rooms: lime, timber, north light — not a dramatized author portrait.`,
        businessObjective: "Let materials and sequence carry the argument so the right clients self-select.",
        implementation: "Serif display for house names, a calm sans for body, captions that state place and year only.",
      },
    ];
  }
  if (flavor === "coffee") {
    return [
      {
        recommendation: "Treat subscription as hospitality, not a funnel.",
        reasoning: "Regulars already care about roast dates. Hard urgency would cheapen the roasting voice the brand actually has.",
        businessObjective: "Sell seasonal subscriptions without sounding like a marketplace.",
        implementation: "Home offers a current roast and a quiet subscribe path. Origin stories sit beside the offer, never as interstitial popovers.",
      },
      {
        recommendation: "Show the roast calendar as typography, not as a dashboard.",
        reasoning: "The audience is visually literate and tired of app chrome. A printed-calendar feeling is more on-brand than cards with badges.",
        businessObjective: "Help gift buyers and regulars understand when to join, without gamifying scarcity.",
        implementation: "A typographic harvest calendar on Shop, with roast dates in mono and origin notes in serif.",
      },
      {
        recommendation: "Keep wholesale and unannounced locations off the public templates.",
        reasoning: "Confidential notes in this intake include pricing and a lease that is not signed. Publishing either would be a studio failure, not a CMS feature.",
        businessObjective: "Protect commercial relationships while still sounding open and hospitable.",
        implementation: "Public pages never interpolate proprietary notes. Press contact lives in a gated kit, not in the footer.",
      },
    ];
  }
  if (flavor === "fintech") {
    return [
      {
        recommendation: "Sound precise without imitating a law firm.",
        reasoning: "Counsel and founders at Series A–B already have lawyers. They need a calm senior partner, not engraved letterhead or startup pep.",
        businessObjective: "Book qualified discovery calls with regulated or soon-to-be-regulated teams.",
        implementation: "Short declarative sentences, named constraints, and a contact flow that asks for the product — not a newsletter gate.",
      },
      {
        recommendation: "Keep the client roster and auditor name off the public site.",
        reasoning: "Proof can be typological ('payments, lending, custody') without naming accounts the intake marks confidential.",
        businessObjective: "Build trust without creating a compliance incident.",
        implementation: "Case studies, if any, are anonymized until counsel clears a name. The policy memo is not excerpted.",
      },
      {
        recommendation: "Use a compact typographic system with a single accent.",
        reasoning: "Visual noise reads as imprecision. A restrained palette signals the same discipline as the advice.",
        businessObjective: "Look like a room where serious work happens.",
        implementation: "One deep ink, one paper ground, one terracotta cue for primary actions only.",
      },
    ];
  }
  if (flavor === "hotel") {
    return [
      {
        recommendation: "Design for direct booking of design-led stays, not for an OTA facsimile.",
        reasoning: `${n} is a maison, not a chain. The first screen should feel like arrival at the desk — light, linen, a reserved calm — rather than a calendar widget fighting for attention.`,
        businessObjective: "Increase direct reservations from design-literate travelers who would otherwise default to a marketplace.",
        implementation: "Home opens on a single photograph and one sentence of stance. Availability is a quiet second action, never a sticky bar that covers the typography.",
      },
      {
        recommendation: "Give L'Étoile its own page, and keep unpublished house details off every public template.",
        reasoning: "The signature suite is a story the house can tell. Pricing sheets and unpublished rooms are not. Publishing either would be a breach, not a feature.",
        businessObjective: "Romance the suite guests can book, while the Privacy Shield keeps proprietary notes from leaving the studio device when a cloud model is required.",
        implementation: "A dedicated Suite page with material notes and a request path. Rate cards, annex addresses, and private family résumés never interpolate into public copy.",
      },
      {
        recommendation: "Set type like a house journal: a lyrical display, a readable text face, and mono only for reservations.",
        reasoning: "Boutique hospitality is judged in the first two seconds of typography. A generic sans stack would make The Aster Hotel look like a template.",
        businessObjective: "Signal editorial craft so the right guests self-select before they ask about price.",
        implementation: "Instrument Serif for the house name and suite titles, DM Sans for body, IBM Plex Mono for confirmation numbers and dates.",
      },
      {
        recommendation: "Photograph materials and morning light, not lifestyle casting.",
        reasoning: "The audience has already seen polished influencer rooms. They will trust stone, linen, and a courtyard at 8 a.m. more than a posed couple.",
        businessObjective: "Convert skepticism into a reservation inquiry by showing the actual house.",
        implementation: "A restrained five-color palette drawn from plaster, ink, terracotta tile, garden green, and linen. Motion is limited to slow fades; nothing bounces.",
      },
    ];
  }
  return [
    {
      recommendation: `Lead with a single, plainly stated offer for ${n}.`,
      reasoning: "Most studio sites hide the offer under atmosphere. A first-time visitor should understand the work before they scroll.",
      businessObjective: intake.coreGoal || "Earn a qualified inquiry from the intended audience.",
      implementation: "Home states the offer, shows one proof, and points to a short, human contact path.",
    },
    {
      recommendation: "Edit the first-release sitemap to what the team will actually maintain.",
      reasoning: "A journal no one will write, or a CMS no one will tend, dilutes the pages that should do the talking.",
      businessObjective: "Launch a complete, still set rather than a 'coming soon' grid.",
      implementation: "Five or six pages, each with a purpose, hero line, and a realistic empty state.",
    },
    {
      recommendation: "Keep typography and palette restrained enough to print.",
      reasoning: "A brief that cannot survive print will not survive a client meeting. Color and type should be decisions, not decoration.",
      businessObjective: "Hand over a studio-grade deliverable the client can sign without a slide deck.",
      implementation: "Five named swatches with real hex values, a type scale with specimens, and numbered brief sections.",
    },
  ];
}

function hotelBundle(intake: Intake): { sections: BriefSection[]; sitemap: SitemapPage[] } {
  const n = nameOf(intake);
  return {
    sections: [
      {
        id: "executive-summary",
        title: "Executive Summary",
        body: paragraphs(
          `${n} should feel like a small maison you can almost smell: lime plaster, courtyard shade, linen at the end of a long journey. The website is not a booking engine with a photograph attached. It exists so a particular traveler — design-led, a little tired of marketplaces — recognizes the house and writes to reserve a stay directly.`,
          `${intake.coreGoal || "The first release should convert design-literate travelers into direct reservations."} Budget and timeline (${intake.budget || "to be confirmed"}, ${intake.timeline || "to be confirmed"}) suggest a focused marketing site with a considered reservation request, not a custom booking platform. The signature suite, L'Étoile, can be told in public. Proprietary rates and private family rooms cannot.`,
        ),
      },
      {
        id: "audience-positioning",
        title: "Audience & Positioning",
        body: paragraphs(
          `Primary reader: ${intake.audience || "design-literate couples and independent travelers booking a short, considered stay."} They have already stayed in beautiful rooms. They are comparing a handful of independent houses, often after an OTA stay that looked better than it felt. They will judge the maison by restraint — the photograph that is allowed to be still, the sentence that does not sell.`,
          `Positioning line: ${n} is the house you write to when you want the room to feel inevitable. Competitors either dramatize lifestyle or flatten the stay into dates and amenities. This site should do neither. It should let materials, morning light, and a few complete rooms carry the argument.`,
        ),
      },
      {
        id: "conversion-flow",
        title: "Core Conversion Flow",
        body: paragraphs(
          `Home establishes arrival and a single invitation to look at the rooms. Stay presents the rooms with honesty. L'Étoile is given its own page so the signature suite can be romanticized without leaking proprietary rates. The House explains the courtyard, the kitchen, and the way a stay actually unfolds. Reserve is a short, human request — dates, names, a note — not a maze of add-ons.`,
          `Success is a composed reservation inquiry from a qualified guest, plus an occasional press or collaboration letter handled quietly. Nothing in the public flow should demand a budget, a membership, or a third-party login. Availability can be confirmed in the reply.`,
        ),
      },
      {
        id: "tone-voice",
        title: "Tone & Voice Guidelines",
        body: paragraphs(
          `Voice is ${tonesList(intake)}, with a reserve of ${intake.voiceReserve}/100 (lower is more restrained). Write in complete sentences. Prefer nouns you can touch — plaster, linen, courtyard, morning coffee — over abstractions like “boutique luxury” or “unforgettable escape.” Never invent awards, famous guests, or a rate the intake has marked confidential.`,
          `Do not use “hidden gem,” “our passionate team,” or “treat yourself.” The house may say “the room faces the courtyard,” “breakfast is set in the kitchen,” or “write to us with the dates you have in mind.” Captions are factual: room, aspect, material. First person plural is allowed; a signed note from the family is reserved for a single, careful letter.`,
        ),
      },
      {
        id: "discovery-questions",
        title: "Discovery Questions",
        body: paragraphs(
          `1. Which rooms and photographs are cleared for the first release, and which still belong to the family?\n2. What should a first-time visitor understand in fifteen seconds that a booking site buries in filters?\n3. How does a reservation actually start — a letter, a call, a confirmed date — and what should Reserve promise?\n4. Which seasonal closures or house rules must be public, and which remain in the reply?\n5. Who holds the credit line on the courtyard photographs, and may L'Étoile appear in press?`,
        ),
      },
      {
        id: "deliverables-risks",
        title: "Deliverables & Risks",
        body: paragraphs(
          `Deliverables: art direction, a six-page marketing site, a room index with a dedicated suite page, a written reserve flow, and a handoff document the maison can update without a developer standing by. Photography direction is included; a new shoot is optional and scoped separately.`,
          `Risks: imitating an OTA; publishing proprietary rates or private family rooms; over-building a booking engine the house will not staff. Mitigation: keep proprietary notes off public templates, design Reserve as a letter, and launch with a still, complete set of rooms rather than a “coming soon” grid.`,
        ),
      },
    ],
    sitemap: [
      { id: id("page", 0), name: "Home", purpose: "Arrival, one courtyard photograph, and a calm invitation to the rooms.", sections: ["Full-bleed morning photograph", "One-sentence house stance", "Featured room", "Reserve cue"], heroCopy: "A small maison, morning light, a room that feels inevitable.", priority: true, conversionGoal: "Invite a direct reservation inquiry." },
      { id: id("page", 1), name: "Stay", purpose: "An edited index of bookable rooms, told with materials rather than amenity lists.", sections: ["Room covers", "Aspect and materials", "Quiet details"], heroCopy: "Rooms named for light, not for categories.", conversionGoal: "Help a guest choose a room.", children: [
        { id: id("page", 6), name: "Garden Room", purpose: "A quieter courtyard room for longer stays.", sections: ["Aspect", "Materials"], heroCopy: "The room that faces the lime trees.", conversionGoal: "Request the Garden Room." },
      ] },
      { id: id("page", 2), name: "L'Étoile", purpose: "The signature suite, told in full, without a public rate card.", sections: ["The room", "The view", "How to request it"], heroCopy: "L'Étoile — the room the house was drawn around.", priority: true, conversionGoal: "Request L'Étoile by letter." },
      { id: id("page", 3), name: "The House", purpose: "Courtyard, kitchen, and the way a stay actually unfolds.", sections: ["The courtyard", "Breakfast", "House notes"], heroCopy: "The house is the stay, not a backdrop." },
      { id: id("page", 4), name: "Journal", purpose: "Occasional notes on the maison, not a content engine.", sections: ["Seasonal notes", "A reading chair"], heroCopy: "Notes from the courtyard." },
      { id: id("page", 5), name: "Reserve", purpose: "A short, human request that starts a private confirmation.", sections: ["Dates and names", "What to include", "What happens next"], heroCopy: "Write to us with the dates you have in mind.", priority: true, conversionGoal: "Send a reservation letter." },
    ],
  };
}

function pickBundle(intake: Intake): { sections: BriefSection[]; sitemap: SitemapPage[]; flavor: "architecture" | "coffee" | "fintech" | "hotel" | "generic" } {
  const hay = `${intake.industry} ${intake.projectName} ${intake.clientName}`.toLowerCase();
  if (hay.includes("hotel") || hay.includes("hospitality") || hay.includes("maison") || hay.includes("aster") || hay.includes("étoile") || hay.includes("etoile")) {
    return { ...hotelBundle(intake), flavor: "hotel" };
  }
  if (hay.includes("architect") || hay.includes("harbor")) return { ...architectureBundle(intake), flavor: "architecture" };
  if (hay.includes("coffee") || hay.includes("roaster") || hay.includes("kiln")) return { ...coffeeBundle(intake), flavor: "coffee" };
  if (hay.includes("fintech") || hay.includes("compliance") || hay.includes("ledgerwell")) return { ...fintechBundle(intake), flavor: "fintech" };
  return { ...genericBundle(intake), flavor: "generic" };
}

export function composeLocalBrief(intake: Intake): GeneratedBundle {
  const { sections, sitemap, flavor } = pickBundle(intake);
  const artDirection: ArtDirection = deriveArtDirection(intake);
  return { sections, sitemap, artDirection, rationale: defaultRationale(intake, flavor) };
}

export function composeLocalSection(intake: Intake, sectionId: string, current: BriefSection): BriefSection {
  const fresh = composeLocalBrief(intake).sections.find((section) => section.id === sectionId);
  if (!fresh) return current;
  return { ...fresh, body: fresh.body };
}

export function ensureSectionOrder(sections: BriefSection[]): BriefSection[] {
  const map = new Map(sections.map((section) => [section.id, section]));
  return SECTION_DEFS.map((def) => map.get(def.id) ?? { id: def.id, title: def.title, body: "" });
}
