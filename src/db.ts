import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig';
import { ScheduledMessage } from './types';
import dayjs from 'dayjs';
import { DATE_FORMAT } from './utils';

class DB {
  scheduledMessages: JsonDB;

  constructor() {
    this.scheduledMessages = new JsonDB(new Config('.scheduledMessages', true, true, '/'));
  }

  getPassedMessages(): ScheduledMessage[] {
    const messages = this.scheduledMessages.getData('/messages');
    const pastMessages = messages.filter(
      (m: ScheduledMessage) => dayjs(m.date).diff(dayjs().utc().format(DATE_FORMAT), 'minute') <= 0
    );
    const futureMessages = messages.filter(
      (m: ScheduledMessage) => dayjs(m.date).diff(dayjs().utc().format(DATE_FORMAT), 'minute') > 0
    );

    this.scheduledMessages.push('/messages', futureMessages);

    return pastMessages;
  }
}

export default new DB();
