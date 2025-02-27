import Database from 'better-sqlite3';
import config from '../config';

const db = new Database(`${__dirname}/../../.database.sqlite3`);
db.pragma('journal_mode = WAL');

export function getConfigItem(configItem: string): string | number | null {
    const stmt = db.prepare(`SELECT ${configItem} FROM configs where guild_id = ?`);
    const result = stmt.get(config.guild.id) as Record<string, any>;

    return result && configItem in result ? result[configItem] : null;
}
