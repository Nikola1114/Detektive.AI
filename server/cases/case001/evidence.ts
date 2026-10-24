import type { EvidenceDef } from "../types.ts";

/**
 * CASE 001 evidence: 43 items found at locations, plus 16 statements and
 * documents that suspects hand over during interrogations.
 */
export const evidence: EvidenceDef[] = [
  // ───────────── Mercer's office (crime scene) ─────────────
  {
    id: "watch", title: "Broken Wristwatch", type: "physical", importance: "key", icon: "watch", source: "Mercer's Office",
    summary: "Mercer's silver watch, glass shattered, hands frozen at 22:17.",
    detail: "A silver Vacheron wristwatch lies beneath the desk. The crystal is cracked in a starburst and the hands are frozen at 22:17. The clasp is bent outward, as if it was wrenched against something hard. A matching scuff mark marks the steel edge of the desk.",
    timeline: [{ time: "22:17", text: "Mercer's wristwatch stops after a hard impact against the desk edge." }],
  },
  {
    id: "whiskey", title: "Whiskey Glass", type: "physical", importance: "supporting", icon: "glass", source: "Mercer's Office",
    summary: "A single half-finished glass of single malt with a faint chalky residue.",
    detail: "A heavy crystal tumbler, half full of single malt. A thin chalky film clings to the bottom. Only one glass has been used; the decanter on the bar cart is nearly full. The forensic team flagged the residue as a possible sedative.",
  },
  {
    id: "lighthouse", title: "Crystal Lighthouse Award", type: "physical", importance: "key", icon: "trophy", source: "Mercer's Office",
    summary: "A heavy crystal award sitting a few centimetres off its own dust outline. The base is suspiciously clean.",
    detail: "The 'Beacon of Innovation' award, a 2.4 kg crystal lighthouse engraved DANIEL MERCER — THE LIGHT THAT LEADS. Every other object on the shelf wears a fine layer of dust; this one has been wiped spotless and set back down about four centimetres from the clean outline where it used to stand. Under magnification there is a rust-brown trace in the seam where the crystal meets its steel base.",
  },
  {
    id: "cufflink", title: "Torn Cufflink", type: "physical", importance: "key", icon: "cufflink", source: "Mercer's Office",
    summary: "A silver cufflink engraved 'M.R.', its post snapped, under the desk.",
    detail: "A silver oval cufflink engraved with the initials M.R. The post has snapped clean off, the way it would if a sleeve were yanked hard. Daniel Mercer wore buttoned cuffs; this is not his.",
  },
  {
    id: "bootprint", title: "Rain-Wet Boot Print", type: "forensic", importance: "key", icon: "footprint", source: "Mercer's Office",
    summary: "A partial print of a small heeled ankle boot, left in rainwater just inside the door.",
    detail: "A partial print preserved in a dried film of rainwater and street grit just inside the office door. Forensics photographed it under oblique light: a women's heeled ankle boot, EU size 37, with a chevron sole pattern. The grit is consistent with the street outside — whoever left it walked in from the rain, not from inside the building.",
  },
  {
    id: "door_lock", title: "Auto-Locking Office Door", type: "physical", importance: "supporting", icon: "keypad", source: "Mercer's Office",
    summary: "The office door locks itself whenever it swings shut. Entries are logged by keycard.",
    detail: "A steel-core door with an electronic keycard reader. A plate reads: SECURE SUITE — AUTO-LOCK ON CLOSE. The door cannot be left unlocked; anyone leaving simply pulls it shut and the suite seals itself. Every card swipe is recorded on the building access server in the Security Office.",
  },
  {
    id: "computer", title: "Mercer's Computer", type: "digital", importance: "key", icon: "monitor", source: "Mercer's Office",
    summary: "His last email went out at 22:31. The keyboard was last touched at 22:43.",
    detail: "The mail client shows an email sent at 22:31 to his lawyer, Ruth Abernathy:\n\n\"Ruth — Marcus came back tonight. It got physical; he broke my watch and nearly my wrist. Call me at 8. We go to the police about Halvorsen first thing. And I've found our leak — someone very close to me. I'm dealing with that tonight too. — D.\"\n\nThe system activity log records the last keyboard input at 22:43:50. After that, nothing.",
    timeline: [
      { time: "22:31", text: "Mercer emails his lawyer: Marcus came back, it got physical; he will deal with 'the leak' tonight." },
      { time: "22:43", text: "Last keyboard input on Mercer's computer." },
    ],
  },
  {
    id: "pills", title: "Prescription Bottle", type: "physical", importance: "minor", icon: "pills", source: "Mercer's Office",
    summary: "Zolpidem 10 mg, prescribed to Daniel Mercer. Dissolvable tablets.",
    detail: "An amber bottle in the top desk drawer: ZOLPIDEM 10 mg, orally dissolving. Patient: Daniel Mercer. Prescriber: Dr. A. Lindqvist. 'Take one at bedtime. Do not combine with alcohol.' Eleven of thirty remain. A sticky note on the lid in Mercer's hand: 'late nights — 1 w/ the scotch'.",
  },
  {
    id: "charger", title: "Empty Phone Charger", type: "physical", importance: "supporting", icon: "cable", source: "Mercer's Office",
    summary: "A charging cable on the desk with nothing plugged in. Mercer's phone is missing.",
    detail: "A braided charging cable runs from the desk dock to nowhere. Mercer's phone was not on the body, in the office, or anywhere on the 42nd floor. Somebody took it.",
  },
  {
    id: "audit", title: "Halvorsen Audit Printout", type: "document", importance: "supporting", icon: "papers", source: "Mercer's Office",
    summary: "Accounts showing $4.2M paid to 'Halvorsen Consulting', annotated in Mercer's hand.",
    detail: "Twelve pages of payment records to Halvorsen Consulting Ltd. totalling $4.2 million over eighteen months. Mercer's annotations in red ink: 'Halvorsen = shell. Registered to M.R.'s brother-in-law.' On the final page: 'Emailed M. 19:40 — 22:00 tonight. Explanation or lawyer.'",
    timeline: [{ time: "19:40", text: "Mercer emails Marcus Reed demanding a 22:00 meeting about the Halvorsen payments." }],
  },

  // ───────────── BCPD Central Precinct ─────────────
  {
    id: "suspect_files", title: "Suspect Dossiers", type: "document", importance: "supporting", icon: "folder", source: "BCPD Central Precinct",
    summary: "Background files with each person of interest's height and basic details.",
    detail: "Sgt. Kane's dossiers on the five persons of interest:\n• Evelyn Mercer — 43 — 1.72 m\n• Marcus Reed — 38 — 1.80 m\n• Sofia Bennett — 29 — 1.64 m\n• Adrian Cole — 51 — 1.88 m\n• Oliver Hayes — 34 — 1.83 m\nAll five have been asked for initial statements.",
  },
  {
    id: "autopsy", title: "Autopsy Report", type: "forensic", importance: "key", icon: "report", source: "BCPD Central Precinct",
    summary: "Blunt force trauma to the left temple. Death between 22:30 and 23:15. Wrist bruises are older.",
    detail: "Medical Examiner Dr. Hanna Voss:\n• Cause of death: a single blunt force blow to the left temple. Embedded in the wound are microscopic fragments of lead crystal.\n• Estimated time of death: between 22:30 and 23:15.\n• Bruising on both wrists consistent with being gripped hard, inflicted roughly 20–40 minutes before death.\n• Blood alcohol 0.06%. Zolpidem present at a normal therapeutic level — a single tablet, not an overdose. Not a factor in death.",
    timeline: [{ time: "22:30", text: "Earliest medically possible time of death (window 22:30–23:15)." }],
  },
  {
    id: "lab_lighthouse", title: "Lab Report: Crystal Lighthouse", type: "forensic", importance: "key", icon: "microscope", source: "BCPD Forensics",
    summary: "Mercer's blood in the award's base seam. Wiped with a silk-blend fabric. No usable prints.",
    detail: "The crystal lighthouse was wiped, but not well enough. The seam between crystal and steel base contains blood matching Daniel Mercer. Chips along the lamp edge match the crystal fragments recovered from the wound. Fibres caught in the seam: silk blend, dark blue. No usable fingerprints — the surface was wiped with fabric.",
  },
  {
    id: "phone_records", title: "Mercer's Phone Records", type: "document", importance: "key", icon: "phone", source: "BCPD Central Precinct",
    summary: "Carrier metadata: a call to Evelyn at 20:30, a text to Sofia at 21:12, a text from Sofia at 22:36.",
    detail: "Subpoenaed carrier metadata for Mercer's mobile (content not included):\n• 20:30 — outgoing call to Evelyn Mercer, 4 min 12 s\n• 21:12 — outgoing text to Sofia Bennett\n• 22:36 — incoming text from Sofia Bennett\n• 22:51 — handset disconnects from the network (powered off). Last cell: Blackwood Tower.",
    timeline: [
      { time: "20:30", text: "Mercer phones Evelyn (4 minutes)." },
      { time: "21:12", text: "Mercer texts Sofia Bennett." },
      { time: "22:36", text: "Sofia Bennett texts Mercer." },
      { time: "22:51", text: "Mercer's phone is powered off inside Blackwood Tower." },
    ],
  },
  {
    id: "effects", title: "Victim's Personal Effects", type: "physical", importance: "supporting", icon: "evidence-bag", source: "BCPD Central Precinct",
    summary: "Wallet, penthouse keys, a fob for Harbor Heights. No phone.",
    detail: "Bagged at the scene: a leather wallet ($340, cards intact — not a robbery), a key ring with the fob for his Harbor Heights penthouse, and a gold pen. Notably absent: his phone. The penthouse fob gives you access to his apartment.",
  },
  {
    id: "vpn_log", title: "Lumen VPN Log", type: "digital", importance: "key", icon: "terminal", source: "BCPD Central Precinct",
    summary: "Sofia's home connection stayed up 20:58–23:31 — but no typing or clicks between 22:12 and 23:26.",
    detail: "Lumen Dynamics IT, session record for user s.bennett:\n• 20:58 — connected from home IP (Carver Street)\n• 22:12 — last keystroke / mouse click\n• 22:12–23:26 — session kept alive by tiny periodic cursor movements, no input\n• 23:26 — keystrokes resume\n• 23:31 — disconnected\nIT note: 'Pattern consistent with an automated mouse-movement device.'",
    timeline: [
      { time: "22:12", text: "Sofia's VPN session: last real keystroke." },
      { time: "23:26", text: "Sofia's VPN session: typing resumes." },
    ],
  },
  {
    id: "taxi", title: "Blackwood Cab Dispatch Record", type: "document", importance: "key", icon: "car", source: "BCPD Central Precinct",
    summary: "A cab booked from Sofia's phone: Carver Street 22:19 → Dock Street (behind the Tower) 22:34.",
    detail: "Sgt. Kane's canvass of cab companies turned up Blackwood Cab booking #44817:\n• Booked from: Sofia Bennett's mobile number\n• Pickup: 19 Carver Street, 22:19\n• Drop-off: Dock Street, rear of Blackwood Tower, 22:34\n• Paid by card ending 0912 (S. Bennett)",
    timeline: [{ time: "22:34", text: "Cab booked by Sofia Bennett drops its passenger behind Blackwood Tower." }],
  },
  {
    id: "patent", title: "Lighthouse Patent Archive", type: "document", importance: "supporting", icon: "scroll", source: "BCPD Central Precinct",
    summary: "The draft patent for Lumen's 'Lighthouse' named Thomas Kessler as inventor. The final filing names only Mercer.",
    detail: "Patent office records for Lumen's flagship 'Lighthouse' security algorithm. The 2023 draft lists sole inventor: Thomas Kessler. The final filing, three months later, lists sole inventor: Daniel Mercer. Kessler was dismissed the same month. A 2024 obituary clipping is attached: Thomas Kessler, 30, 'survived by his mother and his sister'.",
  },

  // ───────────── Security Office ─────────────
  {
    id: "door_log", title: "42nd Floor Access Log", type: "digital", importance: "key", icon: "list",  source: "Security Office",
    summary: "Card EXEC-SPARE opened the service door at 22:38 and the office at 22:44. The door locked at 22:51.",
    detail: "Access server, Blackwood Tower, 14 Nov:\n• 18:31 — Office 42-A — MERCER-01 — entry\n• 22:08 — Office 42-A — opened from inside (exit button)\n• 22:21 — Office 42-A — door closed, locked\n• 22:38 — Service door, Dock Street — EXEC-SPARE — entry\n• 22:44 — Office 42-A — EXEC-SPARE — entry\n• 22:51 — Office 42-A — door closed, locked\n• 23:40 — Office 42-A — MASTER-SEC — entry",
    timeline: [
      { time: "22:08", text: "Office door opened from inside (someone let in)." },
      { time: "22:21", text: "Office door closes and locks." },
      { time: "22:38", text: "Card EXEC-SPARE opens the Dock Street service door." },
      { time: "22:44", text: "Card EXEC-SPARE opens Mercer's office." },
      { time: "22:51", text: "Mercer's office door closes and auto-locks." },
      { time: "23:40", text: "Security master card opens the office. Body discovered." },
    ],
  },
  {
    id: "camera_log", title: "Camera System Log", type: "digital", importance: "key", icon: "cctv", source: "Security Office",
    summary: "Internal cameras disabled 22:41–22:52 by a remote maintenance override using code VS-7731 from a mobile device.",
    detail: "Vigil Systems surveillance controller:\n• 22:41:07 — MAINTENANCE OVERRIDE — remote session (mobile device, cellular IP) — authorisation code VS-7731 — internal cameras floors 2–42 suspended\n• 22:52:13 — override expired — recording resumed\nNo fault codes. No admin console login. The lobby and exterior cameras run on the older legacy system and were unaffected.",
    timeline: [
      { time: "22:41", text: "Internal cameras disabled by remote maintenance override (code VS-7731)." },
      { time: "22:52", text: "Internal cameras resume recording." },
    ],
  },
  {
    id: "incident_report", title: "Adrian Cole's Incident Report", type: "document", importance: "supporting", icon: "clipboard",  source: "Security Office",
    summary: "Filed 23:20: 'Camera outage caused by a technical fault. Officer on desk throughout.'",
    detail: "BLACKWOOD TOWER SECURITY — INCIDENT REPORT\nFiled 23:20 by A. Cole, Head of Security.\n'Between approx. 22:41 and 22:52 the internal camera system suffered a technical fault and stopped recording. Cause believed to be a firmware glitch. Duty officer (A. Cole) present at the security desk throughout. No suspicious activity observed.'",
  },
  {
    id: "lobby_footage", title: "Lobby Camera Footage", type: "digital", importance: "key", icon: "film", source: "Security Office",
    summary: "Legacy lobby camera: Sofia leaves 20:15, Oliver turned away 20:52, Marcus leaves 21:28, and the security desk sits empty 22:31–23:04.",
    detail: "The lobby camera runs on the old system and recorded all night:\n• 20:15 — Sofia Bennett exits through the lobby.\n• 20:50–20:53 — Oliver Hayes argues with Adrian Cole at the desk and is turned away.\n• 21:28 — Marcus Reed exits through the lobby.\n• 22:31 — Adrian Cole leaves the security desk, pulling on a coat, and exits towards Dock Street.\n• 22:31–23:04 — the desk is empty. Nobody enters or leaves through the lobby.\n• 23:04 — Cole returns, shaking off rain.",
    timeline: [
      { time: "20:15", text: "Sofia Bennett leaves Blackwood Tower by the lobby." },
      { time: "20:52", text: "Oliver Hayes is turned away at the lobby desk." },
      { time: "21:28", text: "Marcus Reed leaves by the lobby." },
      { time: "22:31", text: "Adrian Cole leaves the security desk." },
      { time: "23:04", text: "Adrian Cole returns to the desk." },
    ],
  },
  {
    id: "dock_footage", title: "Service Dock Footage", type: "digital", importance: "key", icon: "film", source: "Security Office",
    summary: "A hooded figure in a dark raincoat enters at 22:38 and leaves at 22:57. Height markers put them at about 1.65 m.",
    detail: "The Dock Street service entrance camera (legacy system, unaffected by the override):\n• 22:38 — a figure in a long dark raincoat, hood up, face turned away, swipes a card and enters.\n• 22:57 — the same figure leaves on foot, head down, towards Dock Street.\nThe door frame carries painted height markers for deliveries. Measured against them, the figure stands roughly 1.65 m (±3 cm) in heeled boots.",
    timeline: [
      { time: "22:38", text: "Hooded figure (~1.65 m) enters by the service dock." },
      { time: "22:57", text: "The hooded figure leaves by the service dock." },
    ],
  },
  {
    id: "garage_log", title: "Parking Garage Log", type: "digital", importance: "key", icon: "car", source: "Security Office",
    summary: "Marcus Reed's car (BLK-4471) re-entered the garage at 22:03 and left at 22:26.",
    detail: "Licence plate recognition, Blackwood Tower garage:\n• 08:12 — BLK-4471 (registered to Marcus Reed) — in\n• 21:31 — BLK-4471 — out\n• 22:03 — BLK-4471 — in\n• 22:26 — BLK-4471 — out",
    timeline: [
      { time: "22:03", text: "Marcus Reed's car re-enters the Tower garage." },
      { time: "22:26", text: "Marcus Reed's car leaves the Tower garage." },
    ],
  },
  {
    id: "keycard_registry", title: "Keycard Registry", type: "document", importance: "key", icon: "id-card", source: "Security Office",
    summary: "EXEC-SPARE is the spare executive card issued to Sofia Bennett. No loss was ever reported.",
    detail: "Blackwood Tower card registry, Lumen Dynamics suite:\n• MERCER-01 — Daniel Mercer\n• REED-01 — Marcus Reed\n• EXEC-SPARE — issued 3 Feb 2025 to Sofia Bennett (Executive Assistant) for 'calendar and courier access to 42-A'. Status: ACTIVE. Loss reports filed: none.\n• MASTER-SEC — Security desk (A. Cole)",
  },
  {
    id: "visitor_log", title: "Lobby Visitor Log", type: "document", importance: "supporting", icon: "book", source: "Security Office",
    summary: "'O. Hayes — Blackwood Ledger — to see D. Mercer — DENIED — 20:52', signed in his hand.",
    detail: "The handwritten visitor book at the lobby desk. Entry for 14 Nov: 'Oliver Hayes — Blackwood Ledger — to see D. Mercer re: comment on story.' Signed by Hayes. Beside it, in Adrian Cole's block capitals: 'NO APPT — DENIED — 20:52.'",
  },
  {
    id: "vigil_binder", title: "Vigil Maintenance Binder", type: "document", importance: "key", icon: "binder", source: "Security Office",
    summary: "Override code VS-7731 was issued for the 17 Nov maintenance to Lumen's scheduling contact: Sofia Bennett.",
    detail: "Vigil Systems service binder, Q4:\n• 'Quarterly maintenance — Lumen suite & internal cameras — 17 Nov. Booked by client scheduling contact: Sofia Bennett (Lumen Dynamics).'\n• 'Remote override code VS-7731 sent to scheduling contact by email 10 Nov. Valid 10–17 Nov. Usable from any device via the Vigil app.'\nCole's pencilled note: 'Never got the code — Vigil sends it straight to the tenant.'\nAlso filed: 'Service stairwell B — cameras floors 40–42 only. Refit pending.'",
  },

  // ───────────── The Drowned Anchor ─────────────
  {
    id: "bar_receipt", title: "Bar Tab: Marcus Reed", type: "document", importance: "supporting", icon: "receipt", source: "The Drowned Anchor",
    summary: "Card payment by Marcus Reed at 22:43, double Scotch. Tab closed at 00:31.",
    detail: "From the Anchor's card terminal: 'M. REED — Glenlivet 18, double — 22:43'. Four more doubles follow. The tab closed at 00:31.",
    timeline: [{ time: "22:43", text: "Marcus Reed pays for a double Scotch at the Drowned Anchor." }],
  },
  {
    id: "bartender", title: "Bartender's Statement", type: "testimony", importance: "key", icon: "speech", source: "Mae Okafor, bartender",
    summary: "Cole sat in the back booth with a bookie 22:35–22:58. Reed came in around 22:40 with a bloody knuckle.",
    detail: "Mae Okafor, behind the bar at the Drowned Anchor:\n\"Adrian Cole came in about 22:35. Sat in the back booth with Vinnie Sato — Sato takes bets. They talked money, Cole handed over an envelope, left just before eleven.\n\"Marcus Reed came in round 22:40. Expensive suit, one sleeve hanging loose, scraped knuckles. Sat right there and kept saying 'He was fine when I left. He was fine.' Didn't move till we closed his tab after midnight.\"",
    timeline: [
      { time: "22:35", text: "(Witness) Adrian Cole arrives at the Drowned Anchor to meet a bookie." },
      { time: "22:40", text: "(Witness) Marcus Reed arrives at the Drowned Anchor." },
      { time: "22:58", text: "(Witness) Adrian Cole leaves the Drowned Anchor." },
    ],
  },
  {
    id: "napkin", title: "Bookie's Napkin", type: "physical", importance: "minor", icon: "napkin", source: "The Drowned Anchor",
    summary: "'A.C. — 12k — paid 6, owes 6 — Fri' scrawled on a bar napkin.",
    detail: "Left in the back booth, under an ashtray: a napkin scrawled in pencil. 'A.C. — 12k — pd 6 — 6 Fri. No more extensions.' Someone is in debt, and it isn't small.",
  },

  // ───────────── Mercer penthouse ─────────────
  {
    id: "laptop", title: "Mercer's Laptop (Message Sync)", type: "digital", importance: "key", icon: "laptop", source: "Mercer Penthouse",
    summary: "His synced texts: 21:12 to Sofia — 'I know about Lantern. I know who your brother was.' 22:36 reply: 'Don't call anyone. I'm coming up.'",
    detail: "The laptop on his study desk mirrors his phone's messages. The thread with Sofia Bennett:\n\n21:12 — DANIEL: \"I know about Lantern. I know who your brother was. Be at the office tonight or I go to the police at 9am. You'll never work again — and Hayes goes down with you.\"\n\n22:36 — SOFIA: \"Don't call anyone. I'm coming up.\"\n\nNo further messages.",
    timeline: [
      { time: "21:12", text: "Mercer to Sofia: 'I know about Lantern. I know who your brother was.'" },
      { time: "22:36", text: "Sofia to Mercer: 'Don't call anyone. I'm coming up.'" },
    ],
  },
  {
    id: "dossier", title: "Private Investigator's Dossier", type: "document", importance: "key", icon: "folder", source: "Mercer Penthouse",
    summary: "A background check Mercer ordered on Sofia Bennett: her half-brother was Thomas Kessler, the engineer he fired.",
    detail: "Kirby & Vance Investigations, delivered 13 Nov:\n'Subject: Sofia Bennett, 29. Half-brother: Thomas Kessler (former Lumen engineer, dismissed 2023, deceased 2024). Subject applied to Lumen four months after Kessler's death under her father's surname. Subject's personal email has repeatedly forwarded internal Lumen documents to an encrypted drop. Recipient consistent with journalist Oliver Hayes's source protocol.'\nMercer has underlined 'Kessler' twice.",
    timeline: [{ time: "—", text: "13 Nov: Mercer receives a PI report on Sofia Bennett's link to Thomas Kessler." }],
  },
  {
    id: "safe", title: "Opened Study Safe", type: "physical", importance: "supporting", icon: "safe", source: "Mercer Penthouse",
    summary: "The safe behind the painting stands open. A folder labelled 'E.M. — Cayman' is empty.",
    detail: "The wall safe behind the harbour painting is open — opened by code, not forced. Inside, among share certificates, sits an empty manila folder tabbed 'E.M. — CAYMAN — for court'. Whatever was in it is gone.",
  },
  {
    id: "doorman_log", title: "Harbor Heights Concierge Log", type: "digital", importance: "key", icon: "tablet", source: "Mercer Penthouse",
    summary: "'Mrs. E. Mercer — resident key — 22:05 in / 22:20 out.'",
    detail: "The concierge tablet's entry log for the penthouse lift:\n• 22:05 — Mrs. Evelyn Mercer — resident fob (legacy, not deactivated) — up to PH\n• 22:20 — Mrs. Evelyn Mercer — down, exits to street\nThe night concierge noted: 'Mrs M. in evening gown, in a hurry, carrying a folder on the way out.'",
    timeline: [
      { time: "22:05", text: "Evelyn Mercer enters the Harbor Heights penthouse." },
      { time: "22:20", text: "Evelyn Mercer leaves the penthouse carrying a folder." },
    ],
  },

  // ───────────── Blackwood Ledger newsroom ─────────────
  {
    id: "expose", title: "Exposé Draft", type: "digital", importance: "key", icon: "newspaper", source: "Blackwood Ledger",
    summary: "'The Dark Behind the Light' — Halvorsen payments and a stolen patent, sourced to an insider codenamed LANTERN.",
    detail: "Draft on Oliver Hayes's screen, slated for the 18 Nov edition:\n'THE DARK BEHIND THE LIGHT — How Lumen's millions vanished into a shell company, and how its founder built an empire on a dead engineer's work.'\nSources: 'LANTERN — Lumen insider with access to the CEO's calendar and correspondence.'\nThe CMS revision history shows Hayes editing the draft at 22:40, 22:47 and 23:02.",
  },
  {
    id: "threats", title: "Threatening Messages", type: "document", importance: "supporting", icon: "warning", source: "Blackwood Ledger",
    summary: "Printouts of anonymous texts: 'Drop the Halvorsen story or you'll drown in it.'",
    detail: "Pinned to Hayes's corkboard, printed from his phone. From an unregistered number, 2–12 Nov:\n'Drop the Halvorsen story.'\n'Some numbers are better left alone.'\n'Drop the Halvorsen story or you'll drown in it.'\nHayes has written: 'Started the day after I called Lumen finance about Halvorsen.'",
  },
  {
    id: "newsroom_log", title: "Ledger Badge & Editing Log", type: "digital", importance: "supporting", icon: "list", source: "Blackwood Ledger",
    summary: "Hayes badged into the newsroom at 21:34 and didn't leave until 01:12. Night editor confirms.",
    detail: "Ledger building badge log: O. HAYES — in 21:34 — out 01:12. Night editor Priya Shah's note: 'Oliver at his desk all night rewriting the Lumen piece. Ate at his desk. Only left to use the bathroom.' CMS edits at 22:40, 22:47 and 23:02 were made from his desk terminal.",
    timeline: [{ time: "21:34", text: "Oliver Hayes badges into the Ledger newsroom (stays until 01:12)." }],
  },
  {
    id: "reporter_notebook", title: "Reporter's Notebook", type: "document", importance: "minor", icon: "notebook", source: "Blackwood Ledger",
    summary: "Hayes's notes: 'L. says Lighthouse was stolen from an engineer — T.K.? L. knows too much about him. Personal?'",
    detail: "A battered spiral notebook. Among shorthand notes:\n'L. — calendar, emails, board minutes. Never meets in person.'\n'L. says Lighthouse was T.K.'s — Mercer took it. Check patent drafts.'\n'L. knows T.K. too well. Personal?'",
  },

  // ───────────── Carver Street flat (search warrant) ─────────────
  {
    id: "spare_card", title: "Spare Executive Keycard", type: "physical", importance: "key", icon: "id-card", source: "Carver Street Flat",
    summary: "Card EXEC-SPARE, found in the pocket of a still-damp dark raincoat.",
    detail: "In the pocket of a long navy raincoat hanging by the door — the hem still damp — a white keycard printed LUMEN DYNAMICS · 42-A · EXEC-SPARE. The card she said she lost weeks ago.",
  },
  {
    id: "victim_phone", title: "Daniel Mercer's Phone", type: "physical", importance: "key", icon: "phone", source: "Carver Street Flat",
    summary: "Mercer's phone, powered off, wrapped in a tea towel at the back of a kitchen drawer.",
    detail: "Wrapped in a tea towel behind the cutlery tray: a black phone in a leather case embossed D.M. Powered off. When the lab powers it on, the last messages match the laptop: 'I know about Lantern...' and 'Don't call anyone. I'm coming up.'",
  },
  {
    id: "boots", title: "Heeled Ankle Boots", type: "physical", importance: "key", icon: "boots", source: "Carver Street Flat",
    summary: "EU size 37, chevron sole, still gritty with street dirt.",
    detail: "On the mat by the door: black heeled ankle boots, EU 37. The chevron sole pattern matches the forensic photograph of the print in Mercer's office, down to a nick in the left heel.",
  },
  {
    id: "brother_photo", title: "Photograph: Sofia & Thomas", type: "physical", importance: "supporting", icon: "frame", source: "Carver Street Flat",
    summary: "A younger Sofia with Thomas Kessler. Inscribed: 'For Sofi — keep the light on. T.'",
    detail: "A framed photograph on the bookshelf: Sofia, maybe twenty, laughing beside a lanky young man in a Lumen hoodie. On the back, in marker: 'For Sofi — keep the light on. T.' Beside it, an order-of-service card: 'Thomas Kessler, 1994–2024'.",
  },
  {
    id: "jiggler", title: "Mouse-Jiggler Device", type: "physical", importance: "supporting", icon: "usb", source: "Carver Street Flat",
    summary: "A USB device that nudges the cursor to keep a computer 'active'. Plugged into her work desktop.",
    detail: "Plugged into the back of Sofia's desktop: a thumb-sized USB dongle labelled 'KeepAwake Pro — prevents idle status'. It moves the cursor a single pixel every thirty seconds. The VPN client is configured to auto-reconnect.",
  },

  // ───────────── Testimony (recorded in interrogation) ─────────────
  { id: "T_EVELYN_ALIBI", title: "Evelyn: 'At the gala all evening'", type: "testimony", importance: "supporting", icon: "speech", source: "Evelyn Mercer",
    summary: "Evelyn claims she was at the Children's Hospital gala at the Grand Meridian all evening.",
    detail: "\"I was at the Grand Meridian from seven until well past midnight. The Children's Hospital gala. Three hundred people saw me.\"",
    timeline: [{ time: "19:00", text: "(Claim) Evelyn: at the Grand Meridian gala all evening." }] },
  { id: "T_EVELYN_PENTHOUSE", title: "Evelyn: Penthouse admission", type: "testimony", importance: "supporting", icon: "speech", source: "Evelyn Mercer",
    summary: "Evelyn admits she slipped out to the penthouse 22:05–22:20 to take the Cayman file from the safe.",
    detail: "\"Daniel called me at half past eight. He'd found the Cayman account and said he'd give it to the divorce judge on Monday. I knew the safe code — it's still our anniversary. I took the file and went straight back to the gala. I never went near that tower.\"",
    timeline: [{ time: "22:05", text: "(Claim) Evelyn: at the penthouse taking the Cayman file, then straight back to the gala." }] },
  { id: "valet", title: "Valet Stub & Auction Photo", type: "document", importance: "supporting", icon: "ticket", source: "Evelyn Mercer",
    summary: "Grand Meridian valet: car out 21:47, back 22:41. Gala photo of Evelyn bidding at 22:55.",
    detail: "Evelyn hands over a Grand Meridian valet stub stamped OUT 21:47 / RETURNED 22:41, and a gala photographer's image time-stamped 22:55 showing her raising a paddle at the silent auction. The Grand Meridian is a 25-minute drive from Blackwood Tower.",
    timeline: [
      { time: "21:47", text: "Evelyn's car leaves the Grand Meridian valet." },
      { time: "22:41", text: "Evelyn's car returns to the Grand Meridian valet." },
      { time: "22:55", text: "Evelyn photographed bidding at the gala auction." },
    ] },
  { id: "T_MARCUS_ALIBI", title: "Marcus: 'Left at 21:30'", type: "testimony", importance: "supporting", icon: "speech", source: "Marcus Reed",
    summary: "Marcus claims he left Blackwood Tower at 21:30 and went home.",
    detail: "\"I left around half nine. Drove home, had a drink, went to bed. Didn't hear a thing until the police called.\"",
    timeline: [{ time: "21:30", text: "(Claim) Marcus: left the Tower at 21:30 and went home." }] },
  { id: "T_MARCUS_UNAWARE", title: "Marcus: 'Daniel suspected nothing'", type: "testimony", importance: "minor", icon: "speech", source: "Marcus Reed",
    summary: "Marcus insists Daniel had no concerns about the company accounts.",
    detail: "\"The accounts? Daniel never raised anything with me. We were fine. Ask anyone.\"" },
  { id: "T_MARCUS_RETURN", title: "Marcus: 'He was alive when I left'", type: "testimony", importance: "key", icon: "speech", source: "Marcus Reed",
    summary: "Marcus admits he came back at 22:05, they fought, the watch broke — but swears Daniel was alive when he left at 22:21 for the Drowned Anchor.",
    detail: "\"Fine. I came back. He'd emailed me — Halvorsen, the lot. We argued, he went for the phone to call the police, I grabbed his wrists. His watch smashed on the desk. I let go, I left. He was standing, swearing at me, very much alive. 22:20, maybe. I went to the Drowned Anchor and drank.\"",
    timeline: [{ time: "22:08", text: "(Claim) Marcus: argued and scuffled with Mercer; left him alive around 22:20." }] },
  { id: "T_SOFIA_ALIBI", title: "Sofia: 'Home all evening'", type: "testimony", importance: "supporting", icon: "speech", source: "Sofia Bennett",
    summary: "Sofia claims she worked from home on the company VPN all evening.",
    detail: "\"I left the office at quarter past eight and worked from home until half eleven. I was on the VPN the whole time — IT can confirm.\"",
    timeline: [{ time: "20:58", text: "(Claim) Sofia: at home on the VPN until 23:30." }] },
  { id: "T_SOFIA_CARD", title: "Sofia: 'I lost the spare card'", type: "testimony", importance: "supporting", icon: "speech", source: "Sofia Bennett",
    summary: "Sofia claims she lost the spare executive keycard weeks ago.",
    detail: "\"The spare card? I lost it. Weeks ago — on the tram, I think. I kept meaning to report it.\"" },
  { id: "T_SOFIA_NOCONTACT", title: "Sofia: 'No contact after 20:15'", type: "testimony", importance: "supporting", icon: "speech", source: "Sofia Bennett",
    summary: "Sofia claims she had no contact with Daniel after leaving the office.",
    detail: "\"After I left at quarter past eight? No. He didn't call, I didn't message. He didn't like to be disturbed in the evenings.\"" },
  { id: "T_SOFIA_FOUND", title: "Sofia: 'He was already dead'", type: "testimony", importance: "key", icon: "speech", source: "Sofia Bennett",
    summary: "Sofia now admits going to the office — but claims Daniel was already dead when she arrived, and she only took his phone.",
    detail: "\"All right. I went. He'd texted me. When I got upstairs he was on the floor. Already gone. I panicked — the messages on his phone would have destroyed me, so I took it and I ran. That's all. I didn't kill him.\"",
    timeline: [{ time: "22:44", text: "(Claim) Sofia: found Mercer already dead and took his phone." }] },
  { id: "T_ADRIAN_DESK", title: "Adrian: 'At my desk — a technical fault'", type: "testimony", importance: "supporting", icon: "speech", source: "Adrian Cole",
    summary: "Adrian claims he never left the security desk and the outage was a firmware fault.",
    detail: "\"I was at that desk from six till the body was found. The cameras glitched — firmware. It happens.\"" },
  { id: "T_ADRIAN_ANCHOR", title: "Adrian: 'I was at the Anchor'", type: "testimony", importance: "supporting", icon: "speech", source: "Adrian Cole",
    summary: "Adrian admits he left his post 22:31–23:04 to pay a gambling debt at the Drowned Anchor, then covered it up.",
    detail: "\"I owed money to Vinnie Sato. He said tonight or else. I walked to the Anchor at half ten and paid him. When I got back the outage alert was on the screen and I knew how it would look. So I wrote 'technical fault'. Thirty years of service and I wrote a lie.\"",
    timeline: [{ time: "22:31", text: "(Claim) Adrian: walked to the Drowned Anchor to pay a debt; back at 23:04." }] },
  { id: "T_ADRIAN_CODE", title: "Adrian: 'Vigil codes go to the tenant'", type: "testimony", importance: "supporting", icon: "speech", source: "Adrian Cole",
    summary: "Adrian explains the override code isn't his: Vigil emails it to Lumen's scheduling contact — Mercer's assistant.",
    detail: "\"VS-7731 is a maintenance code. I never see those. Vigil sends them to whoever booked the maintenance on the tenant side. For Lumen that's Mercer's assistant, Sofia Bennett. She books everything.\"" },
  { id: "T_OLIVER_NEVER", title: "Oliver: 'Never entered the Tower'", type: "testimony", importance: "supporting", icon: "speech", source: "Oliver Hayes",
    summary: "Oliver claims he never set foot in Blackwood Tower that evening.",
    detail: "\"I wasn't anywhere near Blackwood Tower. I was in the newsroom all night.\"" },
  { id: "T_OLIVER_LOBBY", title: "Oliver: Lobby admission", type: "testimony", importance: "minor", icon: "speech", source: "Oliver Hayes",
    summary: "Oliver admits he went to the lobby at 20:50 to doorstep Mercer for comment and was turned away.",
    detail: "\"Fine — I went to the lobby. I wanted his comment on the record before we ran it. Cole threw me out at ten to nine and I went back to the office. I lied because the man got murdered three hours later and I'm the guy writing a hit piece on him.\"" },
  { id: "T_OLIVER_LANTERN", title: "Oliver: Lantern's last message", type: "testimony", importance: "key", icon: "speech", source: "Oliver Hayes",
    summary: "Oliver reveals that LANTERN messaged him at 21:20: 'He knows. I'll fix it. Don't contact me.' Lantern is Sofia Bennett.",
    detail: "Hayes shows you his encrypted messaging app. From the contact LANTERN, 21:20, 14 Nov:\n'He knows. I'll fix it. Don't contact me.'\n\"Lantern is Sofia Bennett. Her brother was Thomas Kessler. I thought 'fix it' meant she'd lawyer up. God help me, I didn't ask.\"",
    timeline: [{ time: "21:20", text: "LANTERN (Sofia) to Hayes: 'He knows. I'll fix it. Don't contact me.'" }] },
];
