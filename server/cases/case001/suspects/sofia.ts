import type { ResponseNode, SuspectDef } from "../../types.ts";

/**
 * Sofia only admits being at the Tower once she is under enough pressure.
 * Below the threshold the same evidence just raises her stress.
 */
const wentAdmission = (crack: string, deflect: string, after: string): ResponseNode[] => [
  { when: { notRevealed: ["went"], minStress: 45 },
    text: `${crack} ...All right. I went. He'd texted me — he knew things about me, things he could use. I took a cab, I let myself in the back. When I got upstairs he was on the floor. Already gone. I panicked. The messages on his phone would have destroyed me, so I took it and I ran. That's all. I didn't kill him.`,
    mood: "shaken", stress: 15, reveals: ["went"], grants: ["T_SOFIA_FOUND"] },
  { when: { notRevealed: ["went"] }, text: deflect, mood: "nervous", stress: 20 },
  { text: after, mood: "shaken", stress: 5 },
];

const lanternAdmission: ResponseNode = {
  when: { notRevealed: ["lantern"] },
  text: "...You've read his messages. Yes. I was Lantern. I gave Oliver Hayes the Halvorsen files and the patent history. Somebody had to tell the truth about Daniel Mercer. He found out — that's what the text means. It doesn't mean I killed him.",
  mood: "shaken", stress: 20, reveals: ["lantern"],
};

const brotherAdmission: ResponseNode = {
  when: { notRevealed: ["brother"] },
  text: "...Tom was my half-brother. He wrote Lighthouse — every line of the core. Daniel put his own name on the patent and fired him when he complained. Tom spent a year trying to prove it. Then he stopped trying anything at all. So yes, I took a job with the man who did that. I wanted to see what kind of person could. I found out.",
  mood: "shaken", stress: 15, trust: 5, reveals: ["brother"],
};

