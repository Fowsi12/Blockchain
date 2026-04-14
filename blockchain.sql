   // CURRENCY, currency_id=id, name=, symbol=,
await db.query(`
CREATE TABLE currency (
    currency_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL);
`);

// ADDRESS, address_id=id -- public_key=address -- balance=amount
await db.query(`
CREATE TABLE address (
    address_id SERIAL PRIMARY KEY,
    public_key TEXT UNIQUE NOT NULL
);
`);

//BLOCK, block_id=, previous_hash=, hash=, timestamp=,
await db.query(`
CREATE TABLE block (
    block_id SERIAL PRIMARY KEY,
    previous_hash TEXT,
    hash TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
`);

//TRANSACTION, transaction_id=, block_id=,
await db.query(`
CREATE TABLE transaction (
    transaction_hash TEXT PRIMARY KEY,
    block_id INTEGER REFERENCES block(block_id)
);
`);

// EXCHANGE_RATE -- rate_id=id PK -- currency_id=id FK -- rate_to_valuta=kurs til USD --
await db.query(`
CREATE TABLE exchange_rate (
    currency_id INTEGER REFERENCES currency(currency_id),
    rate_to_valuta NUMERIC NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

await db.query(`
CREATE TABLE transfer (
    transfer_id SERIAL PRIMARY KEY,
    transaction_hash TEXT REFERENCES transaction(transaction_hash),
    sender_id INTEGER REFERENCES address(address_id),
    receiver_id INTEGER REFERENCES address(address_id),
    currency_id INTEGER REFERENCES currency(currency_id),
    amount NUMERIC NOT NULL);
`);

                        //Insert into tables HERUNDER

await db.query(`
INSERT INTO currency (currency_id, name, symbol) VALUES
(1, 'Ethereum', 'ETH'),
(2, 'Chainlink', 'LINK'),
(3, 'USD Coin', 'USDC');
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

await db.query(`
INSERT INTO block (block_id, hash, previous_hash, timestamp) VALUES
(0, '000ffe7', NULL, '2026-03-01T07:30:00Z'),
(1, '0002a81', '000ffe7', '2026-03-03T14:00:00Z'),
(2, '0003bb6', '0002a81', '2026-03-09T22:30:00Z');
`);

await db.query(`
INSERT INTO transaction (transaction_hash, block_id) VALUES
('5ac6', 0),

('78af', 1),
('9cb6', 1),
('04aa', 1),

('af78', 2),
('9033', 2),
('acdf', 2);
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

await db.query(`
INSERT INTO transfer (transaction_hash, sender_id, receiver_id, currency_id, amount) VALUES
('5ac6', 1, 2, 1, 5),

('78af', 1, 2, 1, 5),

('9cb6', 2, 3, 1, 2),
('9cb6', 2, 5, 1, 2),

('04aa', 2, 7, 1, 3),
('04aa', 7, 2, 2, 760),

('af78', 1, 4, 1, 5),

('9033', 2, 6, 2, 540),
('9033', 2, 6, 1, 1),

('acdf', 5, 7, 1, 1),
('acdf', 7, 5, 3, 2390);
`);
