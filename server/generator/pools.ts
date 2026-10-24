/**
 * Content pools for the procedural case generator. Text uses {placeholders}
 * that the generator fills from the canonical facts it decided first.
 */
import type { PortraitSpec, SceneKind } from "../../shared/api.ts";

export interface Place { name: string; kind: SceneKind; district: string; desc: string; }

export interface SettingPool {
  id: string;
  label: string;
  crime: "murder" | "theft" | "disappearance";
  period: "modern" | "1920s";
  city: string;
  date: string;
  titles: string[];
  victimRoles: string[];
  target?: string; // stolen object (theft)
  scene: Place;
  police: Place;
  places: Place[];
  relations: { profession: string; relation: string; motive: string }[];
  access: { log: string; registry: string; item: string; device: string };
  alibiBreak: { title: string; noun: string };
}

const MODERN_POLICE: Place = { name: "County Sheriff's Office", kind: "police", district: "Main Street", desc: "A cramped office with a coffee machine that has seen better decades. Your temporary desk is under the noticeboard." };

export const SETTINGS: SettingPool[] = [
  {
    id: "small-town", label: "Small-town murder mystery", crime: "murder", period: "modern", city: "Hollow Creek", date: "3 March 2026",
    titles: ["The Quiet Hour", "Still Waters", "The Last Bell", "Under Hollow Creek"],
    victimRoles: ["the town pharmacist", "the mayor's chief of staff", "the owner of the general store", "the local veterinarian"],
    scene: { name: "The Victim's Shop", kind: "shop", district: "Main Street", desc: "Shelves of jars and boxes, the blinds half drawn. The bell over the door still rings when the wind catches it." },
    police: MODERN_POLICE,
    places: [
      { name: "The Lantern Diner", kind: "bar", district: "Route 9", desc: "Chrome stools, pie under glass and a jukebox. Everyone in town passes through here." },
      { name: "Town Hall Records Office", kind: "security", district: "Civic Square", desc: "Filing cabinets, a key cabinet and a clerk who knows everybody's business." },
      { name: "Riverside Cottage", kind: "flat", district: "River Road", desc: "A rented cottage by the water. Damp, tidy, and full of other people's furniture." },
      { name: "The Hollow Creek Gazette", kind: "newsroom", district: "Market Lane", desc: "A two-desk newspaper with a printing press older than the town hall." },
      { name: "Lakeview House", kind: "penthouse", district: "Lake Shore", desc: "The biggest house in town, all glass facing the lake." },
      { name: "Old Mill Office", kind: "office", district: "Mill Street", desc: "A converted mill office with a view of the waterwheel." },
    ],
    relations: [
      { profession: "Business partner", relation: "Co-owner of the shop", motive: "Wanted to sell the business; the victim refused." },
      { profession: "Schoolteacher", relation: "Ex-spouse", motive: "A bitter custody fight." },
      { profession: "Deputy town clerk", relation: "Neighbour", motive: "A long boundary dispute over a strip of land." },
      { profession: "Diner owner", relation: "Creditor", motive: "The victim owed them a large sum." },
      { profession: "Local reporter", relation: "Investigating the victim", motive: "Was about to publish an unflattering story." },
      { profession: "Handyman", relation: "Former employee", motive: "Fired last month without pay." },
      { profession: "Church organist", relation: "Sibling", motive: "Shares the family inheritance." },
      { profession: "Real-estate agent", relation: "Rival", motive: "Lost a lucrative deal to the victim." },
      { profession: "Retired sheriff", relation: "Old friend", motive: "A falling-out nobody talks about." },
    ],
    access: { log: "Back Door Key Ledger", registry: "Shop Key Register", item: "the spare back-door key", device: "back door" },
    alibiBreak: { title: "Gas Station Receipt", noun: "a card receipt from the Route 9 gas station" },
  },
  {
    id: "hotel", label: "Luxury hotel disappearance", crime: "disappearance", period: "modern", city: "Port Ardent", date: "21 August 2026",
    titles: ["Room 1207", "The Grand Absence", "Do Not Disturb", "The Velvet Corridor"],
    victimRoles: ["a visiting art dealer", "a pop singer on tour", "a shipping heiress", "a tech investor"],
    scene: { name: "Suite 1207", kind: "hotel", district: "The Halcyon Hotel, 12th Floor", desc: "Silk curtains, a cold room-service tray and an unmade bed. The guest's phone was left on the nightstand." },
    police: { name: "Port Ardent Police HQ", kind: "police", district: "Harbour Road", desc: "A modern station with tired furniture. Missing Persons has given you a corner." },
    places: [
      { name: "Hotel Security Office", kind: "security", district: "The Halcyon, Basement", desc: "Monitors, a key-card encoder and the night manager's logbook." },
      { name: "The Halcyon Bar", kind: "bar", district: "The Halcyon, Lobby", desc: "Low lights, a pianist and bartenders trained never to notice anything." },
      { name: "Staff Quarters", kind: "flat", district: "The Halcyon, Service Wing", desc: "Narrow rooms for live-in staff, each one exactly the same." },
      { name: "Concierge Office", kind: "office", district: "The Halcyon, Lobby", desc: "Envelopes, tickets and secrets filed in neat pigeonholes." },
      { name: "Penthouse Suite", kind: "penthouse", district: "The Halcyon, Top Floor", desc: "The hotel owner's private suite, with a terrace above the harbour." },
      { name: "Society Pages Office", kind: "newsroom", district: "Harbour Road", desc: "A gossip magazine's office, walls covered in red-carpet photographs." },
    ],
    relations: [
      { profession: "Night manager", relation: "Hotel staff", motive: "The guest had complained about them to the owner." },
      { profession: "Personal assistant", relation: "Employee", motive: "Underpaid and recently humiliated in public." },
      { profession: "Hotel owner", relation: "Host", motive: "The guest was blocking a lucrative sale." },
      { profession: "Business rival", relation: "Fellow guest", motive: "Lost a fortune in a deal with the guest." },
      { profession: "Gossip columnist", relation: "Following the guest", motive: "Was promised an exclusive that never came." },
      { profession: "Bodyguard", relation: "Security detail", motive: "Was about to be fired." },
      { profession: "Former partner", relation: "Ex-lover", motive: "An acrimonious break-up last year." },
      { profession: "Room-service waiter", relation: "Hotel staff", motive: "Accused of theft by the guest." },
      { profession: "Concierge", relation: "Hotel staff", motive: "Was owed a large favour." },
    ],
    access: { log: "Key-Card Encoder Log", registry: "Staff Key-Card Register", item: "master key-card 7", device: "suite door" },
    alibiBreak: { title: "Taxi Receipt", noun: "a taxi receipt from the Halcyon rank" },
  },
  {
    id: "museum", label: "Art museum theft", crime: "theft", period: "modern", city: "Vellmouth", date: "9 January 2026",
    titles: ["The Empty Frame", "Nocturne in Blue", "The Night Heron", "A Gap on the Wall"],
    victimRoles: ["the museum"], target: "'The Night Heron', an 18th-century oil painting",
    scene: { name: "The East Gallery", kind: "museum", district: "Vellmouth Museum of Art", desc: "Polished floors, velvet ropes and an empty frame where 'The Night Heron' hung until last night." },
    police: { name: "Vellmouth Art Crimes Unit", kind: "police", district: "Station Street", desc: "A small specialist unit. Auction catalogues are stacked on every surface." },
    places: [
      { name: "Museum Security Room", kind: "security", district: "Vellmouth Museum, Lower Ground", desc: "Monitors, alarm panels and a key cabinet." },
      { name: "Restoration Studio", kind: "office", district: "Vellmouth Museum, Attic", desc: "Easels, solvents and paintings in various states of repair." },
      { name: "The Gilded Fox", kind: "bar", district: "Station Street", desc: "The museum staff's pub of choice, two minutes from the staff entrance." },
      { name: "Director's Residence", kind: "penthouse", district: "Crescent Park", desc: "An elegant flat crammed with books and a few suspiciously good paintings." },
      { name: "Collector's Gallery", kind: "museum", district: "Old Quay", desc: "A private dealer's showroom, all spotlights and discretion." },
      { name: "Lodgings on Mercer Lane", kind: "flat", district: "Mercer Lane", desc: "A rented room above a launderette." },
    ],
    relations: [
      { profession: "Head of security", relation: "Museum staff", motive: "Passed over for promotion; heavily in debt." },
      { profession: "Painting restorer", relation: "Museum staff", motive: "Had unsupervised access to the painting for weeks." },
      { profession: "Museum director", relation: "Museum staff", motive: "The museum's insurance payout would save his budget." },
      { profession: "Private collector", relation: "Donor", motive: "Offered to buy the painting last year and was refused." },
      { profession: "Art student", relation: "Intern", motive: "Copies masterpieces as a hobby." },
      { profession: "Night guard", relation: "Museum staff", motive: "Was on duty and saw nothing." },
      { profession: "Art dealer", relation: "Business contact", motive: "Rumoured to deal in stolen works." },
      { profession: "Board member", relation: "Trustee", motive: "Pushing to sell the collection." },
      { profession: "Electrician", relation: "Contractor", motive: "Rewired the alarm system last month." },
    ],
    access: { log: "Staff Entrance Swipe Log", registry: "Staff Pass Register", item: "staff pass 0419", device: "staff entrance" },
    alibiBreak: { title: "Station CCTV Still", noun: "a still from the station camera on the corner" },
  },
  {
    id: "missing", label: "Missing-person investigation", crime: "disappearance", period: "modern", city: "Greyhaven", date: "14 October 2026",
    titles: ["Last Seen", "The Unlit Window", "Gone by Morning", "The Quiet Street"],
    victimRoles: ["a university lecturer", "a junior doctor", "a bookshop owner", "a council planning officer"],
    scene: { name: "The Missing Person's Flat", kind: "flat", district: "Elm Terrace", desc: "A half-drunk mug of tea, a coat still on the hook, the radio left on." },
    police: { name: "Greyhaven CID", kind: "police", district: "Market Square", desc: "The CID office. A whiteboard is already covered in arrows." },
    places: [
      { name: "The Crown & Anchor", kind: "bar", district: "Quay Street", desc: "The last place anyone remembers seeing them." },
      { name: "Workplace Office", kind: "office", district: "University Quarter", desc: "A shared office with three desks and one window." },
      { name: "Building Caretaker's Room", kind: "security", district: "Elm Terrace", desc: "Keys on hooks, a CCTV monitor and a kettle." },
      { name: "Greyhaven Echo", kind: "newsroom", district: "High Street", desc: "The local paper, already running the appeal on its front page." },
      { name: "Hillside House", kind: "penthouse", district: "North Hill", desc: "A large house with a view over the whole town." },
      { name: "The Old Boathouse", kind: "shop", district: "Riverside", desc: "Rowing club storage, smelling of varnish and river mud." },
    ],
    relations: [
      { profession: "Flatmate", relation: "Lives with them", motive: "Rent disputes and a stolen boyfriend." },
      { profession: "Line manager", relation: "Boss", motive: "Was about to be reported for misconduct." },
      { profession: "Ex-partner", relation: "Former partner", motive: "Never accepted the break-up." },
      { profession: "Landlord", relation: "Landlord", motive: "Wanted them evicted to sell the building." },
      { profession: "Best friend", relation: "Friend", motive: "Owed them money." },
      { profession: "Colleague", relation: "Work rival", motive: "Competing for the same promotion." },
      { profession: "Caretaker", relation: "Building staff", motive: "Had keys to every flat." },
      { profession: "Sibling", relation: "Brother/sister", motive: "A family business dispute." },
      { profession: "Journalist", relation: "Contact", motive: "Was working on a story with them." },
    ],
    access: { log: "Communal Door Fob Log", registry: "Fob Register", item: "fob 12B", device: "communal door" },
    alibiBreak: { title: "Bus Camera Still", noun: "a still from the No. 14 bus camera" },
  },
  {
    id: "espionage", label: "Corporate espionage", crime: "theft", period: "modern", city: "Northgate", date: "2 June 2026",
    titles: ["Project Halcyon", "The Clean Room", "Zero Day", "The Quiet Leak"],
    victimRoles: ["Corvane Robotics"], target: "the 'Halcyon' prototype design files",
    scene: { name: "Corvane R&D Lab", kind: "office", district: "Corvane Tower, Floor 9", desc: "Whiteboards wiped clean, a server cabinet left ajar and an empty secure drive bay." },
    police: { name: "Fraud & Cyber Unit", kind: "police", district: "Northgate Central", desc: "Two desks, four screens and a detective who hasn't slept." },
    places: [
      { name: "Corvane Security Desk", kind: "security", district: "Corvane Tower, Lobby", desc: "Badge readers, camera feeds and the visitor book." },
      { name: "The Circuit Bar", kind: "bar", district: "Northgate Docks", desc: "Where engineers drink after the lab closes." },
      { name: "Executive Floor", kind: "penthouse", district: "Corvane Tower, Floor 20", desc: "Glass offices and leather chairs." },
      { name: "Contractor's Flat", kind: "flat", district: "Canal Side", desc: "A minimalist flat with three monitors and no food." },
      { name: "Tech Press Office", kind: "newsroom", district: "Northgate Central", desc: "A tech news site's open-plan office." },
      { name: "Rival Firm Showroom", kind: "shop", district: "Northgate Docks", desc: "Glossy demo robots behind glass." },
    ],
    relations: [
      { profession: "Lead engineer", relation: "Project lead", motive: "Credit for the design was given to someone else." },
      { profession: "Chief financial officer", relation: "Executive", motive: "Personal debts and stock options underwater." },
      { profession: "IT administrator", relation: "Staff", motive: "Has keys to every system." },
      { profession: "Contract developer", relation: "Contractor", motive: "Contract ending without renewal." },
      { profession: "Tech journalist", relation: "Press", motive: "Desperate for a scoop." },
      { profession: "Head of security", relation: "Staff", motive: "Recently disciplined." },
      { profession: "Intern", relation: "Staff", motive: "Recruited by a rival firm last month." },
      { profession: "Sales director", relation: "Executive", motive: "Close friends with the rival firm's CEO." },
      { profession: "Office manager", relation: "Staff", motive: "Knows everyone's passwords." },
    ],
    access: { log: "Lab Door Badge Log", registry: "Badge Register", item: "badge C-114", device: "lab door" },
    alibiBreak: { title: "Parking Barrier Log", noun: "a parking barrier photo from the Corvane garage" },
  },
  {
    id: "inheritance", label: "Inheritance dispute", crime: "murder", period: "modern", city: "Ashcombe", date: "28 December 2026",
    titles: ["The Last Will", "Ashcombe Hall", "A Family Affair", "The Reading of the Will"],
    victimRoles: ["the family patriarch", "the widowed matriarch", "the eldest heir", "the family solicitor"],
    scene: { name: "The Library at Ashcombe Hall", kind: "manor", district: "Ashcombe Hall", desc: "Leather spines to the ceiling, a dying fire and a chair that is still warm." },
    police: { name: "Ashcombe Police Station", kind: "police", district: "Ashcombe Village", desc: "A village station with one cell and too many tea cups." },
    places: [
      { name: "Butler's Pantry", kind: "security", district: "Ashcombe Hall, Below Stairs", desc: "Silver, keys and the household ledger." },
      { name: "The Ashcombe Arms", kind: "bar", district: "Ashcombe Village", desc: "The village pub. The family's business is everyone's business here." },
      { name: "The East Wing", kind: "penthouse", district: "Ashcombe Hall", desc: "Guest bedrooms with portraits of disapproving ancestors." },
      { name: "Estate Office", kind: "office", district: "Ashcombe Hall Grounds", desc: "Maps of the estate, rent books and a locked safe." },
      { name: "Gatehouse Cottage", kind: "flat", district: "Ashcombe Hall Grounds", desc: "A small cottage at the end of the drive." },
      { name: "The Orangery", kind: "museum", district: "Ashcombe Hall Gardens", desc: "Glass, palms and the smell of earth." },
    ],
    relations: [
      { profession: "Eldest child", relation: "Heir", motive: "Stands to inherit the estate." },
      { profession: "Younger child", relation: "Heir", motive: "Was cut out of the will last year." },
      { profession: "Second spouse", relation: "Spouse", motive: "The prenuptial agreement leaves them nothing." },
      { profession: "Family solicitor", relation: "Solicitor", motive: "Has been quietly mismanaging the trust." },
      { profession: "Butler", relation: "Household staff", motive: "Forty years of service, no pension." },
      { profession: "Nephew", relation: "Relative", motive: "Heavy gambling debts." },
      { profession: "Estate manager", relation: "Employee", motive: "About to be dismissed." },
      { profession: "Family doctor", relation: "Physician", motive: "Signed a dubious medical certificate." },
      { profession: "Old school friend", relation: "Guest", motive: "Owed a great deal of money." },
    ],
    access: { log: "Hall Key Book", registry: "Household Key Register", item: "the library key", device: "library door" },
    alibiBreak: { title: "Village Taxi Logbook", noun: "the village taxi driver's logbook" },
  },
  {
    id: "historical", label: "Historical mystery (1920s)", crime: "murder", period: "1920s", city: "Kingsport", date: "17 November 1926",
    titles: ["Death at the Orpheum", "The Silver Express", "Midnight at the Palais", "The Velvet Glove"],
    victimRoles: ["a theatre impresario", "a shipping magnate", "a jazz club owner", "a society photographer"],
    scene: { name: "The Impresario's Dressing Room", kind: "office", district: "The Orpheum Theatre", desc: "Greasepaint, telegrams and a gramophone still turning." },
    police: { name: "Kingsport Police Headquarters", kind: "police", district: "Harbour Street", desc: "Typewriters, cigar smoke and a sergeant with a magnificent moustache." },
    places: [
      { name: "Stage Door Office", kind: "security", district: "The Orpheum Theatre", desc: "The doorman's cubby: a key board, a signing-in book and a bottle he thinks nobody knows about." },
      { name: "The Blue Parrot Club", kind: "bar", district: "Wharf Street", desc: "A speakeasy behind a tailor's shop." },
      { name: "The Ritz-Kingsport Suite", kind: "hotel", district: "Kingsport Ritz", desc: "Velvet, crystal and a view of the harbour lights." },
      { name: "The Kingsport Clarion", kind: "newsroom", district: "Fleet Row", desc: "Clattering typewriters and a press that shakes the floor." },
      { name: "Boarding House on Pell Street", kind: "flat", district: "Pell Street", desc: "Cheap rooms, thin walls and a landlady who listens through them." },
      { name: "Galloway Mansion", kind: "manor", district: "Crescent Hill", desc: "A mansion built on shipping money." },
    ],
    relations: [
      { profession: "Leading lady", relation: "Star of the show", motive: "Her contract was about to be torn up." },
      { profession: "Business partner", relation: "Co-owner", motive: "Wanted full control of the theatre." },
      { profession: "Stage manager", relation: "Employee", motive: "Owed three months' wages." },
      { profession: "Bootlegger", relation: "Supplier", motive: "A deal had gone sour." },
      { profession: "Newspaper critic", relation: "Critic", motive: "Publicly humiliated by the victim." },
      { profession: "Wealthy widow", relation: "Investor", motive: "Lost her fortune in his last show." },
      { profession: "Piano player", relation: "Musician", motive: "Accused of theft by the victim." },
      { profession: "Chauffeur", relation: "Employee", motive: "Knew too many of the victim's secrets." },
      { profession: "Rival producer", relation: "Rival", motive: "Lost his theatre to the victim." },
    ],
    access: { log: "Stage Door Signing-In Book", registry: "Theatre Key Register", item: "the dressing-room key", device: "dressing-room door" },
    alibiBreak: { title: "Tram Conductor's Statement", noun: "the No. 3 tram conductor's statement" },
  },
];

