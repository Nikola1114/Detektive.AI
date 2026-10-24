/**
 * Story mode for Case 001. Narration never names the killer: chapters only
 * steer the player towards evidence they could find in any mode.
 */
import type { ChapterDef } from "../types.ts";
import { finalChapter } from "../../engine/story.ts";

export const story: ChapterDef[] = [
  {
    id: "scene",
    title: "The Scene",
    intro: [
      { visual: "rain", text: "Blackwood City. Ninth night of rain. The kind of rain that washes nothing clean.", speaker: "narrator", camera: "push", caption: "BLACKWOOD CITY · 14 NOVEMBER 2026" },
      { visual: "tower", text: "Forty-two floors up, in the tallest tower in the city, the lights in one office never went out.", speaker: "narrator", camera: "pull" },
      { visual: "scene:office", text: "At twenty to midnight, a cleaner found the door locked. Inside: Daniel Mercer, founder of Lumen Dynamics. Dead beside his own desk.", speaker: "narrator", camera: "pan-right", caption: "23:40" },
      { visual: "scene:police", text: "A broken watch. A glass of whiskey. Eleven minutes of missing camera footage. And five people who won't miss him. Welcome back, Detective.", speaker: "kane", camera: "push" },
      { visual: "title", text: "", caption: "The Last Light" },
      { visual: "black", text: "Chapter one. The scene.", speaker: "narrator", caption: "Chapter 1 · The Scene" },
    ],
    objectives: [
      { text: "Mercer's Office: examine the broken wristwatch", done: { evidence: ["watch"] } },
      { text: "Mercer's Office: check his desktop computer", done: { evidence: ["computer"] } },
      { text: "Mercer's Office: inspect the door lock", done: { evidence: ["door_lock"] } },
      { text: "Mercer's Office: look at the crystal award", done: { evidence: ["lighthouse"] } },
      { text: "Precinct: read the autopsy report", done: { evidence: ["autopsy"] } },
    ],
  },
  {
    id: "tower",
    title: "The Tower Remembers",
    intro: [
      { visual: "black", text: "Chapter two. The tower remembers.", speaker: "narrator", caption: "Chapter 2 · The Tower Remembers" },
      { visual: "tower", text: "A watch can lie. A body can lie about the time. But a building full of sensors keeps a diary, and it never sleeps.", speaker: "narrator", camera: "push" },
      { visual: "scene:security", text: "The security office logs every door, every car and every camera. Somebody switched those cameras off. Find out how, and who walked in while they were dark.", speaker: "kane", camera: "pan-left", caption: "TOWER SECURITY · LEVEL B1" },
    ],
    objectives: [
      { text: "Security: read the door access log", done: { evidence: ["door_log"] } },
      { text: "Security: check the camera controller", done: { evidence: ["camera_log"] } },
      { text: "Security: watch the lobby footage", done: { evidence: ["lobby_footage"] } },
      { text: "Security: watch the service dock footage", done: { evidence: ["dock_footage"] } },
      { text: "Security: open the keycard registry", done: { evidence: ["keycard_registry"] } },
      { text: "Security: check the garage plate log", done: { evidence: ["garage_log"] } },
    ],
  },
  {
    id: "liars",
    title: "Five Stories",
    intro: [
      { visual: "black", text: "Chapter three. Five stories.", speaker: "narrator", caption: "Chapter 3 · Five Stories" },
      { visual: "room:evelyn", text: "Evelyn Mercer. The wife. She'll tell you she was at a charity gala all night.", speaker: "narrator", camera: "push", caption: "Evelyn Mercer" },
      { visual: "room:marcus", text: "Marcus Reed. Partner, friend, and lately not much of either.", speaker: "narrator", camera: "pan-right", caption: "Marcus Reed" },
      { visual: "room:sofia", text: "Sofia Bennett. His assistant. She knew his schedule better than he did.", speaker: "narrator", camera: "push", caption: "Sofia Bennett" },
      { visual: "room:adrian", text: "Adrian Cole. The night guard who was supposed to be watching those cameras.", speaker: "narrator", camera: "pan-left", caption: "Adrian Cole" },
      { visual: "room:oliver", text: "Oliver Hayes. A reporter who'd been digging into Mercer for a year.", speaker: "narrator", camera: "push", caption: "Oliver Hayes" },
      { visual: "scene:police", text: "Everybody lies to us, Detective. The trick is finding out which lie matters. Get every one of them on the record.", speaker: "kane", camera: "pull" },
    ],
    objectives: [
      { text: "Ask Evelyn where she was", done: { evidence: ["T_EVELYN_ALIBI"] } },
      { text: "Ask Marcus where he was", done: { evidence: ["T_MARCUS_ALIBI"] } },
      { text: "Ask Sofia where she was", done: { evidence: ["T_SOFIA_ALIBI"] } },
      { text: "Ask Adrian about the camera outage", done: { evidence: ["T_ADRIAN_DESK"] } },
      { text: "Ask Oliver about that night", done: { evidence: ["T_OLIVER_NEVER"] } },
    ],
  },
  {
    id: "cracks",
    title: "Cracks",
    intro: [
      { visual: "black", text: "Chapter four. Cracks.", speaker: "narrator", caption: "Chapter 4 · Cracks" },
      { visual: "scene:bar", text: "The Drowned Anchor. Two minutes from the Tower's back door, and a bartender who never forgets a face.", speaker: "narrator", camera: "push", caption: "THE DROWNED ANCHOR · DOCK STREET" },
      { visual: "scene:penthouse", text: "Up in Harbor Heights, Mercer's penthouse sits dark. His keys are in the evidence box. A doorman keeps a log.", speaker: "narrator", camera: "pan-right" },
      { visual: "scene:police", text: "Their stories have holes now. Push on them. Show them what you've found and watch who flinches.", speaker: "kane", camera: "push" },
    ],
    objectives: [
      { text: "Get Marcus to admit he went back", done: { evidence: ["T_MARCUS_RETURN"] } },
      { text: "The Drowned Anchor: talk to the bartender", done: { evidence: ["bartender"] } },
      { text: "Precinct: open the victim's personal effects", done: { evidence: ["effects"] } },
      { text: "Penthouse: check the concierge log", done: { evidence: ["doorman_log"] } },
      { text: "Get Evelyn to admit the penthouse visit", done: { evidence: ["T_EVELYN_PENTHOUSE"] } },
      { text: "Get Oliver to admit he came to the lobby", done: { evidence: ["T_OLIVER_LOBBY"] } },
    ],
  },
  {
    id: "lantern",
    title: "Lantern",
    intro: [
      { visual: "black", text: "Chapter five. Lantern.", speaker: "narrator", caption: "Chapter 5 · Lantern" },
      { visual: "scene:penthouse", text: "Dead men don't talk. But their laptops do. Mercer's messages are still syncing in his study.", speaker: "narrator", camera: "push" },
      { visual: "scene:newsroom", text: "Somebody inside Lumen had been feeding a reporter secrets. They signed every message with one word.", speaker: "narrator", camera: "pan-left", caption: "THE BLACKWOOD LEDGER" },
      { visual: "rain", text: "Lantern.", speaker: "narrator", camera: "still", caption: "LANTERN" },
    ],
    objectives: [
      { text: "Penthouse: read the laptop", done: { evidence: ["laptop"] } },
      { text: "Penthouse: find what's in the study drawer", done: { evidence: ["dossier"] } },
      { text: "Newsroom: read the exposé draft", done: { evidence: ["expose"] } },
      { text: "Get Oliver to show you Lantern's last message", done: { evidence: ["T_OLIVER_LANTERN"] } },
      { text: "Precinct: check the Lumen VPN logs", done: { evidence: ["vpn_log"] } },
    ],
  },
  {
    id: "warrant",
    title: "The Warrant",
    intro: [
      { visual: "black", text: "Chapter six. The warrant.", speaker: "narrator", caption: "Chapter 6 · The Warrant" },
      { visual: "city", text: "A taxi in the rain. A keycard that was never lost. One alibi is coming apart at the seams.", speaker: "narrator", camera: "pan-right", caption: "02:10" },
      { visual: "scene:police", text: "The judge signed it. You've got a warrant, Detective. Go and see what's in that flat before somebody tidies up.", speaker: "kane", camera: "push" },
      { visual: "scene:flat", text: "", camera: "push", caption: "CARVER STREET" },
    ],
    objectives: [
      { text: "Precinct: read Kane's taxi canvass", done: { evidence: ["taxi"] } },
      { text: "Search the flat: the raincoat", done: { evidence: ["spare_card"] } },
      { text: "Search the flat: the boots", done: { evidence: ["boots"] } },
      { text: "Search the flat: the kitchen drawer", done: { evidence: ["victim_phone"] } },
    ],
  },
  finalChapter(7),
];
