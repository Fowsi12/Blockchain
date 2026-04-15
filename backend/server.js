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
server.listen(port, onServerReady);


//address, transfer, currency 
//vælger tabellen address
// joiner kolonnerne sender_id ELLER receiver_id fra tabellen transfer
// joiner kolonnen currency_id fra tabellen currency, hvor symbol erstattes med værdi fra kollonnen symbol
async function onGetActiveAddress(request, response) {
  const db = request.db;
  const symbol = request.params.symbol
  const dbResult = await db.query(`
    select      distinct public_key as address
    from        address a
    join        transfer t on t.sender_id = a.address_id or t.receiver_id = a.address_id
    join        currency c on c.currency_id = t.currency_id 
    where       c.symbol = $1
    `,[symbol] // dette er en ticker og inde i vores db.query beder om vores SQL & [ticker]. syntax = const ... = await db.query(SQL,[ticker])
  ); 
  response.json(dbResult.rows);
} 

async function onGetTransaction(request,response) {
const db = request.db;
  const hash = request.params.hash
  const dbResult = await db.query(`
   SELECT s.public_key as sender, t.amount, c.symbol as currency, r.public_key as receiver, b.timestamp
    FROM transfer t
    JOIN transaction tx ON tx.transaction_hash = t.transaction_hash
    JOIN block b        ON b.block_id          = tx.block_id
    JOIN address s      ON s.address_id        = t.sender_id
    JOIN address r      ON r.address_id        = t.receiver_id
    JOIN currency c     ON c.currency_id       = t.currency_id
    WHERE tx.transaction_hash = $1
    `,[hash] 
  ); 
  response.json(dbResult.rows);
}

async function onGetBlockByHash(request,response) {
const db = request.db;
  const hash = request.params.hash
  const dbResult = await db.query(`
    
    `,[hash] 
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

