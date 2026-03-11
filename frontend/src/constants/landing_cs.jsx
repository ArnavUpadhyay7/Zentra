export const NAV_LINKS = [
  { label: "Features",     href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ",          href: "#faq" },
];

export const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Create or join a space",
    desc: "Hit 'Create a Space' to spin up a fresh room instantly, or 'Join a Space' to drop into an existing one. No account, no forms, no waiting.",
    tag: "Instant",
  },
  {
    num: "02",
    title: "Tell us your name",
    desc: "Just one field — or two if you're joining. We save it locally so you never have to type it again. That's the entire onboarding.",
    tag: "Zero friction",
  },
  {
    num: "03",
    title: "Move and talk",
    desc: "Walk your character up to someone. Chat and voice activate automatically the moment you're in range. Walk away to end it.",
    tag: "Spatial",
  },
];

export const FEATURES = [
  {
    icon: "💬",
    title: "Proximity chat",
    desc: "Text only reaches people physically next to you. Local, contextual, distraction-free.",
  },
  {
    icon: "🎙",
    title: "Spatial voice",
    desc: "WebRTC peer-to-peer audio. Your voice carries only to nearby players — never to the whole room.",
  },
  {
    icon: "⚡",
    title: "Real-time movement",
    desc: "Every position syncs live across all clients. See your team scatter, gather, and drift in real time.",
  },
  {
    icon: "🔗",
    title: "Shareable rooms",
    desc: "Every space gets a unique URL. Drop it in Slack, send it in a text. One click and they're in.",
  },
  {
    icon: "🗺",
    title: "Custom maps",
    desc: "Design in Tiled editor, export as JSON, upload and go. Your office, your layout.",
  },
  {
    icon: "🔒",
    title: "Private by default",
    desc: "Link-only access. No one stumbles in. You decide who gets the URL.",
  },
];

export const STATS = [
  { value: "< 1s",  label: "Room creation time" },
  { value: "P2P",   label: "Voice never touches our server" },
  { value: "60fps", label: "Live position sync" },
  { value: "Free",  label: "No credit card, ever" },
];

export const FAQS = [
  {
    q: "Do I need an account?",
    a: "No. Just pick a name and you're in. We store it in localStorage so you don't have to type it again next session.",
  },
  {
    q: "How does proximity voice work?",
    a: "When two players come within range, a WebRTC connection establishes directly between their browsers. Audio is peer-to-peer — our server handles only the initial handshake, never the audio stream.",
  },
  {
    q: "How many people can be in one space?",
    a: "Comfortably up to 20 in a single room. The spatial model helps — conversations splinter naturally so it never feels like everyone is shouting at once.",
  },
  {
    q: "Can I use a custom map?",
    a: "Yes. We support Tiled map editor exports. Design your layout, export as JSON, and upload it when creating your space.",
  },
  {
    q: "Is the voice truly private?",
    a: "Yes. Voice is pure WebRTC peer-to-peer. Our server has zero access to audio — it only coordinates who connects to whom.",
  },
];