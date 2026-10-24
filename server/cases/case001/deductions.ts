import type { DeductionDef } from "../types.ts";

/**
 * Valid deductions for CASE 001. Each is recognised when the player links any
 * one of its `pairs` on the evidence board (order-independent). 34 deductions,
 * 12 of which expose contradictions.
 */
export const deductions: DeductionDef[] = [
  // ── Time of death and the scene ──
  { id: "watch_lied", pairs: [["watch", "computer"], ["watch", "autopsy"]], contradiction: true,
    title: "The Watch Lied",
    text: "The watch stopped at 22:17, yet Mercer emailed his lawyer at 22:31 and typed until 22:43. The watch broke earlier in the evening — it does not mark the moment of death." },
  { id: "earlier_struggle", pairs: [["watch", "cufflink"], ["cufflink", "autopsy"], ["watch", "T_MARCUS_RETURN"]],
    title: "The 22:17 Scuffle",
    text: "A torn 'M.R.' cufflink, a watch smashed against the desk, and wrist bruises 20–40 minutes older than the fatal blow: Mercer fought with someone around 22:17 — and survived it." },
  { id: "weapon", pairs: [["autopsy", "lab_lighthouse"], ["autopsy", "lighthouse"]],
    title: "The Murder Weapon",
    text: "Lead-crystal fragments in the wound and Mercer's blood in its base seam: he was killed with a single blow from the crystal lighthouse, which was then wiped and returned to the shelf." },
  { id: "not_poison", pairs: [["whiskey", "pills"], ["whiskey", "autopsy"]],
    title: "Not Poison",
    text: "The residue in the glass is Mercer's own zolpidem — he habitually took one with his late-night scotch. The autopsy shows a normal dose. The whiskey is a red herring." },
  { id: "locked_room", pairs: [["door_lock", "door_log"]],
    title: "The Locked Room",
    text: "There was no locked-room trick. The suite auto-locks on closing: the killer entered with card EXEC-SPARE at 22:44 and simply pulled the door shut behind them at 22:51." },
  { id: "alive_at_entry", clears: ["marcus"], pairs: [["computer", "door_log"]],
    title: "Alive When the Door Opened",
    text: "Mercer touched his keyboard at 22:43:50. Card EXEC-SPARE opened his door at 22:44, and no one else entered before the body was found. Whoever held that card met him alive." },
  { id: "phone_taken", pairs: [["charger", "phone_records"], ["charger", "effects"]],
    title: "The Killer Took His Phone",
    text: "The phone wasn't on the body or in the office, but it was switched off inside the Tower at 22:51 — the minute the office door locked. The killer took it, most likely because of what was on it." },

  // ── The blackout ──
  { id: "not_fault", pairs: [["camera_log", "incident_report"], ["camera_log", "T_ADRIAN_DESK"]], contradiction: true,
    title: "Not a Technical Fault",
    text: "Cole's report blames a firmware fault, but the controller logged a deliberate remote maintenance override using code VS-7731. The blackout was switched on by someone." },
  { id: "override_source", clears: ["adrian"], implicates: ["sofia"], pairs: [["vigil_binder", "camera_log"], ["T_ADRIAN_CODE", "camera_log"]],
    title: "The Override Code's Trail",
    text: "Override code VS-7731 was emailed only to Lumen's scheduling contact, Sofia Bennett, and used from a mobile device. Cole never had it." },
  { id: "empty_desk", pairs: [["lobby_footage", "T_ADRIAN_DESK"], ["lobby_footage", "incident_report"]], contradiction: true,
    title: "The Empty Security Desk",
    text: "Cole swears he never left his desk, but the lobby camera shows it empty from 22:31 to 23:04 — the entire blackout." },
  { id: "adrian_cleared", clears: ["adrian"], pairs: [["bartender", "camera_log"], ["T_ADRIAN_ANCHOR", "camera_log"], ["napkin", "lobby_footage"]],
    title: "Where Cole Really Was",
    text: "During the blackout Cole was in the Drowned Anchor's back booth paying a bookie — a witnessed, if shameful, alibi. He lied to hide his debts, not a murder." },

  // ── Marcus Reed ──
  { id: "marcus_returned", pairs: [["garage_log", "T_MARCUS_ALIBI"], ["cufflink", "T_MARCUS_ALIBI"]], contradiction: true,
    title: "Marcus Came Back",
    text: "Marcus says he left at 21:30 and went home. His car re-entered the Tower garage at 22:03 and left at 22:26." },
  { id: "marcus_knew", pairs: [["audit", "T_MARCUS_UNAWARE"]], contradiction: true,
    title: "Marcus Was Warned",
    text: "Marcus claims Mercer suspected nothing. Mercer's own notes say he emailed Marcus at 19:40 demanding an explanation for $4.2 million paid to Halvorsen." },
  { id: "marcus_cleared", clears: ["marcus"], pairs: [["garage_log", "bar_receipt"], ["garage_log", "bartender"]],
    title: "Marcus's Alibi for the Blackout",
    text: "Marcus drove out of the garage at 22:26 and paid for a Scotch at the Drowned Anchor at 22:43. He was on a bar stool when card EXEC-SPARE opened the office at 22:44." },
  { id: "threats_source", pairs: [["threats", "audit"]],
    title: "Who Sent the Threats",
    text: "The anonymous texts to Hayes are fixated on Halvorsen — the shell company only Marcus Reed needed buried. Ugly, but it points to fraud, not to the killing." },

  // ── Evelyn Mercer ──
  { id: "evelyn_left", pairs: [["doorman_log", "T_EVELYN_ALIBI"]], contradiction: true,
    title: "Evelyn Left the Gala",
    text: "Evelyn says she was at the gala all night, but the Harbor Heights concierge logged her at the penthouse from 22:05 to 22:20." },
  { id: "cayman", pairs: [["safe", "doorman_log"], ["safe", "phone_records"]],
    title: "What Evelyn Took",
    text: "After Daniel's 20:30 call, Evelyn let herself into the penthouse and emptied the 'E.M. — Cayman' folder from the safe: hidden divorce assets, not a murder weapon." },
  { id: "evelyn_cleared", clears: ["evelyn"], pairs: [["valet", "doorman_log"], ["valet", "camera_log"]],
    title: "Evelyn Couldn't Reach the Tower",
    text: "Evelyn left the penthouse at 22:20 and her car was back with the Grand Meridian valet at 22:41, 25 minutes from the Tower. She was photographed at the auction at 22:55." },

  // ── Oliver Hayes ──
  { id: "oliver_at_tower", pairs: [["visitor_log", "T_OLIVER_NEVER"], ["lobby_footage", "T_OLIVER_NEVER"]], contradiction: true,
    title: "Oliver Was There",
    text: "Hayes says he never entered the Tower. He signed the lobby visitor book at 20:50 and was turned away at 20:52." },
  { id: "oliver_cleared", clears: ["oliver"], pairs: [["newsroom_log", "camera_log"], ["expose", "camera_log"]],
    title: "Oliver's Alibi",
    text: "Hayes badged into the newsroom at 21:34 and edited his story from his desk at 22:40 and 22:47 — in the middle of the blackout, across the city." },

  // ── The hooded visitor ──
  { id: "same_visitor", pairs: [["dock_footage", "bootprint"]],
    title: "A Visitor from the Rain",
    text: "A hooded figure came in from Dock Street at 22:38, and a rain-wet print of a small heeled boot sits just inside the office door. The killer walked in from the street, not from inside the building." },
  { id: "small_visitor", clears: ["marcus", "oliver", "adrian", "evelyn"], implicates: ["sofia"], pairs: [["dock_footage", "suspect_files"]],
    title: "The Hooded Visitor's Height",
    text: "The figure measures about 1.65 m in heels (±3 cm). Marcus (1.80), Oliver (1.83) and Adrian (1.88) are far too tall; Evelyn (1.72) is outside the margin. Only Sofia Bennett (1.64) fits." },
  { id: "spare_card_owner", implicates: ["sofia"], pairs: [["door_log", "keycard_registry"], ["spare_card", "door_log"]],
    title: "The Spare Card's Owner",
    text: "EXEC-SPARE — the card used at the service door at 22:38 and the office at 22:44 — was issued to Sofia Bennett, and was never reported lost." },
  { id: "lost_card_lie", implicates: ["sofia"], pairs: [["T_SOFIA_CARD", "door_log"], ["T_SOFIA_CARD", "keycard_registry"], ["T_SOFIA_CARD", "spare_card"]], contradiction: true,
    title: "The 'Lost' Card",
    text: "Sofia claims she lost the spare card weeks ago, yet it was never reported lost and it opened two doors in the Tower that night." },

  // ── Sofia's alibi ──
  { id: "idle_connection", implicates: ["sofia"], pairs: [["vpn_log", "T_SOFIA_ALIBI"]], contradiction: true,
    title: "An Idle Connection",
    text: "Sofia offered her VPN session as an alibi, but there was no typing or clicking from 22:12 to 23:26 — only automated cursor nudges." },
  { id: "cab_ride", implicates: ["sofia"], pairs: [["taxi", "T_SOFIA_ALIBI"], ["taxi", "vpn_log"]], contradiction: true,
    title: "Sofia Went Out",
    text: "While her VPN session sat idle, a cab booked and paid for by Sofia carried her from Carver Street to the back of Blackwood Tower, arriving 22:34 — four minutes before EXEC-SPARE opened the service door." },
  { id: "jiggler_alibi", pairs: [["jiggler", "vpn_log"]],
    title: "A Manufactured Alibi",
    text: "A mouse-jiggler plugged into her work computer explains the idle-but-alive VPN session. Sofia built her alibi before she left home." },
  { id: "contact_lie", implicates: ["sofia"], pairs: [["phone_records", "T_SOFIA_NOCONTACT"], ["laptop", "T_SOFIA_NOCONTACT"]], contradiction: true,
    title: "Sofia Was in Contact",
    text: "Sofia says she had no contact with Mercer after 20:15. He texted her at 21:12 and she replied at 22:36." },
  { id: "found_dead_lie", implicates: ["sofia"], pairs: [["T_SOFIA_FOUND", "computer"], ["T_SOFIA_FOUND", "camera_log"]], contradiction: true,
    title: "She Didn't Find Him Dead",
    text: "Sofia claims Mercer was already dead when she arrived. But he typed at 22:43, she entered at 22:44 — and the cameras had been switched off with her code at 22:41, before she could have known anything was wrong." },

  // ── Motive ──
  { id: "daniel_knew", implicates: ["sofia"], pairs: [["laptop", "dossier"]],
    title: "Mercer Uncovered Her Secret",
    text: "Mercer's investigator told him Sofia was Thomas Kessler's sister and was leaking company files. At 21:12 he threatened to go to the police and end her career." },
  { id: "lantern_identity", pairs: [["laptop", "expose"], ["T_OLIVER_LANTERN", "laptop"], ["dossier", "expose"], ["T_OLIVER_LANTERN", "dossier"]],
    title: "Sofia Is LANTERN",
    text: "Hayes's insider source 'LANTERN' — someone with the CEO's calendar and correspondence — is Sofia Bennett. Mercer's 21:12 text names Lantern to her face." },
  { id: "stolen_legacy", pairs: [["patent", "dossier"], ["patent", "brother_photo"], ["reporter_notebook", "patent"]],
    title: "A Brother's Stolen Legacy",
    text: "Thomas Kessler invented Lighthouse; Mercer erased his name from the patent and fired him. Kessler died the following year. His sister took a job at Mercer's side." },

  // ── Confirmation from the warrant ──
  { id: "phone_found", implicates: ["sofia"], pairs: [["victim_phone", "charger"], ["victim_phone", "phone_records"]],
    title: "The Missing Phone",
    text: "Mercer's phone — switched off in the Tower at 22:51 — was hidden in Sofia Bennett's kitchen drawer." },
  { id: "boot_match", implicates: ["sofia"], pairs: [["boots", "bootprint"]],
    title: "The Boot Print Match",
    text: "Sofia's EU 37 boots match the rain-wet print inside Mercer's door, down to the nick in the left heel." },
];