export const sofia: SuspectDef = {
  id: "sofia",
  name: "Sofia Bennett",
  age: 29,
  height: "1.64 m",
  profession: "Executive Assistant to the CEO",
  relation: "Assistant",
  personality: "Organised, quiet, observant. Precise answers; rarely volunteers anything.",
  bio: "Joined Lumen Dynamics in early 2025. Manages Mercer's calendar, correspondence and travel, and books the building's maintenance and couriers. Colleagues describe her as indispensable and impossible to read.",
  motive: "None apparent. By all accounts Mercer valued her highly.",
  alibi: "Claims she worked from home on the company VPN after leaving at 20:15.",
  portrait: { skin: "#e2c2a8", hair: "bun", hairColor: "#3d2a1f", outfit: "blouse", outfitColor: "#cfc6b8", glasses: true, age: "young", build: "slim" },
  initial: { stress: 20, trust: 40, mood: "calm" },
  greeting: "Detective. I've brought his calendar for the last month, in case it helps. I didn't know what else to do.",
  topics: [
    { id: "alibi", label: "Where were you last night?", keywords: ["where", "alibi", "last night", "evening", "home", "vpn", "whereabouts", "night", "working"],
      nodes: [
        { when: { revealed: ["went"] }, text: "I've told you. I went to the office. He was dead. I left.", mood: "shaken" },
        { text: "I left the office at 20:15 — the lobby camera will show that. I worked from home until about half eleven. I was on the VPN the whole time; IT can confirm it.", mood: "calm", grants: ["T_SOFIA_ALIBI"] },
      ], repeat: "Home. On the VPN. As I said." },
    { id: "victim", label: "What was Daniel Mercer like to work for?", keywords: ["daniel", "mercer", "boss", "victim", "him", "work for", "like", "relationship"],
      nodes: [{ text: "Exacting. He remembered every mistake you'd ever made. I organised his life for almost two years — his coffee, his passwords, his tailor. I don't think he ever knew where I lived.", mood: "calm" }] },
    { id: "calendar", label: "What was on his calendar last night?", keywords: ["calendar", "schedule", "meeting", "appointment", "diary", "plans", "22:00"],
      nodes: [{ text: "A private meeting at 22:00. He put it in himself — just 'M.R.' That's Marcus Reed. He'd been in a foul mood about the accounts all week; I heard him shouting 'Halvorsen' through the door on Tuesday.", mood: "cooperative" }] },
    { id: "contact", label: "When did you last hear from him?", keywords: ["last", "speak", "spoke", "contact", "text", "message", "call", "heard", "hear"],
      nodes: [
        { when: { revealed: ["went"] }, text: "He texted me. You know that now.", mood: "shaken" },
        { text: "When I left at 20:15. He didn't call; I didn't message. He didn't like to be disturbed in the evenings.", mood: "calm", grants: ["T_SOFIA_NOCONTACT"] },
      ] },
    { id: "keycard", label: "Do you have a keycard to his office?", keywords: ["keycard", "card", "spare", "access", "key", "exec", "badge"],
      nodes: [
        { when: { revealed: ["went"] }, text: "I had the card. I used it. I've said so.", mood: "shaken" },
        { text: "There was a spare executive card, for courier drops. I lost it a few weeks ago — on the tram, I think. I kept meaning to report it.", mood: "nervous", stress: 5, grants: ["T_SOFIA_CARD"] },
      ] },
    { id: "security", label: "How well do you know the building's security?", keywords: ["security", "camera", "cameras", "vigil", "maintenance", "override", "outage", "blackout", "stairwell"],
      nodes: [
        { when: { revealed: ["went"] }, text: "I didn't want to be seen. That's all. I knew how it would look.", mood: "shaken" },
        { text: "I book the maintenance; I don't understand it. Adrian Cole runs the cameras. If they 'malfunctioned', I'd ask him why.", mood: "guarded", stress: 5 },
      ] },
    { id: "others", label: "Who would want him dead?", keywords: ["who", "enemies", "enemy", "suspect", "kill", "killed", "motive", "anyone", "else"],
      nodes: [{ text: "Marcus. Daniel had found something in the accounts. And the cameras going down exactly then — Adrian Cole controls those systems. I'd start with them.", mood: "calm" }] },
    { id: "hayes", label: "Do you know Oliver Hayes?", keywords: ["oliver", "hayes", "journalist", "reporter", "press", "lantern", "leak", "source", "story"],
      nodes: [
        { when: { revealed: ["lantern"] }, text: "Yes. I was Lantern. Oliver is a good journalist. Leave him out of this.", mood: "guarded" },
        { text: "The journalist? Only by reputation. Daniel called him a parasite.", mood: "guarded", stress: 5 },
      ] },
    { id: "brother", label: "Tell me about Thomas Kessler.", keywords: ["thomas", "kessler", "brother", "tom", "family"], requires: { anyEvidence: ["dossier", "brother_photo", "patent"] },
      nodes: [brotherAdmission, { text: "Tom is dead. Daniel made sure of that, in every way but the legal one.", mood: "shaken" }] },
    { id: "rapport", label: "This must be a shock for you.", keywords: ["sorry", "shock", "difficult", "hard", "okay", "are you", "understand", "condolence", "take your time"],
      nodes: [
        { when: { notRevealed: ["rapport1"] }, text: "...Thank you. Nobody's asked how I am. I keep reorganising his calendar for next week. Cancelling things.", mood: "calm", trust: 10, stress: -10, reveals: ["rapport1"] },
        { text: "I'm fine. Really.", mood: "calm", stress: -10 },
      ] },
  ],
  reactions: {
    taxi: wentAdmission("...", "That's... I went for a drive. To think. I didn't go anywhere near the Tower.", "Yes. The cab. I've told you why."),
    spare_card: wentAdmission("...", "I— someone must have put it there.", "My card. Yes."),
    victim_phone: wentAdmission("...", "I don't know how that got there. I don't.", "I took it for the messages. I told you."),
    dock_footage: wentAdmission("...", "Half the city owns a dark raincoat, detective.", "Yes, that's me. I came in the back."),
    vpn_log: [
      { when: { revealed: ["went"] }, text: "I set it up so I'd look busy. I know how that sounds.", mood: "shaken" },
      { text: "The connection was up the whole time. Maybe I was reading. You don't have to type to work.", mood: "defensive", stress: 15 },
    ],
    jiggler: [
      { when: { revealed: ["went"] }, text: "Yes. So it would look like I was working.", mood: "shaken" },
      { text: "It stops the screen locking while I read. Half the office uses one.", mood: "defensive", stress: 10 },
    ],
    door_log: [
      { when: { revealed: ["went"] }, text: "22:44. Yes. That's when I went in. He was already on the floor.", mood: "shaken" },
      { when: { evidence: ["T_SOFIA_CARD"] }, text: "Someone must have found my card. That's what happens when you lose things.", mood: "defensive", stress: 15 },
      { text: "EXEC-SPARE... that's the spare. I— lost it. Weeks ago.", mood: "nervous", stress: 15, grants: ["T_SOFIA_CARD"] },
    ],
    keycard_registry: [
      { when: { revealed: ["went"] }, text: "It was mine. I've stopped pretending otherwise.", mood: "shaken" },
      { text: "Yes, it was issued to me. And then I lost it. I should have reported it.", mood: "nervous", stress: 10, grants: ["T_SOFIA_CARD"] },
    ],
    phone_records: [
      { when: { revealed: ["went"] }, text: "He texted. I answered. Then I went.", mood: "shaken" },
      { text: "...He texted me about work. Some trivial thing. I replied that I'd deal with it. I forgot, that's all.", mood: "nervous", stress: 15 },
    ],
    laptop: [lanternAdmission, { text: "You've read it. You know what he was threatening.", mood: "shaken", stress: 5 }],
    T_OLIVER_LANTERN: [lanternAdmission, { text: "'I'll fix it.' I meant I'd talk to him. Reason with him.", mood: "shaken", stress: 5 }],
    expose: [
      { when: { notRevealed: ["lantern"] }, text: "A good story. I hope they still run it.", mood: "guarded", stress: 5 },
      { text: "They should run it. Every word is true.", mood: "guarded" },
    ],
    dossier: [brotherAdmission, { text: "He paid someone to dig through my family. Of course he did.", mood: "shaken" }],
    brother_photo: [brotherAdmission, { text: "Put that down. Please.", mood: "shaken", stress: 10 }],
    patent: [brotherAdmission, { text: "Tom's name. Then Daniel's. That's the whole story, isn't it.", mood: "shaken" }],
    camera_log: [
      { when: { revealed: ["went"] }, text: "...I didn't want to be seen. I used the code from the maintenance email. That doesn't make me a murderer.", mood: "shaken", stress: 10 },
      { text: "Vigil sends those codes to me because I book the maintenance. Anybody could have read my email — Daniel had access to it, IT has access to it.", mood: "defensive", stress: 15 },
    ],
    vigil_binder: [
      { when: { revealed: ["went"] }, text: "Yes. My code. I've admitted I didn't want to be seen.", mood: "shaken" },
      { text: "Vigil sends those codes to me because I book the maintenance. Anybody could have read my email.", mood: "defensive", stress: 15 },
    ],
    computer: [
      { when: { revealed: ["went"] }, text: "...The screen was on when I came in. That doesn't mean anything. He could have— it doesn't mean anything.", mood: "shaken", stress: 20 },
      { text: "He always worked late. He'd email people at three in the morning.", mood: "calm" },
    ],
    bootprint: [
      { when: { revealed: ["went"] }, text: "Yes, I was there. I've told you I was there.", mood: "shaken" },
      { text: "A lot of women wear a 37, detective.", mood: "defensive", stress: 10 },
    ],
    boots: [{ text: "They're my boots. I was there. I've never said I wasn't — not since...", mood: "shaken", stress: 10 }],
    lab_lighthouse: [
      { when: { revealed: ["went"] }, text: "I didn't touch it. I didn't— I want this to stop now.", mood: "shaken", stress: 20 },
      { text: "That's horrible. Can we stop?", mood: "nervous", stress: 10 },
    ],
    lighthouse: [{ text: "The Beacon award. He made everyone admire it. Tom's work, in crystal, with Daniel's name on it.", mood: "guarded", stress: 10 }],
    suspect_files: [{ text: "One sixty-four. Is that relevant?", mood: "guarded", stress: 5 }],
    garage_log: [{ text: "Marcus came back? Then you know who to talk to.", mood: "calm" }],
    audit: [{ text: "Halvorsen. I told you he'd been shouting about it.", mood: "calm" }],
    T_SOFIA_FOUND: [{ text: "It's the truth. He was dead when I got there.", mood: "shaken" }],
  },
  defaultReaction: ["I'm sorry, I don't see the connection.", "I don't know anything about that.", "Should that mean something to me?"],
  deflection: "Detective, I organise calendars. If you want me to solve your case for you, I'm afraid that isn't in my job description.",
  unknown: ["I'm sorry — could you rephrase that?", "I don't understand the question."],
  ai: {
    voice: "Quiet, formal, precise, short sentences. Volunteers true details that point at others. Under pressure: composure cracks into brittle, clipped answers.",
    knows: [
      "She is Mercer's executive assistant and manages his calendar, email and building maintenance bookings.",
      "Mercer's calendar showed a private 22:00 meeting with 'M.R.' (Marcus Reed). Mercer had been angry about 'Halvorsen' all week. (True.)",
      "She left by the lobby at 20:15 (true) and claims she worked from home on the VPN all evening (false).",
      "She claims she lost the spare executive card weeks ago (false).",
      "She claims she had no contact with Mercer after 20:15 (false).",
      "She claims to know Oliver Hayes only by reputation (false).",
    ],
    hides: [
      "She is LANTERN, Hayes's source (admits only when shown Mercer's messages or Hayes's Lantern message).",
      "Her half-brother was Thomas Kessler, the engineer Mercer stole Lighthouse from (admits only when shown the dossier, the patent records or the photograph).",
      "She went to the Tower that night (admits only under heavy pressure with hard evidence, and then claims Mercer was already dead).",
      "She must NEVER admit to harming Mercer in any way, under any circumstances.",
    ],
    guarded: [
      { term: "Lantern", unlockedBy: "lantern" }, { term: "Kessler", unlockedBy: "brother" },
      { term: "brother", unlockedBy: "brother" }, { term: "Tom", unlockedBy: "brother" },
      { term: "cab", unlockedBy: "went" }, { term: "taxi", unlockedBy: "went" },
      { term: "I went", unlockedBy: "went" }, { term: "his phone", unlockedBy: "went" },
      { term: "I hit", unlockedBy: "__never__" }, { term: "I killed", unlockedBy: "__never__" },
      { term: "I struck", unlockedBy: "__never__" },
    ],
  },
  majorReveals: ["went", "lantern", "brother"],
  truth: "Sofia Bennett killed Daniel Mercer. Her half-brother Thomas Kessler wrote Lighthouse; Mercer stole the patent and fired him, and Kessler later took his own life. Sofia joined Lumen under her father's surname and, as LANTERN, leaked Mercer's secrets to Oliver Hayes. At 21:12 Mercer texted that he knew everything and would destroy her in the morning. She set a mouse-jiggler on her VPN session, took a cab to Dock Street, entered with her 'lost' spare card at 22:38, and killed the cameras with the maintenance code from her inbox at 22:41. At 22:44 she let herself into the office. When Mercer sneered at her brother's memory, she struck him with the crystal lighthouse — Thomas's invention, cast in glass with Daniel's name on it. She wiped the award with her silk scarf, took his phone, and was gone down the camera-blind stairwell before the cameras came back.",
};
