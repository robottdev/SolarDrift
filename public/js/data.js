export const TITLE = "SOLAR DRIFT";
export const EPISODE = "Episode I · The Breakout";

export const MISSIONS = [
  {
    id: "contact",
    title: "Ghost Contact",
    brief: "Hold position. A cloaked ship is due to uncloak. Hail it with C when it appears.",
    targetId: "kade",
  },
  {
    id: "scanner",
    title: "Echo Wreck",
    brief: "Plot a course to the derelict at -240, 40. Scan it, then transport the Echo Scanner.",
    targetId: "derelict",
  },
  {
    id: "report",
    title: "Contract",
    brief: "Return to Helios Station (-90, 70). Hail Governor Hale and accept the contract.",
    targetId: "helios-station",
  },
  {
    id: "convoy",
    title: "Intercept",
    brief: "Stop the smuggler convoy near the Trade Hub (160, -110). Destroy or drive them off.",
    targetId: "trade-hub",
  },
  {
    id: "hyper",
    title: "Payment",
    brief: "Return to Helios Station and collect the Hyperdrive Core.",
    targetId: "helios-station",
  },
  {
    id: "lira",
    title: "Dark Moon",
    brief: "Dump power into ENGINES, set hyperdrive throttle, clear nav hazards, then jump to Lira's Moon (-920, 780).",
    targetId: "lira-moon",
  },
  {
    id: "rescue",
    title: "Supply Line",
    brief: "Defend the Supply Depot (-1480, 1080) and the colony beyond it. Hail the depot when the sky is clear.",
    targetId: "depot",
  },
  {
    id: "crystals",
    title: "Flux Lift",
    brief: "Transport the Flux Crystals from the depot, then report back to Helios Station.",
    targetId: "helios-station",
  },
  {
    id: "voidseed",
    title: "The Package",
    brief: "Governor Hale will load Voidseed. Listen to Lira's incoming hail before you jump.",
    targetId: "helios-station",
  },
  {
    id: "eject",
    title: "Do Not Carry It In",
    brief: "Jump to the Vortex Gate (2180, 420). Transport / eject Voidseed into the gate BEFORE you enter.",
    targetId: "vortex",
  },
  {
    id: "gate",
    title: "The Breakout",
    brief: "With Voidseed ejected, fly into the vortex.",
    targetId: "vortex",
  },
  {
    id: "done",
    title: "Beyond the Cage",
    brief: "The inner system is behind you. Episode I is complete.",
    targetId: null,
  },
];

export const PLANETS = [
  {
    id: "helios-star",
    name: "Helios",
    kind: "star",
    x: 220,
    y: 160,
    radius: 44,
    color: "#ffb347",
    color2: "#ff5a1f",
    scan: "Primary of the cage. Fusion output is normal. Government nav buoys ring the photosphere.",
    hailable: false,
  },
  {
    id: "helios-station",
    name: "Helios Station",
    kind: "station",
    x: -90,
    y: 70,
    radius: 36,
    color: "#7ec8ff",
    color2: "#1b4b8a",
    scan: "Seat of the Solar Authority. Shipyards, courts, and a very polite prison.",
    hailable: true,
    comms: "hale",
  },
  {
    id: "start-moon",
    name: "Slip Moon",
    kind: "moon",
    x: 12,
    y: -8,
    radius: 18,
    color: "#c9d2e3",
    color2: "#5a6578",
    scan: "Your usual parking orbit. Thin ice, thinner law.",
    hailable: false,
  },
  {
    id: "derelict",
    name: "Echo Wreck",
    kind: "wreck",
    x: -240,
    y: 40,
    radius: 22,
    color: "#8d7a6a",
    color2: "#3a2c24",
    scan: "Civilian survey hull, transponder dark. Cargo clamps still have power. Something aboard is singing on subspace.",
    hailable: true,
    comms: "wreck",
    cargo: "scanner",
  },
  {
    id: "trade-hub",
    name: "Trade Hub Vela",
    kind: "station",
    x: 160,
    y: -110,
    radius: 28,
    color: "#9dffb0",
    color2: "#1f5a38",
    scan: "Independent dock. Officially neutral. Unofficially for sale.",
    hailable: true,
    comms: "vela",
  },
  {
    id: "gas",
    name: "Cinderwell",
    kind: "gas",
    x: 260,
    y: 180,
    radius: 54,
    color: "#d48cff",
    color2: "#4b1d73",
    scan: "Banded gas giant. Storm cells hide smugglers and, occasionally, truth.",
    hailable: false,
  },
  {
    id: "lira-moon",
    name: "Lira's Moon",
    kind: "moon",
    x: -920,
    y: 780,
    radius: 32,
    color: "#f2d48b",
    color2: "#7a5a20",
    scan: "Unregistered colony. Thermal plumes from underground labs. Someone has been building a star-drive in secret for ten years.",
    hailable: true,
    comms: "lira",
  },
  {
    id: "depot",
    name: "Supply Depot 9",
    kind: "station",
    x: -1480,
    y: 1080,
    radius: 26,
    color: "#ffd36b",
    color2: "#6a4a12",
    scan: "Outer-reach cache. Crystals, spares, and people who would rather not exist on a census.",
    hailable: true,
    comms: "depot",
    cargo: "crystals",
  },
  {
    id: "colony",
    name: "Rescue Colony",
    kind: "world",
    x: -1540,
    y: 1140,
    radius: 30,
    color: "#7dffd2",
    color2: "#165a4a",
    scan: "Refugee habitats clinging to a frozen world. Life signs: frightened, numerous, still there.",
    hailable: true,
    comms: "colony",
  },
  {
    id: "vortex",
    name: "Vortex Gate",
    kind: "gate",
    x: 2180,
    y: 420,
    radius: 48,
    color: "#5cffc8",
    color2: "#082a2a",
    scan: "Not a natural phenomenon. A lock. The cage wall is thinnest here. Do not carry Voidseed through it.",
    hailable: true,
    comms: "vortex",
  },
];

