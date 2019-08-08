module.exports = {
  PORT: process.env.PORT || 8000,
  API_TOKEN: process.env.API_TOKEN || 'dummy-api-token',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URL:
    process.env.DB_URL ||
    'postgresql://dunder-mifflin:123@localhost/noteful',
};
