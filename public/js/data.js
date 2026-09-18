export const TITLE = "SOLAR DRIFT";
export const EPISODE = "Episode I · The Claim";
export const CALLSIGN = "SCOTT · PIP";
export const VERSION = "2.1.0";

export const MISSIONS = [
  {
    id: "ice",
    title: "First Cut",
    brief: "Hold Space and burn ice out of the belt. PIP wants 8 tonnes before anyone takes us seriously.",
  },
  {
    id: "sell",
    title: "Cash the Claim",
    brief: "Helios Anchorage buys rock. Fly in, hail or press T, and sell the ice.",
  },
  {
    id: "iron",
    title: "Iron for the Yard",
    brief: "The Anchorage needs 12t of iron. Red-veined rocks. Do not bring them poetry.",
  },
  {
    id: "fees",
    title: "Dock Fees",
    brief: "Lifetime sales to 250 CR. Mixed ore is fine. The clerk is not.",
  },
  {
    id: "titanium",
    title: "Hard Rock",
    brief: "Pull 6t of titanium. Grey-blue veins. The laser will complain. That is the point.",
  },
  {
    id: "assay",
    title: "Assay Office",
    brief: "Sell 4t of gold, platinum, palladium, or iridium. The assay wants a sample of something expensive.",
  },
  {
    id: "ghost",
    title: "Ghost Vein",
    brief: "PIP marked a magenta rock in the outer belt. Scan it, then cut 2t of Aetherite.",
  },
  {
    id: "core",
    title: "Jump Money",
    brief: "Sell the Aetherite and hail the Anchorage. If the number is ugly enough, they will talk jump cores.",
  },
  {
    id: "done",
    title: "Claim Filed",
    brief: "Credits in the book, crystal in their vault, core on order. The lanes can wait one episode.",
  },
];

export const INTRO = [
  {
    who: "SCOTT",
    text: "New plan. We mine. We sell. We buy a core that actually jumps. I am calling this a career change.",
  },
  {
    who: "PIP",
    text: "Captain — illegally, as always — we are a conversation with a mining laser in a system called Helios. The Anchorage pays Credits. Rocks do not pay compliments.",
  },
  {
    who: "SCOTT",
    text: "Belt's between Drift and the gas giant. Ice first. I can do ice. Ice is honest.",
  },
  {
    who: "PIP",
    text: "Hold Space. The beam is the only thing on this hull that still works on purpose. Point it at asteroids. If you point it at me I will invoice you.",
  },
];

export const ENDING = {
  eyebrow: "Episode I complete",
  title: "The Claim",
  text: "Captain (self-proclaimed) Scott and PIP have a hold that empties, a book that credits, and an Anchorage clerk who will admit, quietly, that a jump core is on order. The belt is thinner. The laser is hotter. Combat can wait. For now, the rock paid.",
};

export const DIALOGUE = {
  station: {
    speaker: "Anchorage Clerk · Voss",
    portrait: "#7ec8ff",
    lines: [
      {
        text: "Helios Anchorage. We buy rock, we sell coffee, we do not finance speeches. Ice on the pad, Credits in the book. Hail when you have a hold.",
        choices: [
          { label: "We'll be back with ice.", next: null },
          { label: "Any posted claims?", next: 1 },
        ],
      },
      {
        text: "Yard needs iron. Assay wants shiny. If you hear a rock singing, that is not your business until it is. Dock fees are not a metaphor.",
        choices: [{ label: "Copy. Iron, then shiny.", next: null }],
      },
      {
        text: "That magenta sample is not on the board. I can move it. I cannot name it. Come back when you want a core more than you want a story.",
        require: "minedAetherite",
        failText: "Bring the singing rock. Then we talk about leaving Helios on purpose.",
        choices: [{ label: "That's a core. File it.", next: null, flag: "briefedCore" }],
      },
    ],
  },
  pip: {
    speaker: "PIP",
    portrait: "#5ce1ff",
    lines: [
      {
        text: "Mining laser: hold Space. Ice is the pale rocks. I have prepared a speech about dignity which I will not give.",
        choices: [{ label: "Let's cut.", next: null }],
      },
      {
        text: "You have ice. The Anchorage is the station over Drift. Fly in. Press T or hail. Sell. Try not to tip.",
        choices: [{ label: "We don't tip rocks.", next: null }],
      },
      {
        text: "Iron is the rust-veined stone. Twelve tonnes. The clerk will pretend not to watch the scale.",
        choices: [{ label: "Scale is watching us.", next: null }],
      },
      {
        text: "Credits are a number. Two hundred fifty of them makes the dock stop sighing. Mix the hold. I like nickel.",
        choices: [{ label: "Noted. Nickel.", next: null }],
      },
      {
        text: "Titanium fights back. That is how you know it is worth the heat. Six tonnes. Do not weld it to the coffee pot.",
        choices: [{ label: "I only did that once.", next: null }],
      },
      {
        text: "Gold, platinum, palladium, iridium. The assay office calls them 'the family.' Sell four tonnes of family.",
        choices: [{ label: "We don't have a family.", next: null }],
      },
      {
        text: "I marked a magenta signature on the outer belt. Scan it. If it hums, that is Aetherite, and I am already drafting a complaint.",
        choices: [{ label: "Humming is a feature.", next: null }],
      },
      {
        text: "Sell the crystal. Hail Voss. If they offer a core, accept before Scott invents a worse plan.",
        choices: [{ label: "I heard that.", next: null }],
      },
      {
        text: "Claim filed. I am proud of the laser. I am provisionally proud of you. File that somewhere soft.",
        choices: [{ label: "Filed. Next heading?", next: null }],
      },
    ],
  },
};
