/**
 * CASE 001: THE LAST LIGHT
 *
 * ⚠ SPOILERS. This module is the canonical, fixed truth of the case. It is
 * loaded only by the server and is never sent to the browser.
 *
 * Summary of the truth: Sofia Bennett killed Daniel Mercer at about 22:48 with
 * the crystal lighthouse award, after Mercer discovered she was the leaker
 * "LANTERN" and the sister of Thomas Kessler, whose invention he had stolen.
 * The broken watch (22:17) was caused earlier by Marcus Reed; the whiskey
 * sedative was Mercer's own prescription; Adrian Cole's lies hide a gambling
 * debt; Evelyn's hide divorce fraud; Oliver's hide a lobby visit and his source.
 */
import type { CaseDef } from "../types.ts";
import { evidence } from "./evidence.ts";
import { locations } from "./locations.ts";
import { deductions } from "./deductions.ts";
import { evelyn } from "./suspects/evelyn.ts";
import { marcus } from "./suspects/marcus.ts";
import { sofia } from "./suspects/sofia.ts";
import { adrian } from "./suspects/adrian.ts";
import { oliver } from "./suspects/oliver.ts";

export const case001: CaseDef = {
  id: "case-001",
  title: "The Last Light",
  subtitle: "Case 001",
  setting: "Blackwood City",
  date: "14 November 2026",
  difficulty: "Intermediate",
  synopsis: "Tech magnate Daniel Mercer is found dead in his locked office at the top of Blackwood Tower. The cameras went dark for eleven minutes. Five people had reasons to want him dead.",
  briefing: [
    "Blackwood City. 14 November 2026. Rain for the ninth night running.",
    "At 23:40 a night cleaner on the 42nd floor of Blackwood Tower found the door to Daniel Mercer's private office locked, the lights on, and no answer. Security opened it. Mercer, 46, founder of Lumen Dynamics, was lying dead beside his desk.",
    "There are signs of a struggle. His wristwatch is broken. A glass of whiskey stands on the desk. And the Tower's internal cameras stopped recording for eleven minutes.",
    "Five people had reasons to want him dead. Sergeant Iris Kane has the files at the precinct. The scene is yours, Detective.",
  ],
  victim: { name: "Daniel Mercer", age: 46, description: "Founder and CEO of Lumen Dynamics, maker of the 'Lighthouse' security AI. Brilliant, ruthless and very rich." },
  startLocations: ["office", "police"],
  locations,
  evidence,
  suspects: [evelyn, marcus, sofia, adrian, oliver],
  deductions,
  accusation: {
    motives: [
      { id: "m_divorce", label: "Money: to avoid losing a fortune in the divorce settlement" },
      { id: "m_fraud", label: "Self-preservation: to stop the victim exposing embezzlement" },
      { id: "m_revenge", label: "Revenge and exposure: the victim had uncovered the killer's hidden identity and leaking, and threatened to destroy them" },
      { id: "m_debt", label: "Desperation: gambling debts and a bribe to look the other way" },
      { id: "m_story", label: "Protection: to save a story and its source from a ruinous lawsuit" },
    ],
    methods: [
      { id: "x_poison", label: "Poisoned his whiskey with a sedative overdose" },
      { id: "x_lighthouse", label: "Struck him on the head with the crystal lighthouse award" },
      { id: "x_strangled", label: "Strangled him during the struggle at the desk" },
      { id: "x_fall", label: "Shoved him so he struck his head on the desk edge" },
    ],
    sequences: [
      { id: "s_one", label: "A single visitor argued with the victim, killed him at 22:17 when the watch broke, then locked the office behind them." },
      { id: "s_poison", label: "The victim was drugged through his whiskey and died slowly; the cameras were disabled to hide the poisoner's departure." },
      { id: "s_two", label: "An earlier visitor fought with the victim and left him alive. Later, during the camera blackout, a second visitor entered with a keycard and killed him." },
      { id: "s_console", label: "Someone with control of the security console disabled the cameras, went up to the office and killed him, then returned to the desk." },
      { id: "s_hidden", label: "The killer was hiding inside the office before the victim arrived and attacked him while he worked." },
    ],
  },
  solution: {
    culprit: "sofia",
    motive: "m_revenge",
    method: "x_lighthouse",
    sequence: "s_two",
    support: {
      opportunity: ["door_log", "keycard_registry", "dock_footage", "bootprint", "vpn_log", "taxi", "spare_card", "boots", "jiggler", "T_SOFIA_CARD", "T_SOFIA_ALIBI", "T_SOFIA_FOUND", "computer", "victim_phone", "vigil_binder", "T_ADRIAN_CODE", "camera_log", "suspect_files", "phone_records"],
      means: ["lab_lighthouse", "lighthouse", "autopsy"],
      motive: ["laptop", "dossier", "patent", "brother_photo", "T_OLIVER_LANTERN", "expose", "reporter_notebook"],
    },
    scenes: [
      { heading: "The Last Light", text: "Three years before Daniel Mercer died, a young engineer named Thomas Kessler wrote the algorithm that would make Lumen Dynamics famous. Mercer put his own name on the patent, fired Kessler when he objected, and cast the moment in crystal: a lighthouse award engraved THE LIGHT THAT LEADS. In 2024 Thomas Kessler took his own life." },
      { heading: "Lantern", text: "Four months later his half-sister, Sofia Bennett, took a job as Mercer's assistant under her father's surname. For almost two years she organised his life — and, under the codename LANTERN, fed journalist Oliver Hayes the evidence of his fraud and his theft." },
      { heading: "He Knows", time: "21:12", text: "On 13 November Mercer's private investigator delivered the truth. The next evening, Mercer texted her: 'I know about Lantern. I know who your brother was.' He would go to the police at nine. At 21:20 she warned Hayes: 'He knows. I'll fix it.'" },
      { heading: "The First Visitor", time: "22:08", text: "But Mercer had another appointment first. Marcus Reed, summoned over $4.2 million stolen through Halvorsen Consulting, returned by the garage. Around 22:17 he seized Mercer's wrists; the watch shattered on the desk edge and Reed's cufflink tore loose. At 22:21 he left Mercer alive and furious — and the watch frozen at a time that would mislead everyone." },
      { heading: "A Manufactured Alibi", time: "22:19", text: "In Carver Street, Sofia plugged a mouse-jiggler into her work computer to keep her VPN session 'active' and booked a cab to Dock Street. Behind the Tower, at 22:38, she let herself in with the spare keycard she would later claim to have lost." },
      { heading: "Eleven Minutes", time: "22:41", text: "At the security desk, nobody was watching: Adrian Cole had slipped out to pay a bookie at the Drowned Anchor. From her phone, Sofia used the Vigil maintenance code emailed to her own inbox and switched the internal cameras off. She already intended not to be seen." },
      { heading: "The Light That Leads", time: "22:44", text: "Mercer was still at his keyboard at 22:43. At 22:44 her card opened his door. He did not plead; he sneered. He called her brother a mediocrity who 'couldn't handle losing'. She took the crystal lighthouse — Thomas's work, with Daniel's name on it — from the shelf and struck him once on the left temple." },
      { heading: "The Locked Room", time: "22:51", text: "She wiped the award with her silk scarf and set it back, a few centimetres from its outline in the dust. She took his phone, because it held their messages, and switched it off. She pulled the door shut — it locked itself — and took service stairwell B, whose cameras end at the 40th floor. She was on Dock Street at 22:57, a small hooded figure in the rain." },
      { heading: "The Truth Comes Out", text: "Every other suspect lied that night: Evelyn to hide an offshore account, Marcus to hide his theft and his fight, Adrian to hide his debts, Oliver to protect his source. But only one person's lies were built to hide a killing. Sofia Bennett was charged with the murder of Daniel Mercer." },
    ],
    timeline: [
      { time: "18:31", who: "Daniel", event: "Enters office 42-A." },
      { time: "18:55", who: "Evelyn", event: "Arrives at the Grand Meridian gala." },
      { time: "19:40", who: "Daniel", event: "Emails Marcus: Halvorsen meeting at 22:00." },
      { time: "20:15", who: "Sofia", event: "Leaves via the lobby." },
      { time: "20:30", who: "Daniel", event: "Calls Evelyn (4 min) about her Cayman account." },
      { time: "20:52", who: "Oliver", event: "Turned away at the lobby desk." },
      { time: "20:58", who: "Sofia", event: "VPN connects from home." },
      { time: "21:12", who: "Daniel", event: "Texts Sofia: 'I know about Lantern...'" },
      { time: "21:20", who: "Sofia", event: "Messages Hayes as LANTERN: 'He knows. I'll fix it.'" },
      { time: "21:28", who: "Marcus", event: "Leaves via the lobby; waits in his car." },
      { time: "21:34", who: "Oliver", event: "Badges into the Ledger newsroom (until 01:12)." },
      { time: "21:47", who: "Evelyn", event: "Car leaves the Grand Meridian valet." },
      { time: "22:03", who: "Marcus", event: "Drives back into the Tower garage." },
      { time: "22:05", who: "Evelyn", event: "Enters the Harbor Heights penthouse." },
      { time: "22:08", who: "Marcus", event: "Let into the office by Daniel." },
      { time: "22:12", who: "Sofia", event: "Last real keystroke on her VPN session; mouse-jiggler running." },
      { time: "22:17", who: "Marcus", event: "Scuffle: Daniel's watch breaks on the desk; Marcus's cufflink tears off." },
      { time: "22:19", who: "Sofia", event: "Cab pickup at Carver Street." },
      { time: "22:20", who: "Evelyn", event: "Leaves the penthouse with the Cayman file." },
      { time: "22:21", who: "Marcus", event: "Leaves the office; Daniel alive." },
      { time: "22:26", who: "Marcus", event: "Car exits the garage." },
      { time: "22:31", who: "Daniel", event: "Emails his lawyer." },
      { time: "22:31", who: "Adrian", event: "Leaves the security desk for the Drowned Anchor." },
      { time: "22:34", who: "Sofia", event: "Cab drop-off on Dock Street." },
      { time: "22:35", who: "Adrian", event: "Meets bookie Vinnie Sato at the Anchor." },
      { time: "22:36", who: "Sofia", event: "Texts Daniel: 'Don't call anyone. I'm coming up.'" },
      { time: "22:38", who: "Sofia", event: "Enters the service door with EXEC-SPARE." },
      { time: "22:40", who: "Marcus", event: "Arrives at the Drowned Anchor." },
      { time: "22:41", who: "Sofia", event: "Disables internal cameras with code VS-7731 from her phone." },
      { time: "22:41", who: "Evelyn", event: "Car returned to the Grand Meridian valet." },
      { time: "22:43", who: "Daniel", event: "Last keystroke." },
      { time: "22:44", who: "Sofia", event: "Enters the office with EXEC-SPARE." },
      { time: "22:48", who: "Sofia", event: "Strikes Daniel with the crystal lighthouse. Death." },
      { time: "22:51", who: "Sofia", event: "Switches off Daniel's phone; office door closes and locks." },
      { time: "22:52", who: "—", event: "Cameras resume; Sofia is in camera-blind stairwell B." },
      { time: "22:55", who: "Evelyn", event: "Photographed at the auction." },
      { time: "22:57", who: "Sofia", event: "Leaves by the service dock." },
      { time: "22:58", who: "Adrian", event: "Leaves the Anchor." },
      { time: "23:04", who: "Adrian", event: "Returns to the desk; sees outage alert." },
      { time: "23:20", who: "Adrian", event: "Files a false 'technical fault' report." },
      { time: "23:26", who: "Sofia", event: "Home; resumes typing on the VPN." },
      { time: "23:40", who: "Adrian", event: "Opens the office for the cleaner; body found." },
    ],
  },
  hints: [
    { unless: { anyEvidence: ["watch", "computer", "door_lock"] }, text: "Start at the scene, Detective. Mercer's office hasn't been touched since forensics left. Search it properly — the obvious things and the things people tried to hide. Use 'Search closely' when you're in there." },
    { unless: { anyEvidence: ["autopsy"] }, text: "Dr. Voss's autopsy report is on my desk. Read it before you fix on a time of death." },
    { unless: { anyEvidence: ["door_log", "camera_log"] }, text: "That 'locked room' — the access logs and the camera controller are both in the Tower's security office. Go and see what Adrian Cole's systems recorded." },
    { unless: { deductions: ["watch_lied"] }, when: { evidence: ["watch", "computer"] }, text: "That watch says 22:17. Does everything else agree? Pin it next to what you pulled off his computer." },
    { unless: { anyEvidence: ["T_SOFIA_ALIBI", "T_MARCUS_ALIBI", "T_ADRIAN_DESK", "T_OLIVER_NEVER", "T_EVELYN_ALIBI"] }, text: "Get everyone's story on record. Interview the suspects — ask where they were. Every claim they make becomes something you can test." },
    { unless: { anyDeductions: ["locked_room", "spare_card_owner"] }, when: { evidence: ["door_log"] }, text: "Someone used a card called EXEC-SPARE. Find out who it belongs to — the registry is in the security office." },
    { unless: { anyEvidence: ["effects"] }, text: "His personal effects are in the evidence box here. His keys will get you into his penthouse." },
    { unless: { anyDeductions: ["marcus_returned", "marcus_cleared"] }, when: { evidence: ["garage_log"] }, text: "Plate recognition puts Reed's car back in the garage after he says he went home. Put that to him — or to his statement on the board." },
    { unless: { deductions: ["small_visitor"] }, when: { evidence: ["dock_footage"] }, text: "Our hooded friend at the service dock walked past painted height markers. Compare that against the heights in my suspect files." },
    { unless: { anyEvidence: ["laptop"] }, when: { anyEvidence: ["effects"] }, text: "His penthouse may tell you what his phone would have — if the killer hadn't taken it." },
    { unless: { anyEvidence: ["vpn_log"] }, when: { evidence: ["T_SOFIA_ALIBI"] }, text: "Bennett says IT can vouch for her. I've asked Lumen for the logs — they'll be on my desk." },
    { unless: { anyDeductions: ["daniel_knew", "lantern_identity"] }, when: { anyEvidence: ["laptop"] }, text: "'Lantern'. 'Your brother'. Mercer knew something about Sofia Bennett. Find out what — and who Lantern was talking to." },
    { when: { anyDeductions: ["spare_card_owner"] }, unless: { anyEvidence: ["spare_card", "boots"] }, text: "If you can show a suspect's own property was at the scene and their story about the night falls apart, I can get a judge to sign a search warrant." },
    { unless: { anyEvidence: ["bartender"] }, when: { anyEvidence: ["lobby_footage", "garage_log"] }, text: "Two of our people disappeared from the Tower around the same time. The Drowned Anchor's two minutes from the service dock — Mae Okafor sees everything." },
    { text: "You've got a lot on that board, Detective. When you're sure — who, why, how, and in what order — head to the accusation room. You'll need at least three pieces of evidence that stand up. Get it wrong and the DA will send you back; get it wrong three times and the case is closed." },
  ],
};
