// NexSport database viewer — run with:  node view-db.cjs [table]
// Shows all rows in the SQLite database so developers can inspect stored data.
const Database = require("better-sqlite3");
const db = new Database("nexsport.db", { readonly: true });
db.pragma("journal_mode = WAL");

const tables = ["users", "rooms", "room_members", "messages", "feedback"];

function printTable(name) {
  const rows = db.prepare(`SELECT * FROM ${name}`).all();
  console.log(`\n===== ${name} (${rows.length} rows) =====`);
  if (rows.length === 0) {
    console.log("  (empty)");
    return;
  }
  for (const row of rows) {
    console.log(JSON.stringify(row, null, 2));
  }
}

const requested = process.argv[2];

if (requested) {
  if (!tables.includes(requested)) {
    console.error(`Unknown table '${requested}'. Available: ${tables.join(", ")}`);
    process.exit(1);
  }
  printTable(requested);
} else {
  console.log("NexSport SQLite database — D:\\NexSport_ Your Game, Your Team\\nexsport.db");
  for (const t of tables) printTable(t);
}

db.close();
