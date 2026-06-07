import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host:"gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com",
  port: parseInt("4000"),
  user: "42ozeHBxPnrXopQ.root",
  password: "6M3sQetP34KH35bl",
  database: "hotel_ordering",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