export const FEMALE_FIRST = ["Ada", "Clara", "Elena", "Grace", "Iris", "Kara", "Maya", "Olive", "Rosa", "Tess", "Wren", "Zelda", "Bianca", "Delia", "Freya", "Hazel", "June", "Lena", "Nell", "Petra"];
export const MALE_FIRST = ["Ben", "Daniel", "Felix", "Hugo", "Jonah", "Leo", "Noah", "Pavel", "Silas", "Victor", "Yusuf", "Amos", "Conrad", "Emil", "Gideon", "Ivan", "Kit", "Milo", "Oscar", "Quinn"];
export const LAST = ["Ashdown", "Blake", "Carrow", "Dunmore", "Ellery", "Finch", "Garrow", "Hale", "Ingram", "Jessop", "Kerr", "Lowell", "Marsh", "Nash", "Orme", "Pryce", "Quill", "Rook", "Sable", "Thorne", "Underwood", "Vance", "Whitlock", "Yarrow", "Zane", "Abbott", "Brandt", "Crane", "Devereux", "Easton"];

export const PERSONALITIES = [
  "Charming and evasive; answers questions with jokes.", "Precise, cold and impatient.", "Nervous, talks too much when anxious.",
  "Proud and quick to take offence.", "Warm on the surface, guarded underneath.", "Blunt to the point of rudeness.",
  "Soft-spoken and watchful.", "Theatrical; everything is a performance.", "Weary and fatalistic.", "Ambitious, polished and calculating.",
];