export const ITEMS = {
  scanner: {
    id: "scanner",
    name: "Echo Scanner",
    desc: "Boosts sensor interpretation. Distant ships no longer hide in planet glare.",
  },
  hyperdrive: {
    id: "hyperdrive",
    name: "Hyperdrive Core",
    desc: "Restricted hardware. Enables F10 / H jumps. Engine allocation caps your throttle.",
  },
  crystals: {
    id: "crystals",
    name: "Flux Crystals",
    desc: "Reactor feed. Increases output and refills jump fuel.",
  },
  siphon: {
    id: "siphon",
    name: "Energy Siphon",
    desc: "Salvages flux from destroyed hulls.",
  },
  voidseed: {
    id: "voidseed",
    name: "Voidseed",
    desc: "Unstable exotic matter. Will rupture the gate — and you — if you fly through with it aboard.",
  },
};

export const DIALOGUE = {
  kade: {
    speaker: "Kade Voss",
    portrait: "#c45cff",
    lines: [
      {
        text: "Easy, Vale. Cloak dropping. I'm Kade. I fence rumors the Authority would rather stay rumors.",
        choices: [
          { label: "You're late.", next: 1 },
          { label: "Talk. Fast.", next: 1 },
        ],
      },
      {
        text: "Hale hired you to hunt a hyperdrive cell. Cute. There's a wreck at minus two-forty, plus forty — Echo-class. Scanner still in the hold. Steal it before his patrols do. Then go smile at the Governor. And Vale? Don't trust the contract.",
        choices: [
          { label: "Why help me?", next: 2 },
          { label: "Coordinates logged.", next: 2 },
        ],
      },
      {
        text: "Because the cage isn't weather. It's policy. I'll be in the dark when you need a second opinion. Hail me if you live.",
        choices: [{ label: "Copy.", next: null, flag: "talkedKade" }],
      },
    ],
  },
  wreck: {
    speaker: "Echo Wreck · Auto",
    portrait: "#8d7a6a",
    lines: [
      {
        text: "BLACKBOX // last entry: they found the lab. Hide the scanner. If a hunter finds this — the moon at minus nine-twenty is not empty. Tell Lira I tried.",
        choices: [{ label: "Download and crack the hold.", next: null, flag: "readWreck" }],
      },
    ],
  },
  hale: {
    speaker: "Governor Soren Hale",
    portrait: "#7ec8ff",
    lines: [
      {
        text: "Bounty hunter Vale. Punctual. The Solar Authority has a hygiene problem: a cell of physicists building a star-drive. Hyperdrive research is forbidden. You will intercept their convoy off Vela Hub and bring me proof.",
        require: "hasScanner",
        failText: "Come back when you have working sensors, Vale. I don't brief blind mercenaries.",
        choices: [
          { label: "What's the pay?", next: 1 },
          { label: "Consider it done.", next: 1 },
        ],
      },
      {
        text: "A Hyperdrive Core — confiscated, licensed to you under kill-authority. Don't get poetic about it. The law is the hull of this system. Dismissed.",
        choices: [{ label: "I'll be in touch.", next: null, flag: "reportedIn" }],
      },
      {
        text: "The convoy is slag. Good. The Core is yours. Dump everything you have into engines when you jump — amateurs stall and burn. There is a moon the cell used. Clean it.",
        require: "convoyCleared",
        failText: "The convoy is still flying, Vale. I can see their transponders from here.",
        choices: [{ label: "Core accepted.", next: null, flag: "hasHyperdrive", give: "hyperdrive" }],
      },
      {
        text: "You found their cache. Excellent. One last errand. We loaded Voidseed into your hold — exotic matter. Dump it into the Vortex Gate at two-one-eight-zero, four-twenty. It will cauterize their rat-hole.",
        require: "hasCrystals",
        failText: "Bring me the crystals from Depot 9. Then we talk finales.",
        choices: [{ label: "Loaded. Plotting the gate.", next: null, flag: "hasVoidseed", give: "voidseed" }],
      },
    ],
  },
  vela: {
    speaker: "Dockmaster Rill",
    portrait: "#9dffb0",
    lines: [
      {
        text: "Vela Hub. We didn't see a convoy. We definitely didn't sell them fuel. If you're going to make a mess, make it outside the buoy line.",
        choices: [{ label: "Noted.", next: null }],
      },
    ],
  },
  lira: {
    speaker: "Dr. Lira Chen",
    portrait: "#f2d48b",
    lines: [
      {
        text: "You're Hale's hunter. I should close the blast doors. I'm Lira Chen. We didn't build a weapon. We built a way out. This system is inside a force cage — and Hale knows.",
        require: "hasHyperdrive",
        failText: "You're not cleared for this orbit. Come back with a real drive.",
        choices: [
          { label: "That's a hell of an accusation.", next: 1 },
          { label: "Then why the smugglers?", next: 1 },
        ],
      },
      {
        text: "Because people still have to eat while they invent miracles. Authority gunships are hitting Depot 9 and the colony behind it. Help them. Bring the Flux Crystals back — not to Hale, to your reactor. Then you'll have the range to see the cage wall.",
        choices: [{ label: "I'll get them out.", next: null, flag: "talkedLira" }],
      },
      {
        text: "Vale — if you can hear this, abort. Hale's Voidseed isn't a cauterizer. It's a detonator keyed to the gate geometry. Transport it into the vortex first. Then fly through empty. There's someone on the other side who isn't a Warden.",
        require: "hasVoidseed",
        failText: "Get the crystals. Then we talk about the wall.",
        choices: [{ label: "Eject first. Then jump.", next: null, flag: "warnedLira" }],
      },
    ],
  },
  depot: {
    speaker: "Depot 9 · Caretaker",
    portrait: "#ffd36b",
    lines: [
      {
        text: "You cleared the sky. Take the crystals. The colony is still breathing. Tell Lira we held.",
        require: "rescuedColony",
        failText: "Guns in the black! I am not opening the bay while those wolves are up there!",
        choices: [{ label: "Crystals aboard.", next: null, flag: "hasCrystals", give: "crystals" }],
      },
    ],
  },
  colony: {
    speaker: "Colony Comm",
    portrait: "#7dffd2",
    lines: [
      {
        text: "Whoever you are — the gunships folded. We have children in the ice bunkers. Thank you. Lira said a hunter might come. I didn't believe her.",
        choices: [{ label: "Stay dark. I'll finish this.", next: null, flag: "rescuedColony" }],
      },
    ],
  },
  vortex: {
    speaker: "Gate Substrate",
    portrait: "#5cffc8",
    lines: [
      {
        text: "GEOMETRY LOCK. Exotic mass detected in visiting hull. Passage with that mass will unmake both sides of the door.",
        requireNotEjected: true,
        choices: [{ label: "Transport Voidseed into the aperture.", next: null, eject: true }],
      },
      {
        text: "LOCK CLEAR. The door will take a ship. Only a ship.",
        requireEjected: true,
        choices: [{ label: "Understood.", next: null }],
      },
    ],
  },
  nyx: {
    speaker: "Nyx",
    portrait: "#5cff9a",
    lines: [
      {
        text: "You came through clean. I am Nyx. The Wardens keep species in bottles and push them toward war so the data is interesting. Hale is their clerk. You just stole a sample.",
        choices: [
          { label: "Then we break the bottles.", next: 1 },
          { label: "I'm a bounty hunter, not a prophet.", next: 1 },
        ],
      },
      {
        text: "Either works. There are more locks. There is a Controller. Episode I ends here, Vale. When you are ready, we hunt Wardens. Welcome to the dark between cages.",
        choices: [{ label: "Log the starfix. End transmission.", next: null, flag: "enteredGate" }],
      },
    ],
  },
};

export const INTRO = [
  "Humans of Helios live a million lights from Earth, inside a sky that does not open.",
  "The Solar Authority forbids hyperdrive. Research is seized. Researchers vanish.",
  "You are Ryn Vale — bounty hunter, last honest contractor on a dishonest payroll.",
  "Governor Hale wants a cell of physicists burned out of the black.",
  "Someone else wants you to look closer.",
];
