/** Database setup for BizTime. */

const { Client } = require("pg");

let DB_URI; 

if (process.env.NODE_ENV === "test") {
  DB_URI = "postgresql:///bizTime_test";
} else {
  DB_URI = "postgresql:///bizTime";
}

let db = new Client({
  user: "",
  password: "",
  connectionString: DB_URI
});

db.connect();

module.exports = db;
