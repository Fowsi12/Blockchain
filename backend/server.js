import express from "express";
import { pool } from "../db/connect.js";

const db = pool();

const server = express();
const port = 3009;
// RETTET PORT

server.use(express.static("frontend"));
server.use(onEachRequest);
server.get("/api/address/active/:currencyId", onGetActiveAddresses);
server.listen(port, onServerReady);

async function onGetActiveAddresses(request, response) {
  const db = request.db;
  const currencyId = request.params.currencyId;
  const result = await db.query(
    `
    select distinct a.public_key
    from            transfer t
    join            address a on a.address_id = t.sender_id
      or            a.address_id = t.receiver_id
    where           t.currency_id = $1;`,
    [currencyId],
  );
  response.json(result.rows);
}

function onServerReady() {
  console.log("Webserver running on port", port);
}

function onEachRequest(request, response, next) {
  console.log(new Date(), request.method, request.url);
  request.db = db;
  next();
}
