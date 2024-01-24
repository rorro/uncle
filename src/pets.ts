import { PetEntry } from './types';

const Pets: PetEntry[] = [
  // They are ordered like they are ordered on the wiki
  // Bosses
  { name: 'abyssal_sire', display_name: 'Abyssal Sire', emoji: '<:sire:983752813651837038>' },
  { name: 'giant_mole', display_name: 'Giant Mole', emoji: '<:mole:983752812401938572>' },
  { name: 'callisto', display_name: 'Callisto', emoji: '<:callisto:983752810971680788>' },
  { name: 'duke_sucellus', display_name: 'Duke Sucellus', emoji: '<:succ:1134015341408829480>' },
  { name: 'vardorvis', display_name: 'Vardorvis', emoji: '<:vard:1134015332059709450>' },
  { name: 'cerberus', display_name: 'Cerberus', emoji: '<:cerberus:983752809465925632>' },
  { name: 'alchemical_hydra', display_name: 'Alchemical Hydra', emoji: '<:hydra:983752805384863744>' },
  { name: 'tzkal_zuk', display_name: 'TzKal-Zuk', emoji: '<:zuk:983752803967172628>' },
  { name: 'kalphite_queen', display_name: 'Kalphite Queen', emoji: '<:kq:983752802276884592>' },
  { name: 'phantom_muspah', display_name: 'Phantom Muspah', emoji: '<:muphin:1063218969345007646>' },
  { name: 'the_leviathan', display_name: 'The Leviathan', emoji: '<:lev:1134015335914279005>' },
  { name: 'theatre_of_blood', display_name: 'Theatre Of Blood', emoji: '<:zik:983752800662065242>' },
  { name: 'nightmare', display_name: 'Nightmare', emoji: '<:nightmare:983752799533826098>' },
  { name: 'nex', display_name: 'Nex', emoji: '<:nex:983752798220996618>' },
  {
    name: 'grotesque_guardians',
    display_name: 'Grotesque Guardians',
    emoji: '<:ggs:983752796841074728>'
  },
  { name: 'chambers_of_xeric', display_name: 'Chambers Of Xeric', emoji: '<:olm:983752795159162901>' },
  { name: 'chaos_elemental', display_name: 'Chaos Elemental', emoji: '<:chaosele:983752794089615440>' },
  { name: 'dagannoth_prime', display_name: 'Dagannoth Prime', emoji: '<:prime:983752792822923314>' },
  { name: 'dagannoth_rex', display_name: 'Dagannoth Rex', emoji: '<:rex:983752791602393098>' },
  {
    name: 'dagannoth_supreme',
    display_name: 'Dagannoth Supreme',
    emoji: '<:supreme:983752790130184192>'
  },
  { name: 'corporeal_beast', display_name: 'Corporeal Beast', emoji: '<:corp:983752788733485106>' },
  {
    name: 'general_graardor',
    display_name: 'General Graardor',
    emoji: '<:graardor:983752787512946718>'
  },
  { name: 'kril_tsutsaroth', display_name: `K'ril Tsutsaroth`, emoji: '<:kril:983752785663238197>' },
  { name: 'kraken', display_name: 'Kraken', emoji: '<:kraken:983752784782442547>' },
  { name: 'kreearra', display_name: `Kree'Arra`, emoji: '<:kreearra:983752782978900108>' },
  {
    name: 'thermonuclear_smoke_devil',
    display_name: 'Thermonuclear Smoke Devil',
    emoji: '<:thermy:983752781657686076>'
  },
  { name: 'zulrah', display_name: 'Zulrah', emoji: '<:zulrah:983752780382625883>' },
  {
    name: 'commander_zilyana',
    display_name: 'Commander Zilyana',
    emoji: '<:zilyana:983752779107549244>'
  },
  { name: 'phoenix', display_name: 'Phoenix', emoji: '<:phoenix:983752749650935838>' },
  { name: 'king_black_dragon', display_name: 'King Black Dragon', emoji: '<:kbd:983752777387872288>' },
  { name: 'scorpia', display_name: 'Scorpia', emoji: '<:scorpia:983752776037314591>' },
  { name: 'scurrius', display_name: 'Scurrius', emoji: '<:scurry:1199722816124231680>' },
  { name: 'skotizo', display_name: 'Skotizo', emoji: '<:skotizo:983752775047467049>' },
  { name: 'zalcano', display_name: 'Zalcano', emoji: '<:zalcano:983752745888669736>' },
  { name: 'sarachnis', display_name: 'Sarachnis', emoji: '<:sarachnis:983752773168402453>' },
  { name: 'tempoross', display_name: 'Tempoross', emoji: '<:tempoross:983752748367495288>' },
  { name: 'tombs_of_amascut', display_name: 'Tombs of Amascut', emoji: '<:toa:1013413759580127336>' },
  { name: 'tztok_jad', display_name: 'TzTok-Jad', emoji: '<:jad:983752772270837760>' },
  { name: 'venenatis', display_name: 'Venenatis', emoji: '<:venenatis:983752771075469383>' },
  { name: 'vetion', display_name: `Vet'ion`, emoji: '<:vetion:983752769787822131>' },
  { name: 'vorkath', display_name: 'Vorkath', emoji: '<:vorkath:983752768533721088>' },
  { name: 'the_whisperer', display_name: 'The Whisperer', emoji: '<:wisp:1134015334525972510>' },
  { name: 'gauntlet', display_name: 'Gauntlet', emoji: '<:gauntlet:983752747121799168>' },

  // Skilling
  { name: 'chinchompa', display_name: 'Chinchompa', emoji: '<:chinchompa:983752767241867284>' },
  { name: 'beaver', display_name: 'Beaver', emoji: '<:beav:983752766046502942>' },
  { name: 'giant_squirrel', display_name: 'Giant squirrel', emoji: '<:squirrel:983752764872069200>' },
  { name: 'heron', display_name: 'Heron', emoji: '<:heron:983752763525697576>' },
  { name: 'rift_guardian', display_name: 'Rift Guardian', emoji: '<:guardian:983752762032541746>' },
  { name: 'rock_golem', display_name: 'Rock Golem', emoji: '<:golem:983752760791023706>' },
  { name: 'rocky', display_name: 'Rocky', emoji: '<:rocky:983752759205568612>' },
  { name: 'tangleroot', display_name: 'Tangleroot', emoji: '<:tangleroot:983752757729177650>' },

  // Other
  { name: 'abyssal_protector', display_name: 'Abyssal protector', emoji: '<:gotr:983752744336773132>' },
  { name: 'bloodhound', display_name: 'Bloodhound', emoji: '<:bloodhound:983752756412158043>' },
  { name: 'chompy_chick', display_name: 'Chompy chick', emoji: '<:chompy:983752754847698944>' },
  { name: 'herbiboar', display_name: 'Herbiboar', emoji: '<:herbi:983752753232875551>' },
  { name: 'lil_creator', display_name: `Lil' creator`, emoji: '<:creator:983752752322707526>' },
  { name: 'penance_queen', display_name: 'Penance queen', emoji: '<:pq:983752750896676914>' }
];

export default Pets;
