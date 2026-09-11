export const TITLE = "SOLAR DRIFT";
export const EPISODE = "Episode I · The Setup";
export const CALLSIGN = "SCOTT · PIP";

export const MISSIONS = [
  {
    id: "contact",
    title: "The Invoice",
    brief: "PIP clocked a cloaked transponder. Hail it with C. If it's Rex, be unkind.",
    targetId: "kade",
  },
  {
    id: "scanner",
    title: "Dead Lark",
    brief: "The Lark's listening dish is still on that wreck at -240, 40. Scan it, then transport the dish.",
    targetId: "derelict",
  },
  {
    id: "report",
    title: "Yard Favor",
    brief: "Bolt's Yard (-90, 70). Auntie Bolt fixes ships. She also collects favors. Hail her.",
    targetId: "helios-station",
  },
  {
    id: "convoy",
    title: "Gutter Dogs",
    brief: "The Dogs who jumped you are fencing your parts near Nix Pawn (160, -110). Ruin their day.",
    targetId: "trade-hub",
  },
  {
    id: "hyper",
    title: "A Real Core",
    brief: "Back to Bolt's Yard. She promised a Hyperdrive Core if the Dogs stopped breathing her air.",
    targetId: "helios-station",
  },
  {
    id: "lira",
    title: "The Heap",
    brief: "Maeve on the Heap (-920, 780) can seat a core without inventing new fire. Fat engines, clear sky, then jump.",
    targetId: "lira-moon",
  },
  {
    id: "rescue",
    title: "Repo Weather",
    brief: "Repo gunships are shaking down Wrench Camp (-1480, 1080). Save Maeve's people, then hail the camp.",
    targetId: "depot",
  },
  {
    id: "crystals",
    title: "Reactor Candy",
    brief: "Transport the Flux Spares from the camp, then tell Bolt you're leaving her scenic junkyard.",
    targetId: "helios-station",
  },
  {
    id: "voidseed",
    title: "Jump Juice",
    brief: "Bolt loaded a canister she called fuel. PIP is already drafting a complaint. Wait for Maeve's hail.",
    targetId: "helios-station",
  },
  {
    id: "eject",
    title: "Do Not Drink It",
    brief: "Old Jump Ring (2180, 420). Transport the juice into the ring FIRST. Then fly through empty.",
    targetId: "vortex",
  },
  {
    id: "gate",
    title: "On-Ramp",
    brief: "Juice dumped. Fly into the ring. The galaxy is that way. Probably.",
    targetId: "vortex",
  },
  {
    id: "done",
    title: "Explorers Again",
    brief: "Hull patched, core humming, PIP still complaining. You may resume exploring.",
    targetId: null,
  },
];

export const PLANETS = [
  {
    id: "helios-star",
    name: "Gutterstar",
    kind: "star",
    x: 220,
    y: 160,
    radius: 26,
    color: "#ffb347",
    color2: "#ff5a1f",
    scan: "A tired sun in a junk system. Nav buoys sold for scrap. Fusion still works, unlike your reputation.",
    hailable: false,
  },
  {
    id: "helios-station",
    name: "Bolt's Yard",
    kind: "station",
    x: -90,
    y: 70,
    radius: 16,
    color: "#7ec8ff",
    color2: "#1b4b8a",
    scan: "Auntie Bolt's chop-shop. Ships go in broken and come out differently broken, on purpose.",
    hailable: true,
    comms: "hale",
  },
  {
    id: "start-moon",
    name: "Parking Rock",
    kind: "moon",
    x: 70,
    y: 55,
    radius: 8,
    color: "#c9d2e3",
    color2: "#5a6578",
    scan: "Your current address. Ice, craters, and one (1) self-proclaimed captain.",
    hailable: false,
  },
  {
    id: "derelict",
    name: "Dead Lark",
    kind: "wreck",
    x: -240,
    y: 40,
    radius: 12,
    color: "#8d7a6a",
    color2: "#3a2c24",
    scan: "Courier hull, transponder dark. The listening dish still has power. Someone's blackbox is being dramatic.",
    hailable: true,
    comms: "wreck",
    cargo: "scanner",
  },
  {
    id: "trade-hub",
    name: "Nix Pawn",
    kind: "station",
    x: 160,
    y: -110,
    radius: 14,
    color: "#9dffb0",
    color2: "#1f5a38",
    scan: "Independent dock. Officially a pawn ring. Unofficially still a pawn ring.",
    hailable: true,
    comms: "vela",
  },
  {
    id: "gas",
    name: "Bruise",
    kind: "gas",
    x: 260,
    y: 180,
    radius: 22,
    color: "#d48cff",
    color2: "#4b1d73",
    scan: "Banded gas giant. Storm cells hide smugglers, invoices, and at least one of Rex's alibis.",
    hailable: false,
  },
  {
    id: "lira-moon",
    name: "Maeve's Heap",
    kind: "moon",
    x: -920,
    y: 780,
    radius: 14,
    color: "#f2d48b",
    color2: "#7a5a20",
    scan: "Unregistered wrench-moon. Thermal plumes from a garage that could seat a star-drive if you ask nicely.",
    hailable: true,
    comms: "lira",
  },
  {
    id: "depot",
    name: "Wrench Camp",
    kind: "station",
    x: -1480,
    y: 1080,
    radius: 12,
    color: "#ffd36b",
    color2: "#6a4a12",
    scan: "Outer-reach cache. Flux spares, soup, and people who would rather not exist on a collections list.",
    hailable: true,
    comms: "depot",
    cargo: "crystals",
  },
  {
    id: "colony",
    name: "Ice Cousins",
    kind: "world",
    x: -1540,
    y: 1140,
    radius: 14,
    color: "#7dffd2",
    color2: "#165a4a",
    scan: "Habitats clinging to a frozen rock. Life signs: annoyed, numerous, still there.",
    hailable: true,
    comms: "colony",
  },
  {
    id: "vortex",
    name: "Old Jump Ring",
    kind: "gate",
    x: 2180,
    y: 420,
    radius: 20,
    color: "#5cffc8",
    color2: "#082a2a",
    scan: "Abandoned galactic on-ramp. It will take a ship. It will not take a ship full of bootleg jump juice.",
    hailable: true,
    comms: "vortex",
  },
];

