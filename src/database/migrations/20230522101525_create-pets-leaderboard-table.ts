import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('pets_leaderboard', (table: Knex.TableBuilder) => {
    table.increments('id').primary();
    table.string('username').defaultTo(null);
    table.boolean('removed').defaultTo(false);
    table.boolean('abyssal_sire').defaultTo(false);
    table.boolean('giant_mole').defaultTo(false);
    table.boolean('callisto').defaultTo(false);
    table.boolean('cerberus').defaultTo(false);
    table.boolean('alchemical_hydra').defaultTo(false);
    table.boolean('tzkal_zuk').defaultTo(false);
    table.boolean('kalphite_queen').defaultTo(false);
    table.boolean('theatre_of_blood').defaultTo(false);
    table.boolean('phantom_muspah').defaultTo(false);
    table.boolean('nightmare').defaultTo(false);
    table.boolean('nex').defaultTo(false);
    table.boolean('grotesque_guardians').defaultTo(false);
    table.boolean('chambers_of_xeric').defaultTo(false);
    table.boolean('chaos_elemental').defaultTo(false);
    table.boolean('dagannoth_prime').defaultTo(false);
    table.boolean('dagannoth_rex').defaultTo(false);
    table.boolean('dagannoth_supreme').defaultTo(false);
    table.boolean('corporeal_beast').defaultTo(false);
    table.boolean('general_graardor').defaultTo(false);
    table.boolean('kril_tsutsaroth').defaultTo(false);
    table.boolean('kraken').defaultTo(false);
    table.boolean('kreearra').defaultTo(false);
    table.boolean('thermonuclear_smoke_devil').defaultTo(false);
    table.boolean('zulrah').defaultTo(false);
    table.boolean('commander_zilyana').defaultTo(false);
    table.boolean('king_black_dragon').defaultTo(false);
    table.boolean('scorpia').defaultTo(false);
    table.boolean('skotizo').defaultTo(false);
    table.boolean('sarachnis').defaultTo(false);
    table.boolean('tombs_of_amascut').defaultTo(false);
    table.boolean('tztok_jad').defaultTo(false);
    table.boolean('venenatis').defaultTo(false);
    table.boolean('vetion').defaultTo(false);
    table.boolean('vorkath').defaultTo(false);
    table.boolean('chinchompa').defaultTo(false);
    table.boolean('beaver').defaultTo(false);
    table.boolean('giant_squirrel').defaultTo(false);
    table.boolean('heron').defaultTo(false);
    table.boolean('rift_guardian').defaultTo(false);
    table.boolean('rock_golem').defaultTo(false);
    table.boolean('rocky').defaultTo(false);
    table.boolean('tangleroot').defaultTo(false);
    table.boolean('bloodhound').defaultTo(false);
    table.boolean('chompy_chick').defaultTo(false);
    table.boolean('herbiboar').defaultTo(false);
    table.boolean('lil_creator').defaultTo(false);
    table.boolean('penance_queen').defaultTo(false);
    table.boolean('phoenix').defaultTo(false);
    table.boolean('tempoross').defaultTo(false);
    table.boolean('gauntlet').defaultTo(false);
    table.boolean('zalcano').defaultTo(false);
    table.boolean('abyssal_protector').defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {}
