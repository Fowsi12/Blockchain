 //Create tables HERUNDER

// CURRENCY, currency_id= hvilket nr navnet på valutaen får, name=ETH, LINK eller USD, symbol= Forkortelserne af valutaen,
await db.query(`
CREATE TABLE currency (
    currency_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL);
`);

// ADDRESS, address_id=id PK -- public_key=unik tekststreng der repræsenterer adressen (f.eks. en wallet-adresse) -- UNIQUE for at sikre at der ikke kan være to rækker med samme public_key
await db.query(`
CREATE TABLE address (
    address_id SERIAL PRIMARY KEY,
    public_key TEXT UNIQUE NOT NULL
);
`);

//BLOCK, block_id=id PK -- previous_hash=hash på forrige blok -- hash=hash på blokken -- timestamp=tiden for oprettelsen af blokken
await db.query(`
CREATE TABLE block (
    block_id SERIAL PRIMARY KEY,
    previous_hash TEXT,
    hash TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
`);

// ACCOUNT_BALANCE, address_id=FK -- currency_id=FK -- balance=antal valuta på adressen -- PRIMARY KEY (address_id, currency_id) for at sikre at der kun er én række per adresse og valuta
await db.query(`
CREATE TABLE account_balance (
    address_id INTEGER REFERENCES address(address_id),
    currency_id INTEGER REFERENCES currency(currency_id),
    balance NUMERIC NOT NULL DEFAULT 0,
    PRIMARY KEY (address_id, currency_id)
    );
`);

//TRANSACTION, transaction_hash=unik tekststreng der repræsenterer transaktionen -- block_id=FK der refererer til den blok transaktionen er en del af
await db.query(`
CREATE TABLE transaction (
    transaction_hash TEXT PRIMARY KEY,
    block_id INTEGER REFERENCES block(block_id)
);
`);

// EXCHANGE_RATE -- currency_id=id FK -- rate_to_valuta=kurs på valutaen --
await db.query(`
CREATE TABLE exchange_rate (
    currency_id INTEGER REFERENCES currency(currency_id),
    rate_to_valuta NUMERIC NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);


// Ved ikke om den har brug for den PK, men nu har vi den.
// TRANSFER, transfer_id=id PK -- transaction_hash=FK -- sender_id=FK -- receiver_id=FK -- currency_id=FK -- amount=antal valuta der overføres -- timestamp=tiden for overførslen (vigtigt for at have med til en af de sidste opgaver)
await db.query(`
CREATE TABLE transfer (
    transfer_id SERIAL PRIMARY KEY, 
    transaction_hash TEXT REFERENCES transaction(transaction_hash),
    sender_id INTEGER REFERENCES address(address_id),
    receiver_id INTEGER REFERENCES address(address_id),
    currency_id INTEGER REFERENCES currency(currency_id),
    amount NUMERIC NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
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
INSERT INTO transfer (transaction_hash, sender_id, receiver_id, currency_id, amount, timestamp) VALUES
('5ac6', 1, 2, 1, 5, '2026-03-01T07:30:00Z'),

('78af', 1, 2, 1, 5, '2026-03-03T14:00:00Z'),

('9cb6', 2, 3, 1, 2, '2026-03-03T14:00:00Z'),
('9cb6', 2, 5, 1, 2, '2026-03-03T14:00:00Z'),

('04aa', 2, 7, 1, 3, '2026-03-03T14:00:00Z'),
('04aa', 7, 2, 2, 760, '2026-03-03T14:00:00Z'),

('af78', 1, 4, 1, 5, '2026-03-09T22:30:00Z'),

('9033', 2, 6, 2, 540, '2026-03-09T22:30:00Z'),
('9033', 2, 6, 1, 1, '2026-03-09T22:30:00Z'),

('acdf', 5, 7, 1, 1, '2026-03-09T22:30:00Z'),
('acdf', 7, 5, 3, 2390, '2026-03-09T22:30:00Z');
`);

await db.query(`
INSERT INTO account_balance (address_id, currency_id, balance)
SELECT
  a.address_id,
  t.currency_id,
  SUM(CASE
      WHEN t.sender_id = a.address_id THEN -t.amount
      WHEN t.receiver_id = a.address_id THEN t.amount
      ELSE 0
    END
  ) AS balance
FROM transfer t
JOIN address a
  ON a.address_id = t.sender_id
  OR a.address_id = t.receiver_id
GROUP BY a.address_id, t.currency_id;
`);