export const ITEMS = {
  scanner: {
    id: "scanner",
    name: "Listening Dish",
    desc: "A real sensor array. Distant ships stop hiding in planet glare. PIP can finally stop squinting.",
  },
  hyperdrive: {
    id: "hyperdrive",
    name: "Hyperdrive Core",
    desc: "The part Rex's friends stole. Enables F10 / H jumps. Engine allocation caps your throttle.",
  },
  crystals: {
    id: "crystals",
    name: "Flux Spares",
    desc: "Reactor candy. Increases output and refills jump fuel. Not actually candy. PIP checked.",
  },
  siphon: {
    id: "siphon",
    name: "Siphon Hose",
    desc: "Salvages flux from destroyed hulls. Rude. Effective.",
  },
  voidseed: {
    id: "voidseed",
    name: "Jump Juice",
    desc: "Bootleg exotic fuel. Will rupture the ring — and you — if you fly through with it aboard.",
  },
};

export const DIALOGUE = {
  kade: {
    speaker: "Rex 'Honest' Gantry",
    portrait: "#c45cff",
    lines: [
      {
        text: "Scott! You're alive! That's— look, when I sold your heading I assumed you'd dodge. You're always dodging.",
        choices: [
          { label: "You sold us?", next: 1 },
          { label: "PIP, warm the airlock.", next: 1 },
        ],
      },
      {
        text: "In my defense they paid up front. Also I spelled Captain with a K so it barely counts. There's a wrecked courier — Dead Lark — dish still warm at minus two-forty, plus forty. Bolt's Yard will trade a core if you look useful. I am leaving before PIP finishes that sentence.",
        choices: [
          { label: "Give me a reason not to shoot.", next: 2 },
          { label: "Coordinates. Then disappear.", next: 2 },
        ],
      },
      {
        text: "Because I still know who has your jump core, and because your AI is already writing my obituary in Comic Sans. Hail me never. Good luck. Mean that.",
        choices: [{ label: "We're even when the ship flies.", next: null, flag: "talkedKade" }],
      },
    ],
  },
  wreck: {
    speaker: "Dead Lark · Blackbox",
    portrait: "#8d7a6a",
    lines: [
      {
        text: "BLACKBOX // last entry: Gantry said it was a milk run. It was not a milk run. Hide the dish. If a captain finds this — the Heap at minus nine-twenty still has a mechanic who isn't a crook. Tell Maeve I tried. Also tell her the soup was bad.",
        choices: [{ label: "Download. Crack the hold.", next: null, flag: "readWreck" }],
      },
    ],
  },
  hale: {
    speaker: "Auntie Bolt",
    portrait: "#7ec8ff",
    lines: [
      {
        text: "Self-proclaimed Captain Scott. Cute hat energy, no hat. Your drive is a rumor and your dish is a bowl. The Gutter Dogs are fencing parts off Nix Pawn. Bring me proof they stopped, and I'll bolt a real core to that toy.",
        require: "hasScanner",
        failText: "Come back when you can see my station, sweetheart. I'm not briefing a man with a soup bowl for a sensor.",
        choices: [
          { label: "What's in it for us?", next: 1 },
          { label: "Dogs. Right. PIP, plot it.", next: 1 },
        ],
      },
      {
        text: "A Hyperdrive Core — confiscated, licensed, don't get poetic. Dump everything into engines when you jump or you'll stall and I'll pretend we never met. Dismissed.",
        choices: [{ label: "We'll be useful.", next: null, flag: "reportedIn" }],
      },
      {
        text: "Dogs are scrap. Good. Core's yours. Clear the sky, fatten ENGINES, then go see Maeve on the Heap. She seats drives that stay seated. I just hit them with a wrench until they feel shame.",
        require: "convoyCleared",
        failText: "The Dogs are still flying, Captain. I can see their transponders from here. Try shooting them. It's fashionable.",
        choices: [{ label: "Core accepted. Try not to miss us.", next: null, flag: "hasHyperdrive", give: "hyperdrive" }],
      },
      {
        text: "You found their cache. Excellent. One for the road: jump juice. Very exclusive. Pour it into the Old Jump Ring at two-one-eight-zero, four-twenty and the lane opens. Don't ask why I want it off my dock.",
        require: "hasCrystals",
        failText: "Bring me the Flux Spares from Wrench Camp. Then we talk finales and farewells.",
        choices: [{ label: "Loaded. PIP is already frowning.", next: null, flag: "hasVoidseed", give: "voidseed" }],
      },
    ],
  },
  vela: {
    speaker: "Dockmaster Fizz",
    portrait: "#9dffb0",
    lines: [
      {
        text: "Nix Pawn. We didn't see a convoy. We definitely didn't buy your bumper. If you're going to make a mess, make it outside the buoy line. I just mopped.",
        choices: [{ label: "Noted. Sorry about the mop.", next: null }],
      },
    ],
  },
  lira: {
    speaker: "Maeve Quill",
    portrait: "#f2d48b",
    lines: [
      {
        text: "You're the idiot who bought a job from Gantry. I'm Maeve. I seat drives. I do not seat egos. Repo gunships are shaking Wrench Camp and the Ice Cousins behind it. Help them. Take the Flux Spares for YOUR reactor — not Bolt's. Then maybe you'll make the on-ramp.",
        require: "hasHyperdrive",
        failText: "You're not cleared for this orbit. Come back with a real drive, Captain Probably.",
        choices: [
          { label: "That's a lot of yelling.", next: 1 },
          { label: "Then why the Dogs?", next: 1 },
        ],
      },
      {
        text: "Because parts still cost money while you invent a personality. Clear the sky. Don't die. I hate filling out the forms.",
        choices: [{ label: "We'll get them out.", next: null, flag: "talkedLira" }],
      },
      {
        text: "SCOTT. If you can hear this, abort. Bolt's juice is not fuel. It's a bomb with a shipping label. Transport it into the ring first. Then fly through empty. PIP already agrees, and I don't even like PIP.",
        require: "hasVoidseed",
        failText: "Get the spares. Then we talk about the on-ramp.",
        choices: [{ label: "Eject first. Then jump.", next: null, flag: "warnedLira" }],
      },
    ],
  },
  depot: {
    speaker: "Wrench Camp · Caretaker",
    portrait: "#ffd36b",
    lines: [
      {
        text: "You cleared the sky. Take the spares. The Cousins are still breathing. Tell Maeve we held. Tell your AI the soup is still bad.",
        require: "rescuedColony",
        failText: "Guns in the black! I am not opening the bay while those wolves are up there!",
        choices: [{ label: "Spares aboard. Thank you.", next: null, flag: "hasCrystals", give: "crystals" }],
      },
    ],
  },
  colony: {
    speaker: "Ice Cousins Comm",
    portrait: "#7dffd2",
    lines: [
      {
        text: "Whoever you are — the gunships folded. We have kids in the ice bunkers. Maeve said a captain might come. She did not say self-proclaimed. We'll take it.",
        choices: [{ label: "Stay dark. We'll finish this.", next: null, flag: "rescuedColony" }],
      },
    ],
  },
  vortex: {
    speaker: "Ring Substrate",
    portrait: "#5cffc8",
    lines: [
      {
        text: "GEOMETRY LOCK. Exotic mass detected in visiting hull. Passage with that mass will unmake both sides of the door. Also it will unmake you, which your AI rates as 'predictable.'",
        requireNotEjected: true,
        choices: [{ label: "Transport the juice into the aperture.", next: null, eject: true }],
      },
      {
        text: "LOCK CLEAR. The door will take a ship. Only a ship. Try to look official.",
        requireEjected: true,
        choices: [{ label: "Copy. Looking official.", next: null }],
      },
    ],
  },
  nyx: {
    speaker: "PIP",
    portrait: "#5ce1ff",
    lines: [
      {
        text: "We're through. That's a galaxy, Captain. I have starfixes, a working core, and a list of people we are never doing salvage jobs for. Rex is on it. Twice.",
        choices: [
          { label: "Then we go exploring.", next: 1 },
          { label: "I'm a captain, not a tourist.", next: 1 },
        ],
      },
      {
        text: "Either works. There are more lanes. There is more trouble. Episode I ends here, Scott. When you are ready, we pick a heading that isn't on fire. Welcome back to the dark between jobs.",
        choices: [{ label: "Log the starfix. Mean it this time.", next: null, flag: "enteredGate" }],
      },
    ],
  },
  pip: {
    speaker: "PIP",
    portrait: "#5ce1ff",
    lines: [
      {
        text: "Status: we are a conversation with engines. Hail the decloaked liar, Captain. I would like to yell at a person.",
        choices: [
          { label: "Copy, PIP.", next: null },
          { label: "I am considering a nap.", next: null },
        ],
      },
      {
        text: "The Dead Lark still has a dish. Ours is decorative. Transport it before Scott tries to 'jury-rig' anything with hope.",
        choices: [{ label: "Hope is a tool.", next: null }],
      },
      {
        text: "Auntie Bolt will help us. In the same way a blender helps fruit. Be charming. I will be the opposite, as a treat.",
        choices: [{ label: "You're my favorite mutiny.", next: null }],
      },
      {
        text: "Gutter Dogs at Nix Pawn. These are the professionals who jumped a self-proclaimed captain. The bar was on the floor and they still tripped.",
        choices: [{ label: "Let's trip them back.", next: null }],
      },
      {
        text: "Collect the core. Then we jump. Then I recalibrate your title from 'Captain' to 'Captain, provisionally.'",
        choices: [{ label: "I'll take it.", next: null }],
      },
      {
        text: "Maeve can seat a drive. You can seat a sandwich. Do not confuse these skills when we arrive.",
        choices: [{ label: "The sandwich was fine.", next: null }],
      },
      {
        text: "Repo gunships. Collections agents with lasers. If they hail, tell them the ship is leased to a fictional admiral.",
        choices: [{ label: "That's you.", next: null }],
      },
      {
        text: "Flux Spares. Reactor candy. Not candy. I ran spectroscopy. I am still disappointed.",
        choices: [{ label: "We can dream.", next: null }],
      },
      {
        text: "That canister is humming in a key I associate with lawsuits. Wait for Maeve. Do not taste it.",
        choices: [{ label: "I was not going to taste it.", next: null }],
      },
      {
        text: "Dump the juice. Then fly through. If you reverse that order I will narrate your explosion in a funny voice.",
        choices: [{ label: "Noted. Funny voice reserved.", next: null }],
      },
      {
        text: "Ring is clear. Galaxy's open. Try to look like we meant to be explorers and not leftovers.",
        choices: [{ label: "Leftovers explore too.", next: null }],
      },
      {
        text: "We did it. I am proud of us. I will never say that again, so file it somewhere soft.",
        choices: [{ label: "Filed. Next heading?", next: null }],
      },
    ],
  },
};

