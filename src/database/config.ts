const config = {
  client: 'better-sqlite3',
  connection: {
    filename: `${__dirname}/../../database.sqlite3`
  },
  useNullAsDefault: true
};

export default config;
