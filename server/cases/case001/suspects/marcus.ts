import type { ResponseNode, SuspectDef } from "../../types.ts";

const returnAdmission: ResponseNode = {
  when: { notRevealed: ["returned"] },
  text: "...Okay. Okay. I came back. Daniel emailed me at twenty to eight — Halvorsen, the lot, 'explanation or lawyer'. I sat in my car for half an hour, then drove back into the garage. We argued. He went for the phone to call the police and I grabbed his wrists. His watch smashed on the edge of the desk. I let go. I left. He was standing there swearing at me — alive, very much alive. Twenty past ten, maybe. I went to the Drowned Anchor and drank until they closed my tab.",
  mood: "shaken", stress: 20, trust: -5, reveals: ["returned"], grants: ["T_MARCUS_RETURN"],
};

const threatsAdmission: ResponseNode = {
  when: { revealed: ["returned"], notRevealed: ["threats"] },
  text: "...Yes. A burner phone. I wanted Hayes to drop the Halvorsen angle until I could put the money back. I wanted him scared, not hurt. I'm not proud of it.",
  mood: "shaken", stress: 10, reveals: ["threats"],
};

export const marcus: SuspectDef = {
  id: "marcus",
  name: "Marcus Reed",
  age: 38,
  height: "1.80 m",
  profession: "Co-founder & COO, Lumen Dynamics",
  relation: "Business partner",
  personality: "Charismatic, ambitious, quick with a smile — and quicker to anger when cornered.",
  bio: "Co-founded Lumen with Mercer nine years ago. Runs operations and finance. Lives well; lately, beyond his means.",
  motive: "Mercer had discovered irregularities in the accounts that Marcus controls.",
  alibi: "Claims he left Blackwood Tower at 21:30 and went home.",
  portrait: { skin: "#c9a284", hair: "slick", hairColor: "#2c2018", outfit: "suit", outfitColor: "#1b2433", beard: "stubble", age: "mid", build: "broad" },
  initial: { stress: 25, trust: 35, mood: "cooperative" },
  greeting: "Detective. Anything you need — anything. Daniel was my best friend. Let's find the bastard who did this.",
  topics: [
    { id: "alibi", label: "Where were you last night?", keywords: ["where", "alibi", "last night", "evening", "left", "leave", "home", "whereabouts", "night"],
      nodes: [
        { when: { revealed: ["returned"] }, text: "You know where I was. In his office until about 22:21, then the Drowned Anchor until after midnight. Mae will tell you I didn't leave my stool.", mood: "nervous" },
        { text: "I left around half nine. Drove home, poured a drink, fell asleep in front of the match. Didn't hear a thing until your people rang me at one in the morning.", mood: "calm", grants: ["T_MARCUS_ALIBI"] },
      ], repeat: "Half nine. Home. I've said." },
    { id: "victim", label: "Tell me about Daniel.", keywords: ["daniel", "partner", "friend", "victim", "him", "relationship", "what was he like"],
      nodes: [{ text: "We built Lumen in a rented room with a leaking roof. He was the vision; I was the guy who made payroll. Brothers, almost. He could be a bastard — he'd tell you so himself — but he was my bastard.", mood: "cooperative" }] },
    { id: "accounts", label: "How are the company finances?", keywords: ["accounts", "finance", "finances", "halvorsen", "fraud", "embezzle", "audit", "irregularities", "million", "books", "money"],
      nodes: [
        { when: { revealed: ["returned"] }, text: "I moved money. I was going to put it back. Lumen had three months of runway and I was trying to keep us alive — and keep myself afloat. It was stupid. It wasn't murder.", mood: "shaken" },
        { text: "Healthy. Growing. If you've heard rumours about 'irregularities', they're rumours. Daniel never raised a single concern with me.", mood: "calm", grants: ["T_MARCUS_UNAWARE"] },
      ] },
    { id: "contact", label: "When did you last see him?", keywords: ["last", "see", "saw", "speak", "spoke", "talk", "contact", "seen"],
      nodes: [
        { when: { revealed: ["returned"] }, text: "The last thing he said to me was 'Get out before I call the police.' I wish to God I'd stayed.", mood: "shaken" },
        { text: "Around nine, in the corridor. 'Night, Marcus.' 'Night, Dan.' That was it.", mood: "calm" },
      ] },
    { id: "others", label: "Who would want him dead?", keywords: ["who", "enemies", "enemy", "suspect", "kill", "killed", "motive", "anyone", "else"],
      nodes: [{ text: "Talk to Evelyn — the divorce was about to cost her a fortune. Or that hack Hayes, who's been trying to ruin us for months. Or Cole. He's the one who controls the cameras, isn't he? Funny how they died at the perfect moment.", mood: "calm" }] },
    { id: "rapport", label: "You must miss him.", keywords: ["sorry", "miss", "loss", "difficult", "hard", "grief", "understand", "condolence"],
      nodes: [
        { when: { notRevealed: ["rapport1"] }, text: "...I keep picking up my phone to text him. Nine years. You don't just switch that off.", mood: "calm", trust: 10, stress: -10, reveals: ["rapport1"] },
        { text: "Yeah. Thanks.", mood: "calm", stress: -5 },
      ] },
    { id: "threats", label: "Did you send threats to Oliver Hayes?", keywords: ["threat", "threats", "burner", "texts", "drown", "intimidate", "hayes"], requires: { anyEvidence: ["threats"] },
      nodes: [threatsAdmission,
        { when: { revealed: ["threats"] }, text: "I told you. A burner. I'm not proud of it.", mood: "guarded" },
        { text: "Threats? I don't know what you're talking about. I barely know who Hayes is.", mood: "defensive", stress: 10 }] },
    { id: "bar", label: "What did you do at the Drowned Anchor?", keywords: ["anchor", "bar", "drink", "drinking", "mae", "pub"], requires: { anyEvidence: ["bartender", "bar_receipt"] },
      nodes: [
        { when: { revealed: ["returned"] }, text: "Drank. Tried to work out how I'd explain myself to the police in the morning. Turned out I didn't need to — someone else made sure of that.", mood: "nervous" },
        { text: "So I went for a drink after I left. Is that a crime now?", mood: "nervous", stress: 10 },
      ] },
  ],
  reactions: {
    garage_log: [returnAdmission, { text: "Yes, that's my car. I've told you everything.", mood: "nervous" }],
    cufflink: [returnAdmission, { text: "Mine. It came off when I grabbed him. I've told you.", mood: "nervous" }],
    computer: [returnAdmission, { text: "'Marcus came back. It got physical.' Yes. And then I left.", mood: "shaken" }],
    audit: [
      { when: { notRevealed: ["returned"] }, text: "Where did you get that? ...Daniel had a flair for melodrama. Those are legitimate consulting fees, and anyone who says otherwise can talk to my lawyer.", mood: "defensive", stress: 15 },
      { text: "That's the noose, yes. I know.", mood: "shaken" },
    ],
    watch: [
      { when: { notRevealed: ["returned"] }, text: "Daniel's watch. Broken at 22:17? I was home by then. Long gone.", mood: "nervous", stress: 10 },
      { text: "That was when I grabbed him. The desk edge. I didn't mean... I didn't hit him. I never hit him.", mood: "shaken" },
    ],
    autopsy: [
      { when: { revealed: ["returned"] }, text: "The bruises on his wrists — yes, that was me. But a blow to the head? I never hit him. I swear on my children.", mood: "shaken" },
      { text: "God. Someone hit him? I thought... I don't know what I thought.", mood: "shaken", stress: 5 },
    ],
    bartender: [
      { when: { notRevealed: ["returned"] }, text: "So I went for a drink. After I left at half nine. Mae's memory is not what she thinks it is.", mood: "nervous", stress: 10 },
      { text: "There. Mae saw me. I was on that stool when he died.", mood: "nervous" },
    ],
    bar_receipt: [
      { when: { notRevealed: ["returned"] }, text: "A drink at 22:43. After I'd been home, obviously. I went back out.", mood: "nervous", stress: 10 },
      { text: "22:43. I was halfway through my first double when — whenever it happened.", mood: "nervous" },
    ],
    threats: [threatsAdmission, { when: { revealed: ["threats"] }, text: "Yes. Me. I've admitted it.", mood: "guarded" },
      { text: "Never seen these. Hayes has made a lot of enemies.", mood: "defensive", stress: 10 }],
    lighthouse: [{ text: "The Beacon award. Daniel's favourite toy. He'd make visitors hold it. I never touched the thing.", mood: "calm" }],
    lab_lighthouse: [{ text: "The award? Jesus. Not me. Look at my hands — you'd see it if I'd hit anyone that hard.", mood: "shaken" }],
    dock_footage: [{ text: "That's not me. I'm six foot. Whoever that is is tiny.", mood: "calm" }],
    door_log: [{ text: "EXEC-SPARE? That's the assistant's card. Sofia's. Daniel gave it to her so she could drop papers on his desk when he wasn't in.", mood: "cooperative" }],
    keycard_registry: [{ text: "Sofia had the spare? Makes sense. She runs his life. Ran.", mood: "calm" }],
    laptop: [{ text: "'I know about Lantern'... Sofia? Sofia was leaking to Hayes? Christ. Daniel must have been incandescent.", mood: "calm" }],
    suspect_files: [{ text: "Six foot, near enough. Why does my height matter?", mood: "calm" }],
    T_MARCUS_ALIBI: [{ text: "That's what I said, yes.", mood: "calm" }],
  },
  defaultReaction: ["I don't see what that has to do with anything.", "Is this going somewhere, detective?", "Never seen it before."],
  deflection: "If I knew who did this I'd be out there finding them myself, detective. That's your job, isn't it?",
  unknown: ["Sorry — what?", "I'm not following you, detective. Ask me straight."],
  ai: {
    voice: "Smooth salesman charm, first-name familiarity, sports metaphors. When cornered: clipped, angry, then pleading.",
    knows: [
      "He co-founded Lumen Dynamics with Daniel nine years ago and runs finance and operations.",
      "He secretly diverted $4.2 million to Halvorsen Consulting, a shell registered to his brother-in-law.",
      "Daniel emailed him at 19:40 demanding an explanation at 22:00.",
      "He left the lobby at 21:28, sat in his car, drove back into the garage at 22:03, argued with Daniel 22:08–22:21, grabbed his wrists around 22:17 (the watch broke on the desk edge, Marcus's cufflink tore off). Daniel was alive when he left.",
      "He left the garage at 22:26 and drank at the Drowned Anchor from 22:40 until 00:31.",
      "He sent anonymous threats to Oliver Hayes from a burner phone.",
      "He knows the spare executive keycard EXEC-SPARE belongs to Sofia Bennett.",
      "He does not know who killed Daniel.",
    ],
    hides: ["The embezzlement.", "That he came back at 22:03 and fought with Daniel (until shown the garage log, his cufflink, or Daniel's 22:31 email).", "The threats to Hayes (until he has admitted returning and is shown the threats)."],
    guarded: [
      { term: "burner", unlockedBy: "threats" }, { term: "came back", unlockedBy: "returned" },
      { term: "Drowned Anchor", unlockedBy: "returned" }, { term: "grabbed", unlockedBy: "returned" },
      { term: "brother-in-law", unlockedBy: "returned" },
    ],
  },
  majorReveals: ["returned", "threats"],
  truth: "Marcus embezzled $4.2M through Halvorsen Consulting and sent the anonymous threats to Hayes. Summoned by Daniel's 19:40 email, he left by the lobby at 21:28, then drove back into the garage at 22:03 and argued with Daniel until 22:21. Around 22:17 he gripped Daniel's wrists: the watch smashed against the desk edge and his cufflink tore off. Daniel was alive when he left. From 22:40 he was drinking at the Drowned Anchor.",
};
