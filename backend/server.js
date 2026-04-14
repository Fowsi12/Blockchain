import express from "express";
import { pool } from "../db/connect.js";

const db = pool();

const server = express();
const port = 3009;
// RETTET PORT

server.use(express.static("frontend"));
server.use(onEachRequest);
server.get("/api/block/:hash", onGetHash);
server.listen(port, onServerReady);

async function onGetHash(request, response) {
  const hash = request.params.hash;
  const dbResult = await db.query(`
    select * from address
    `)
    response.json(dbResult.rows);
}

function onServerReady() {
  console.log("Webserver running on port", port);
}

function onEachRequest(request, response, next) {
  console.log(new Date(), request.method, request.url);
  next();
}
