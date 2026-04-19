import express from "express";
import { pool } from "../db/connect.js";

const db = pool();

const server = express();
const port = 3009;

server.use(express.static("frontend"));
server.use(onEachRequest);
server.get("/api/address/active/:symbol", onGetActiveAddress);
server.get("/api/transaction/:hash", onGetTransaction);
server.get("/api/block/hash/:hash", onGetBlockByHash);
server.get("/api/block/height/:height", onGetBlockByHeight);
server.get("/api/address/:address/currencies", onGetAddressCurrencies);
server.get("/api/address/:address/balance", onGetBalance);
server.get("/api/address/:address/value", onGetValue);
server.get("/api/address/:address/flow", onGetFlow);
server.get("/api/address/:address/transfers", onGetTransferValue);
server.listen(port, onServerReady);

//address, transfer, currency
//vælger tabellen address
// joiner kolonnerne sender_id ELLER receiver_id fra tabellen transfer
// joiner kolonnen currency_id fra tabellen currency, hvor symbol erstattes med værdi fra kollonnen symbol
async function onGetActiveAddress(request, response) {
  const db = request.db;
  const symbol = request.params.symbol;
  const dbResult = await db.query(
    `
    select      distinct public_key as address
    from        address a
    join        transfer t on t.sender_id = a.address_id or t.receiver_id = a.address_id
    join        currency c on c.currency_id = t.currency_id 
    where       c.symbol = $1
    `,
    [symbol], // dette er en ticker og inde i vores db.query beder om vores SQL & [ticker]. syntax = const ... = await db.query(SQL,[ticker])
  );
  response.json(dbResult.rows);
}

//sender, amount, currency, receiver, timestamp
//vælger kolonnerne sender, amount, currency, receiver og timestamp
//joiner tabellen transfer med transaction på transaction_hash
//joiner tabellen block med transaction på block_id
//joiner tabellen address med transfer på sender_id og receiver_id
//joiner tabellen currency med transfer på currency_id
async function onGetTransaction(request, response) {
  const db = request.db;
  const hash = request.params.hash;
  const dbResult = await db.query(
    `
    Select s.public_key as sender, t.amount, c.symbol as currency, r.public_key as receiver, b.timestamp
    from transfer t
    join transaction tx on tx.transaction_hash = t.transaction_hash
    join block b        on b.block_id          = tx.block_id
    join address s      on s.address_id        = t.sender_id
    join address r      on r.address_id        = t.receiver_id
    join currency c     on c.currency_id       = t.currency_id
    where tx.transaction_hash = $1
    `,
    [hash],
  );
  response.json(dbResult.rows);
}

// bruger LEFT JOIN for at sikre at blokken stadig returneres, selv hvis den ikke har nogen transaktioner.
// Hvis vi brugte en almindelig JOIN, ville blokken ikke blive returneret, hvis den ikke havde nogen transaktioner, men hvis vi bruger LEFT JOIN, vil blokken stadig blive returneret, selvom der ikke er nogen transaktioner.
async function onGetBlockByHash(request, response) {
  const db = request.db;
  const hash = request.params.hash;
  const dbResult = await db.query(
    `
    Select    tx.transaction_hash
    From      block b
    Left join transaction tx ON tx.block_id = b.block_id
    Where     b.hash = $1
    `,
    [hash],
  );
  response.json(dbResult.rows);
}

async function onGetBlockByHeight(request, response) {
  const db = request.db;
  const height = request.params.height;
  const dbResult = await db.query(
    `
    Select *
    From   block
    Where  block_id = $1
    `,
    [height],
  );
  response.json(dbResult.rows);
}

async function onGetAddressCurrencies(request, response) {
  const db = request.db;
  const address = request.params.address;
  const dbResult = await db.query(
    `
   Select c.symbol as currency, min(t.timestamp) as first, max(t.timestamp) as last
    From  transfer t
    Join  currency c on c.currency_id = t.currency_id
    Join   address a  on a.address_id = t.sender_id OR a.address_id = t.receiver_id
    Where a.public_key = $1
    Group by c.symbol
    `,
    [address],
  );
  response.json(dbResult.rows);
}

async function onGetBalance(request, response) {
  const db = request.db;
  const address = request.params.address;
  const dbResult = await db.query(
    `
   Select c.symbol, ab.balance
    From  account_balance ab
    Join  currency c on c.currency_id = ab.currency_id
    Join  address a on a.address_id = ab.address_id
    Where a.public_key = $1
      `,
    [address],
  );
  response.json(dbResult.rows);
}

async function onGetValue(request, response) {
  const db = request.db;
  const address = request.params.address;
  const dbResult = await db.query(
    `
   Select sum(ab.balance * er.rate_to_valuta) as total_usd
    From account_balance ab
    Join address a on a.address_id = ab.address_id
    Join exchange_rate er on er.currency_id = ab.currency_id
    Where a.public_key = $1
    and er.timestamp = ( select max(er2.timestamp)
      From exchange_rate er2
      Where er2.currency_id = ab.currency_id)
      `,
    [address],
  );
  response.json(dbResult.rows);
}

async function onGetFlow(request, response) {
  const db = request.db;
  const address = request.params.address;
  const from = request.query.from;
  const to = request.query.to;
  const dbResult = await db.query(
    `
   Select c.symbol, sum(case when a.address_id = t.receiver_id then t.amount else 0 end) as received,
      sum(case when a.address_id = t.sender_id then t.amount else 0 end) as sent
    From transfer t
    Join currency c on c.currency_id = t.currency_id
    Join address a  on a.public_key = $1
    Where t.timestamp between $2 and $3
    Group by c.symbol
      `,
    [address, from, to],
  );
  response.json(dbResult.rows);
}

async function onGetTransferValue(request, response) {
  const db = request.db;
  const address = request.params.address;
  const dbResult = await db.query(
    `
    Select c.symbol, t.amount, t.timestamp, er.rate_to_valuta, (t.amount * er.rate_to_valuta) as usd_value
    From transfer t
    Join currency c on c.currency_id = t.currency_id
    Join address a on a.public_key = $1
    Join exchange_rate er on er.currency_id = t.currency_id
    Where (t.sender_id = a.address_id OR t.receiver_id = a.address_id)
    and er.timestamp <= t.timestamp
  `,
    [address],
  );
  response.json(dbResult.rows);
}

function onServerReady() {
  console.log("Webserver running on port", port);
}

function onEachRequest(request, response, next) {
  console.log(new Date(), request.method, request.url);
  request.db = db;
  next();
}
