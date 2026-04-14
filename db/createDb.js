import { connect } from "./connect.js";

const db = await connect();
const timestamp = (await db.query("select now() as timestamp")).rows[0][
  "timestamp"
];
console.log(`Recreating database on ${timestamp}...`);

console.log("server is running, creating database...");

console.log("Dropping existing tables...");
await db.query("drop table if exists address");
await db.query("drop table if exists currency");
await db.query("drop table if exists block");
await db.query("drop table if exists transaction");
await db.query("drop table if exists exchange_rate");
// TODO: drop more tables, if they exist

// ADDRESS, address_id=id -- public_key=address -- balance=amount
await db.query(`
CREATE TABLE address (
    address_id SERIAL PRIMARY KEY,
    public_key TEXT UNIQUE NOT NULL,
    balance NUMERIC DEFAULT 0
);
`);

await db.query(` 
    INSERT INTO currency (currency_id, name, symbol) VALUES
(1, 'Ethereum', 'ETH'),
(2, 'Chainlink', 'LINK'),
(3, 'USD Coin', 'USDC');
`);

// CURRENCY, currency_id=id, name=, symbol=,
await db.query(`
CREATE TABLE currency (
    currency_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL
`);

await db.query(`
INSERT INTO address (address_id, public_key) VALUES
(1, 'coinbase'),
(2, 'a0324425e7'),
(3, 'b07c7e7df3'),
(4, 'c0acb3be5f'),
(5, 'd03894efe8'),
(6, 'e088c8d932'),
(7, 'f076a8c8b0');
`);

// BLOCK, block_id=, previous_hash=, hash=, timestamp=,
await db.query(`
CREATE TABLE block (
    block_id SERIAL PRIMARY KEY,
    previous_hash TEXT,
    hash TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
`);

await db.query(`
INSERT INTO block (block_id, hash, previous_hash, timestamp) VALUES
(0, '000ffe7', NULL, '2026-03-01T07:30:00Z'),
(1, '0002a81', '000ffe7', '2026-03-03T14:00:00Z'),
(2, '0003bb6', '0002a81', '2026-03-09T22:30:00Z');
`);

// TRANSACTION, transaction_id=, block_id=,
await db.query(`
CREATE TABLE transaction (
    transaction_id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES block(block_id),
    transaction_hash TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    position_in_block INTEGER
`);

await db.query(`
INSERT INTO transaction (transaction_id, block_id, transaction_hash, timestamp) VALUES
(1, 0, '5ac6', '2026-03-01T07:30:00Z'),

(2, 1, '78af', '2026-03-03T14:00:00Z'),
(3, 1, '9cb6', '2026-03-03T14:00:00Z'),
(4, 1, '04aa', '2026-03-03T14:00:00Z'),

(5, 2, 'af78', '2026-03-09T22:30:00Z'),
(6, 2, '9033', '2026-03-09T22:30:00Z'),
(7, 2, 'acdf', '2026-03-09T22:30:00Z');
`);

await db.query(`
CREATE TABLE transfer (
    transfer_id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transaction(transaction_id),
    sender_id INTEGER REFERENCES address(address_id),
    receiver_id INTEGER REFERENCES address(address_id),
    currency_id INTEGER REFERENCES currency(currency_id),
    amount NUMERIC NOT NULL
`);

await db.query(`
-- TX 5ac6
INSERT INTO transfer (transaction_id, sender_id, receiver_id, currency_id, amount)
VALUES
(1, 1, 2, 1, 5);

-- TX 78af
INSERT INTO transfer VALUES
(DEFAULT, 2, 1, 2, 1, 5);

-- TX 9cb6
INSERT INTO transfer VALUES
(DEFAULT, 3, 2, 1, 2),
(DEFAULT, 3, 5, 1, 2);

-- TX 04aa
INSERT INTO transfer VALUES
(DEFAULT, 3, 7, 1, 3),
(DEFAULT, 7, 3, 2, 760);

-- TX af78
INSERT INTO transfer VALUES
(DEFAULT, 1, 4, 1, 5);

-- TX 9033
INSERT INTO transfer VALUES
(DEFAULT, 3, 6, 2, 540),
(DEFAULT, 3, 6, 1, 1);

-- TX acdf
INSERT INTO transfer VALUES
(DEFAULT, 5, 7, 1, 1),
(DEFAULT, 7, 5, 3, 2390);
`);

// EXCHANGE_RATE -- rate_id=id PK -- currency_id=id FK -- rate_to_valuta=kurs til USD --
await db.query(`
CREATE TABLE exchange_rate (
    rate_id SERIAL PRIMARY KEY,
    currency_id INTEGER REFERENCES currency(currency_id),
    rate_to_valuta NUMERIC NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

await db.query(`
INSERT INTO exchange_rate (currency_id, rate_to_valuta, timestamp) VALUES
(1, 2500, '2026-03-01T06:00:00Z'),
(2, 10, '2026-03-01T06:00:00Z'),
(3, 1, '2026-03-01T06:00:00Z'),

(1, 2300, '2026-03-03T06:00:00Z'),
(2, 9, '2026-03-03T06:00:00Z'),
(3, 1, '2026-03-03T06:00:00Z'),

(1, 2400, '2026-03-09T06:00:00Z'),
(2, 12, '2026-03-09T06:00:00Z'),
(3, 1, '2026-03-09T06:00:00Z');
`);

// TODO: import data from csv files into tables

await db.end();
console.log("Database successfully recreated.");