/** Secrets that make innocent suspects lie for reasons other than the crime. */
export const SECRETS = [
  { claim: "at home alone all evening", truth: "meeting a lover in secret at {place}", clearTitle: "Witness at {place}", clearText: "Staff at {place} remember {name} arriving around {t1} and staying until well after {t2}, deep in conversation with someone who was not their spouse.", secretTitle: "Love Letter", secretText: "A letter in {name}'s handwriting: 'Same place, same time. Nobody can know. — {initials}'." },
  { claim: "working late at home", truth: "gambling at a back-room card game at {place}", clearTitle: "Card Game Ledger", clearText: "A ledger from the back room at {place}: '{initials} — buy-in {t1}, cashed out (badly) {t2}.'", secretTitle: "IOU Note", secretText: "An IOU signed by {name} for a sum they could never repay." },
  { claim: "asleep early with a migraine", truth: "secretly interviewing for a job with a rival at {place}", clearTitle: "Meeting Confirmation", clearText: "A confirmation note for a confidential meeting at {place} from {t1} to {t2}, addressed to {name}.", secretTitle: "Offer Letter", secretText: "A draft job offer from a rival employer addressed to {name}, marked 'strictly confidential'." },
  { claim: "out for a long walk, alone", truth: "visiting a pawnbroker and drinking away the proceeds at {place}", clearTitle: "Pawn Ticket & Bar Tab", clearText: "A pawn ticket in {name}'s name and a bar tab from {place}, open from {t1} to {t2}.", secretTitle: "Pawned Heirloom", secretText: "A family heirloom {name} swore they still had, listed in a pawnbroker's window." },
  { claim: "reading in their room", truth: "meeting a journalist at {place} to sell gossip", clearTitle: "Journalist's Notebook Page", clearText: "A notebook page: 'Met {initials} at {place}, {t1}–{t2}. Paid for the story.'", secretTitle: "Cash Envelope", secretText: "An envelope of cash with a newspaper's compliments slip, found among {name}'s things." },
  { claim: "at the cinema, alone", truth: "attending a support meeting for a drinking problem at {place}", clearTitle: "Meeting Sign-In Sheet", clearText: "A sign-in sheet from a closed meeting at {place}, {t1}–{t2}. {name}'s first name is on it.", secretTitle: "Chip and Pamphlet", secretText: "A thirty-day sobriety chip and a pamphlet, tucked away where nobody would look." },
  { claim: "doing paperwork in the office", truth: "smuggling a few cases of contraband out through {place}", clearTitle: "Delivery Docket", clearText: "A delivery docket signed by {name} at {place}, time-stamped {t1}, with a second signature at {t2}.", secretTitle: "Unlabelled Crates", secretText: "Crates with the labels scraped off, stored under {name}'s name." },
];

