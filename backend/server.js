import express from "express";
import { pool } from "../db/connect.js";

const db = pool();

const server = express();
const port = 3009;

server.use(express.static("frontend"));
server.use(onEachRequest);
server.get("/api/address/active/:symbol", onGetActiveAddress);
server.get("/api/transaction/:hash", onGetTransaction);
server.get("/api/block/hash/:hash", onGetBlockByHash); //Nået hertil!!!!!!!!!!!!!!!
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


//sender, amount, currency, receiver, timestamp
//vælger kolonnerne sender, amount, currency, receiver og timestamp
//joiner tabellen transfer med transaction på transaction_hash
//joiner tabellen block med transaction på block_id
//joiner tabellen address med transfer på sender_id og receiver_id
//joiner tabellen currency med transfer på currency_id
async function onGetTransaction(request,response) {
const db = request.db;
  const hash = request.params.hash
  const dbResult = await db.query(`
    Select s.public_key as sender, t.amount, c.symbol as currency, r.public_key as receiver, b.timestamp
    from transfer t
    join transaction tx on tx.transaction_hash = t.transaction_hash
    join block b        on b.block_id          = tx.block_id
    join address s      on s.address_id        = t.sender_id
    join address r      on r.address_id        = t.receiver_id
    join currency c     on c.currency_id       = t.currency_id
    where tx.transaction_hash = $1
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