export const INTRO = [
  {
    who: "SCOTT",
    text: "Okay. Status report. We are… not currently exploding. I'm calling that a win, PIP.",
  },
  {
    who: "PIP",
    text: "Captain — and I use the term the way you use it, which is illegally — we are tumbling in a junk system with a fried dish, a dead jump core, and a hull that is mostly opinion.",
  },
  {
    who: "SCOTT",
    text: "Self-proclaimed is still proclaimed. Someone set us up. That 'easy salvage' was an ambush with a gift shop.",
  },
  {
    who: "PIP",
    text: "Rex Gantry sold our heading to the Gutter Dogs. I have the invoice. He spelled your name wrong. Twice. Once as 'Scot' and once as 'boat.'",
  },
  {
    who: "SCOTT",
    text: "Then we fix the Maybe, we find a core, and we go back to exploring the galaxy like proper legends. PIP? Hail whoever just decloaked. I would like to yell at a person.",
  },
];

export const ENDING = {
  eyebrow: "Episode I complete",
  title: "The Galaxy, Probably",
  text: "Captain (self-proclaimed) Scott and PIP have a ship that starts, a core that hums, and a heading that isn't on fire. The Gutter Dogs are scrap. Rex is somewhere being sorry in italic. The lanes are open. Go explore. Try not to buy the next job from a man named Honest.",
};
