const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://oyphmvzmdvfovi:a037095fe67683b220f1dc83ac9190339eb0e2c6b24109679dae1260c2c018fa@ec2-54-157-79-121.compute-1.amazonaws.com:5432/dfp48qoa8parbc",
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports =  pool;
