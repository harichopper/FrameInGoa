import { ThemeConfig } from './types';

export const THEMES: ThemeConfig[] = [
  {
    id: 'cyber',
    name: 'Cyber',
    badge: 'CYBER_NEON',
    gradient: 'from-[#00f0ff] to-[#ff24e4]',
    borderGlow: 'rgba(0, 240, 255, 0.4)',
    textColor: '#00f0ff',
    accentColor: '#00f0ff',
    secondaryAccent: '#ff24e4',
    cardBg: 'from-[#0e0e0e] via-[#1c1b1b] to-[#0e0e0e]',
    headerBg: 'from-black/80 to-transparent',
    qrColor: '#00f0ff',
    ringColor: '#00dbe9',
    pattern: 'circuit'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    badge: 'DEEP_WAVE',
    gradient: 'from-[#00f0ff] to-[#0055ff]',
    borderGlow: 'rgba(0, 240, 255, 0.5)',
    textColor: '#7df4ff',
    accentColor: '#00dbe9',
    secondaryAccent: '#0055ff',
    cardBg: 'from-[#020b14] via-[#081a2e] to-[#020b14]',
    headerBg: 'from-[#020b14]/90 to-transparent',
    qrColor: '#00dbe9',
    ringColor: '#00f0ff',
    pattern: 'waves'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    badge: 'GOA_DUSK',
    gradient: 'from-[#ff007a] via-[#ff7300] to-[#ffbe00]',
    borderGlow: 'rgba(255, 115, 0, 0.5)',
    textColor: '#ffb77f',
    accentColor: '#ff7300',
    secondaryAccent: '#ff007a',
    cardBg: 'from-[#1c080e] via-[#2a0e18] to-[#1c080e]',
    headerBg: 'from-[#1c080e]/90 to-transparent',
    qrColor: '#ff7300',
    ringColor: '#ffb77f',
    pattern: 'sun'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    badge: 'NORTH_LIGHT',
    gradient: 'from-[#00ff88] via-[#00f0ff] to-[#7000ff]',
    borderGlow: 'rgba(0, 255, 136, 0.4)',
    textColor: '#00ff88',
    accentColor: '#00ff88',
    secondaryAccent: '#7000ff',
    cardBg: 'from-[#05140d] via-[#0d2218] to-[#05140d]',
    headerBg: 'from-[#05140d]/90 to-transparent',
    qrColor: '#00ff88',
    ringColor: '#00ff88',
    pattern: 'aurora'
  },
  {
    id: 'tropical',
    name: 'Tropical',
    badge: 'PALM_CORE',
    gradient: 'from-[#10b981] via-[#06b6d4] to-[#f59e0b]',
    borderGlow: 'rgba(16, 185, 129, 0.5)',
    textColor: '#a7f3d0',
    accentColor: '#10b981',
    secondaryAccent: '#f59e0b',
    cardBg: 'from-[#04140e] via-[#0b271d] to-[#04140e]',
    headerBg: 'from-[#04140e]/90 to-transparent',
    qrColor: '#10b981',
    ringColor: '#34d399',
    pattern: 'tropical'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    badge: 'VOID_FORGE',
    gradient: 'from-[#a855f7] via-[#6366f1] to-[#3b82f6]',
    borderGlow: 'rgba(168, 85, 247, 0.5)',
    textColor: '#c084fc',
    accentColor: '#a855f7',
    secondaryAccent: '#3b82f6',
    cardBg: 'from-[#0b0714] via-[#160f29] to-[#0b0714]',
    headerBg: 'from-[#0b0714]/90 to-transparent',
    qrColor: '#a855f7',
    ringColor: '#c084fc',
    pattern: 'void'
  }
];

export const BUILDER_TITLES = [
  'Deploy Wizard', 'Prompt Pirate', 'Cloud Surfer', 'Merge Master', 'Terminal Samurai',
  'Pixel Architect', 'Full Stack Alchemist', 'Byte Ninja', 'Contract Breaker', 'Zero-Knowledge Oracle',
  'Kernel Hacker', 'Solidity Sensei', 'API Craftsman', 'CSS Whisperer', 'GPU Warlock',
  'Vector Nomad', 'LLM Wrangler', 'Frontend Virtuoso', 'Backend Juggernaut', 'Infra Whisperer',
  'Docker Captain', 'Rust Wrangler', 'Typescript Wizard', 'Git Sorcerer', 'Kubernetes Monk',
  'Neural Navigator', 'Data Weaver', 'DevOps Overlord', 'Assembly Titan', 'Distributed Prophet',
  'Memory Master', 'Cyber Architect', 'Quantum Hacker', 'Crypto Alchemist', 'Protocol Phantom',
  'Subnet Surfer', 'Zero Day Samurai', 'Matrix Navigator', 'Glitch Sculptor', 'Packet Paladin',
  'Shader Spellcaster', 'Canvas Magician', 'WebGL Warden', 'DOM Dominator', 'REPL Ranger',
  'Microservice Mystic', 'Lambda Legend', 'Edge Runner', 'Serverless Nomad', 'Wasm Warlock',
  'Thread Weaver', 'Async Tactician', 'Pipeline Pioneer', 'Vite Voyager', 'React Renegade',
  'Tailwind Titan', 'Bento Brigade', 'Stack Strategist', 'Logic Luminary', 'State Sovereign',
  'Cache Commander', 'Event Engine', 'Queue Ruler', 'DB Dynamo', 'Graph Guardian',
  'Schema Tactician', 'Query Monarch', 'Payload Pilot', 'Stream Sculptor', 'Buffer Boss',
  'Bytecode Bandit', 'Ast Rogue', 'Compiler Captain', 'Parser Paladin', 'Linter Vanguard',
  'Bundle Buster', 'CI/CD Crusader', 'GitOps General', 'Observability Sentinel', 'Telemetry Tactician',
  'Chaos Engineer', 'Latency Slayer', 'Uptime Emperor', 'Scale Specialist', 'Traffic Tamer',
  'Load Balancer Lord', 'CDN Champion', 'DNS Master', 'Port Pathfinder', 'Socket Sovereign',
  'HTTP Hero', 'RPC Rider', 'gRPC Vanguard', 'GraphQL Titan', 'REST Renegade',
  'Auth Anchor', 'JWT Sentinel', 'OAuth Overlord', 'Cipher Craftsman', 'Entropy Engineer',
  'Kaggle Knight', 'PyTorch Pioneer', 'Tensor Vanguard', 'Transformer Titan', 'Agentic Craftsman'
];

export const POPULAR_STACKS = [
  'React 19', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js',
  'Express', 'Solidity', 'Python', 'Rust', 'Go',
  'PostgreSQL', 'GraphQL', 'Three.js', 'PyTorch', 'Gemini API'
];

export const DEFAULT_ROLES = [
  'Full Stack Developer', 'Frontend Engineer', 'Backend Specialist',
  'AI / ML Engineer', 'Smart Contract Dev', 'UI/UX Designer',
  'DevOps Specialist', 'Systems Architect', 'Security Researcher'
];
