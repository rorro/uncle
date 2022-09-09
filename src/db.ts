import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig';
import { ScheduledMessage } from './types';
import dayjs from 'dayjs';
import { DATE_FORMAT } from './utils';

class DB {
  database: JsonDB;
  scheduledMessages: JsonDB;

  constructor() {
    this.database = new JsonDB(new Config('.db', true, true, '/'));
    this.scheduledMessages = new JsonDB(new Config('.scheduledMessages', true, true, '/'));
  }

  getPassedMessages(): ScheduledMessage[] {
    const messages = this.scheduledMessages.getData('/messages');
    const pastMessages = messages.filter(
      (m: ScheduledMessage) => dayjs(m.date).utc().diff(dayjs().utc().format(DATE_FORMAT)) <= 0
    );
    const futureMessages = messages.filter(
      (m: ScheduledMessage) => dayjs(m.date).diff(dayjs().utc().format(DATE_FORMAT)) > 0
    );

    this.scheduledMessages.push('/messages', futureMessages);

    return pastMessages;
  }
}

export default new DB();
