export default {
  client: 'better-sqlite3',
  connection: {
    filename: `${__dirname}/../../database.sqlite3`
  },
  useNullAsDefault: true,
  seeds: {
    directory: './seeds'
  }
};
