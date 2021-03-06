// Wise Old Man
export interface Player {
  id: number;
  username: string;
  displayName: string;
  type: string;
  build: string;
  combatLevel: number;
  registeredAt: Date;
  updatedAt: Date;
  lastImportedAt?: Date;
  latestSnapshot: Snapshot;
  ttm: number;
  tt200m: number;
  ehp: number;
  ehb: number;
  exp: number;

  // Only in group related lists
  role?: string;
}

export interface Snapshot {
  createdAt: string;
  importedAt: string;

  // Skills
  overall: SnapshotSkill;
  attack: SnapshotSkill;
  defence: SnapshotSkill;
  strength: SnapshotSkill;
  hitpoints: SnapshotSkill;
  ranged: SnapshotSkill;
  prayer: SnapshotSkill;
  magic: SnapshotSkill;
  cooking: SnapshotSkill;
  woodcutting: SnapshotSkill;
  fletching: SnapshotSkill;
  fishing: SnapshotSkill;
  firemaking: SnapshotSkill;
  crafting: SnapshotSkill;
  smithing: SnapshotSkill;
  mining: SnapshotSkill;
  herblore: SnapshotSkill;
  agility: SnapshotSkill;
  thieving: SnapshotSkill;
  slayer: SnapshotSkill;
  farming: SnapshotSkill;
  runecrafting: SnapshotSkill;
  hunter: SnapshotSkill;
  construction: SnapshotSkill;

  // Bosses
  abyssal_sire: SnapshotBoss;
  alchemical_hydra: SnapshotBoss;
  barrows_chests: SnapshotBoss;
  bryophyta: SnapshotBoss;
  callisto: SnapshotBoss;
  cerberus: SnapshotBoss;
  chambers_of_xeric: SnapshotBoss;
  chambers_of_xeric_challenge_mode: SnapshotBoss;
  chaos_elemental: SnapshotBoss;
  chaos_fanatic: SnapshotBoss;
  commander_zilyana: SnapshotBoss;
  corporeal_beast: SnapshotBoss;
  crazy_archaeologist: SnapshotBoss;
  dagannoth_prime: SnapshotBoss;
  dagannoth_rex: SnapshotBoss;
  dagannoth_supreme: SnapshotBoss;
  deranged_archaeologist: SnapshotBoss;
  general_graardor: SnapshotBoss;
  giant_mole: SnapshotBoss;
  grotesque_guardians: SnapshotBoss;
  hespori: SnapshotBoss;
  kalphite_queen: SnapshotBoss;
  king_black_dragon: SnapshotBoss;
  kraken: SnapshotBoss;
  kreearra: SnapshotBoss;
  kril_tsutsaroth: SnapshotBoss;
  mimic: SnapshotBoss;
  nex: SnapshotBoss;
  nightmare: SnapshotBoss;
  phosanis_nightmare: SnapshotBoss;
  obor: SnapshotBoss;
  sarachnis: SnapshotBoss;
  scorpia: SnapshotBoss;
  skotizo: SnapshotBoss;
  tempoross: SnapshotBoss;
  the_gauntlet: SnapshotBoss;
  the_corrupted_gauntlet: SnapshotBoss;
  theatre_of_blood: SnapshotBoss;
  theatre_of_blood_hard_mode: SnapshotBoss;
  thermonuclear_smoke_devil: SnapshotBoss;
  tzkal_zuk: SnapshotBoss;
  tztok_jad: SnapshotBoss;
  venenatis: SnapshotBoss;
  vetion: SnapshotBoss;
  vorkath: SnapshotBoss;
  wintertodt: SnapshotBoss;
  zalcano: SnapshotBoss;
  zulrah: SnapshotBoss;

  // Activities
  league_points: SnapshotActivity;
  bounty_hunter_hunter: SnapshotActivity;
  bounty_hunter_rogue: SnapshotActivity;
  clue_scrolls_all: SnapshotActivity;
  clue_scrolls_beginner: SnapshotActivity;
  clue_scrolls_easy: SnapshotActivity;
  clue_scrolls_medium: SnapshotActivity;
  clue_scrolls_hard: SnapshotActivity;
  clue_scrolls_elite: SnapshotActivity;
  clue_scrolls_master: SnapshotActivity;
  last_man_standing: SnapshotActivity;
  soul_wars_zeal: SnapshotActivity;
  guardians_of_the_rift: SnapshotActivity;

  // Virtuals
  ehp: VirtualActivity;
  ehb: VirtualActivity;
}

export interface SnapshotSkill {
  rank: number;
  experience: number;
  level?: number;
}

export interface SnapshotBoss {
  rank: number;
  kills: number;
}

export interface SnapshotActivity {
  rank: number;
  score: number;
}

export interface VirtualActivity {
  rank: number;
  value: number;
}

// RuneWatch
export interface RuneWatchLookup {
  rsn: string;
  type: string;
  date_of_abuse: number;
  case_id: string;
  url: string;
  rating: number;
  number: number;
}
