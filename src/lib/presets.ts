import type { Intake } from "./types";

export interface ClientPreset {
  id: string;
  kicker: string;
  title: string;
  lede: string;
  intake: Intake;
}

export const CLIENT_PRESETS: ClientPreset[] = [
  {
    id: "aster-hotel",
    kicker: "Judge demo",
    title: "The Aster Hotel",
    lede: "A fictional maison with edge-case quotes, contacts, budget, and a reserved rate card.",
    intake: {
      projectName: "The Aster Hotel",
      clientName: "Maison \"JJ\" Aster & Co.",
      industry: "Independent boutique hospitality",
      budget: "€42,000–€58,000 (design + build)",
      timeline: "14 weeks, spring arrival",
      tones: ["hospitable", "editorial", "quiet"],
      voiceReserve: 34,
      coreGoal:
        "Book direct stays from design-led travelers who would otherwise default to an OTA, without turning the maison into a marketplace.",
      audience:
        "Independent travelers and couples who value distinctive accommodation, thoughtful design, and a more personal hospitality experience.",
      confidentialNotes:
        "Do not publish the reserved suite rate card or the owner's private annex at 14\\bis Rue des Teinturiers.\nPress: press@asterhotel.example. The signature suite is called L'Étoile — the family résumé stays off every public template.\nPrincipal: jane.jj.aster@asterhotel.example · +33 1 42 86 17 09",
    },
  },
  {
    id: "harbor-line",
    kicker: "Architecture",
    title: "Harbor & Line",
    lede: "An independent architecture studio seeking quiet residential commissions.",
    intake: {
      projectName: "Harbor & Line — Studio Website",
      clientName: "Harbor & Line Architects",
      industry: "Independent architecture studio",
      budget: "$18–24k design and build",
      timeline: "10 weeks, spring launch",
      tones: ["quiet", "material", "editorial"],
      voiceReserve: 28,
      coreGoal:
        "Attract private residential commissions from couples planning a long-term house, not volume commercial RFPs.",
      audience:
        "Design-literate homeowners, typically 35–60, who have already hired (or almost hired) an architect once and want a calmer, more material-led partner.",
      confidentialNotes:
        "Do not publish the waterfront parcel address or the family name attached to the unbuilt house. Principal email is hidden from the public site: mira@harborandline.example.",
    },
  },
  {
    id: "kiln-grain",
    kicker: "Specialty coffee",
    title: "Kiln & Grain",
    lede: "A roastery that needs subscription sales without sounding like a marketplace.",
    intake: {
      projectName: "Kiln & Grain — Roastery Site",
      clientName: "Kiln & Grain",
      industry: "Specialty coffee roaster",
      budget: "$12–16k design and build",
      timeline: "8 weeks, harvest calendar",
      tones: ["warm", "hospitable", "material"],
      voiceReserve: 62,
      coreGoal:
        "Sell seasonal subscriptions and tell origin stories with enough warmth that regulars feel hosted, not funneled.",
      audience:
        "Home baristas and neighborhood regulars who already care about roast dates, and a second ring of curious gift buyers.",
      confidentialNotes:
        "Wholesale pricing sheet is confidential. Do not mention the Q2 opening on Division Street until the lease is signed. Press contact: press@kilnandgrain.example.",
    },
  },
  {
    id: "ledgerwell",
    kicker: "Fintech compliance",
    title: "Ledgerwell Advisory",
    lede: "A consultancy that must feel precise without becoming a law-firm clone.",
    intake: {
      projectName: "Ledgerwell — Advisory Website",
      clientName: "Ledgerwell Advisory",
      industry: "Fintech compliance consultancy",
      budget: "$28–40k design and build",
      timeline: "12 weeks, including legal review",
      tones: ["precise", "formal", "quiet"],
      voiceReserve: 22,
      coreGoal:
        "Book qualified discovery calls with Series A–B fintech counsel and founders who need a calm, senior compliance partner.",
      audience:
        "Founders, general counsel, and operations leads at regulated or soon-to-be-regulated financial products.",
      confidentialNotes:
        "Client roster and the SOC 2 auditor name are not for the public site. Do not quote the unreleased policy memo. Counsel line: +1 415 555 0142.",
    },
  },
];
