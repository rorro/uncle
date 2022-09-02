import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig';

class DB {
  database: JsonDB;

  constructor() {
    this.database = new JsonDB(new Config('.db', true, true, '/'));
  }
}

export default new DB();