export const METHODS = {
  murder: [
    { id: "x_blunt", label: "Struck the victim with a heavy brass candlestick", weapon: "Brass Candlestick", weaponText: "A heavy brass candlestick lying under the desk, wiped but dented at the base.", forensic: "A single blow to the head with a heavy, rounded object. Brass particles in the wound match the candlestick." },
    { id: "x_poison", label: "Poisoned the victim's drink", weapon: "Teacup with Residue", weaponText: "A teacup with a bitter-smelling residue in the bottom.", forensic: "Toxicology confirms a lethal dose of digitalis, consistent with the residue in the teacup." },
    { id: "x_strangle", label: "Strangled the victim with a silk cord", weapon: "Silk Curtain Cord", weaponText: "A silk curtain tie-back missing from the window, found stuffed behind a cushion.", forensic: "Ligature marks consistent with a braided silk cord. Fibres in the marks match the curtain tie-back." },
    { id: "x_push", label: "Pushed the victim down the stairs", weapon: "Torn Banister Ribbon", weaponText: "A ribbon of torn fabric snagged on the banister above the landing.", forensic: "Injuries consistent with a fall, but bruising on the upper arms shows the victim was gripped and shoved." },
  ],
  theft: [
    { id: "x_key", label: "Entered with a borrowed pass and removed it by hand", weapon: "Cut Security Tag", weaponText: "A security tag sliced cleanly with a craft blade, left behind the display stand.", forensic: "The tag was cut, not forced. Whoever did it had time and knew exactly where the sensor sat." },
    { id: "x_swap", label: "Swapped it for a forgery weeks ago", weapon: "Forgery Offcut", weaponText: "A scrap of aged canvas — modern linen, artificially yellowed.", forensic: "The 'original' left behind is a forgery: modern pigments under an aged varnish." },
    { id: "x_alarm", label: "Disabled the alarm and broke the case", weapon: "Broken Case Glass", weaponText: "Shards of laminated glass, scored before they were struck.", forensic: "The case was scored and broken after the alarm circuit had been bypassed." },
    { id: "x_copy", label: "Copied the data onto a hidden drive", weapon: "Discarded Drive Casing", weaponText: "The plastic casing of a USB drive, snapped open, under a desk.", forensic: "System logs show a 41 GB copy to an unregistered USB device." },
  ],
  disappearance: [
    { id: "x_lure", label: "Lured the victim away with a forged message", weapon: "Forged Note", weaponText: "A note asking the victim to come at once, in handwriting that isn't quite right.", forensic: "Handwriting analysis: the note is a careful imitation, written with the opposite hand." },
    { id: "x_drug", label: "Drugged the victim and moved them", weapon: "Medicine Bottle", weaponText: "An empty bottle of strong sleeping draught with the label torn off.", forensic: "Traces of a strong sedative in a glass from the scene." },
    { id: "x_force", label: "Forced the victim out after a struggle", weapon: "Broken Watch Strap", weaponText: "A snapped watch strap behind the door.", forensic: "Signs of a short struggle by the door: scuffs, a strap torn from a wrist." },
    { id: "x_vehicle", label: "Drove the victim away in a borrowed car", weapon: "Car Park Token", weaponText: "A car park token on the floor, dated last night.", forensic: "Mud on the carpet matches the riverside road, not the street outside." },
  ],
};

