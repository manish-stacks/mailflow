#!/usr/bin/env node
/**
 * Promote a user to platform administrator.
 *   node scripts/make-admin.js you@agency.com
 *
 * Run this once after seeding saas.sql. There is deliberately no API route to
 * create the first admin — bootstrapping happens on the server, not over HTTP.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const email = (process.argv[2] || '').toLowerCase().trim();
  if (!email) {
    console.error('Usage: node scripts/make-admin.js <email>');
    process.exit(1);
  }

  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  const [rows] = await db.execute('SELECT id, email FROM users WHERE email = ?', [email]);
  if (!rows.length) {
    console.error(`No user found with email ${email}. Register the account first, then run this.`);
    await db.end();
    process.exit(1);
  }

  await db.execute('UPDATE users SET is_super_admin = 1 WHERE id = ?', [rows[0].id]);
  console.log(`${email} is now a platform administrator.`);
  await db.end();
})().catch((err) => {
  console.error(err.message);.




  
  process.exit(1);
});
