import Database from 'better-sqlite3';
import config from '../config';

const db = new Database(`${__dirname}/../../.database.sqlite3`);
db.pragma('journal_mode = WAL');

// Configs
export function getConfigItem(configItem: string): string | number | null {
  const stmt = db.prepare(`SELECT ${configItem} FROM configs where guild_id = ?`);
  const result = stmt.get(config.guild.id) as Record<string, any>;

  return result && configItem in result ? result[configItem] : null;
}

export function updateConfig(configKey: string, configValue: string): void {
  const stmt = db.prepare(`UPDATE configs SET ${configKey} = ? WHERE guild_id = ?`);
  stmt.run(configValue, config.guild.id);
}

export function getEmbedConfigs(): Record<string, any> {
  const stmt = db.prepare('SELECT application_embed, support_embed FROM configs where guild_id = ?');
  const result = stmt.get(config.guild.id) as Record<string, any>;
  console.log(result);

  return result;
}