/** Culprit motives, each with two documents that together reveal it. */
export const MOTIVES = {
  murder: [
    { id: "m_will", label: "Inheritance: the victim was about to change the will", doc1: ["Draft of a New Will", "An unsigned new will, dated last week, that cuts {name} out entirely."], doc2: ["Letter from the Solicitor", "'As instructed, the new will is ready for signature on Monday. I have not informed {name}.'"] },
    { id: "m_blackmail", label: "Blackmail: the victim was extorting the killer", doc1: ["Blackmail Note", "'Same amount, same day, or everyone learns what you did. — V.' Found in the victim's desk, addressed to {name}."], doc2: ["Bank Withdrawals", "Bank statements showing {name} withdrawing the same large sum every month for a year."] },
    { id: "m_exposure", label: "Exposure: the victim had discovered the killer's fraud", doc1: ["Victim's Private Notes", "'{initials} has been forging the accounts. Confront them tonight, then the police.'"], doc2: ["Forged Ledger Page", "A ledger page with entries in {name}'s handwriting that don't match the bank's records."] },
    { id: "m_revenge", label: "Revenge for an old betrayal", doc1: ["Old Newspaper Clipping", "A twenty-year-old clipping about a ruined family business — the family name is {name}'s."], doc2: ["Unsent Letter", "'You took everything from my father. I haven't forgotten.' Signed {initials}."] },
  ],
  theft: [
    { id: "m_debt", label: "Debt: the thief owed money to dangerous people", doc1: ["Threatening Letter", "'Last warning. Pay by the 15th.' Addressed to {name}."], doc2: ["Buyer's Offer", "A note from a private buyer offering a fortune 'for the item we discussed', addressed to {initials}."] },
    { id: "m_grudge", label: "A grudge: the thief felt cheated by the owners", doc1: ["Grievance Letter", "A formal complaint from {name}: 'I was promised credit and I was ignored.'"], doc2: ["Rejected Appeal", "A reply rejecting {name}'s appeal, signed by the board."] },
    { id: "m_rival", label: "Paid by a rival to steal it", doc1: ["Rival's Payment Record", "A transfer from a shell company linked to a rival, received by {name}."], doc2: ["Burner Phone Messages", "'Delivery Friday. Usual place.' Saved under the contact '{initials}'."] },
  ],
  disappearance: [
    { id: "m_silence", label: "To silence the victim, who had uncovered the culprit's crime", doc1: ["Victim's Diary Entry", "'I know what {initials} did. Tomorrow I tell everyone.'"], doc2: ["Hidden Documents", "Proof of {name}'s embezzlement, hidden in a place only they could reach."] },
    { id: "m_obsession", label: "Obsession: the culprit could not let the victim go", doc1: ["Stack of Unsent Letters", "Dozens of unsent letters from {name} to the victim."], doc2: ["Photographs", "Photographs of the victim taken from a distance, over months, found among {name}'s things."] },
    { id: "m_money", label: "Money: the culprit stood to profit from the victim's absence", doc1: ["Insurance Policy", "A policy on the victim's life naming {name} as beneficiary."], doc2: ["Signed Power of Attorney", "A power-of-attorney form giving {name} control of the victim's accounts."] },
  ],
};

export const SKIN = ["#e2c2a8", "#d8b8a0", "#c9a284", "#b8896a", "#8d5f45", "#6b4532", "#f0d2bc"];
export const HAIRC = ["#1f1814", "#3d2a1f", "#5b412e", "#8d8780", "#a07a4a", "#2c2018", "#c9b48a"];
export const HAIRS: PortraitSpec["hair"][] = ["bob", "short", "slick", "long", "bun", "messy", "receding", "wavy", "bald"];
export const OUTFITS: PortraitSpec["outfit"][] = ["suit", "turtleneck", "blouse", "coat", "jacket", "dress", "sweater", "uniform"];
export const OUTFITC = ["#1b2433", "#2a2c33", "#4a3a2c", "#151519", "#3a2a22", "#20242c", "#cfc6b8", "#5a1e22"];
