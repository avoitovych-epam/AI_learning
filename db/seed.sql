-- Drop & recreate (safe for PoC only)
DROP TABLE IF EXISTS sales_orders;
DROP TABLE IF EXISTS inventory;

CREATE TABLE inventory (
  vehicle_id      TEXT PRIMARY KEY,
  make            TEXT NOT NULL,
  model           TEXT NOT NULL,
  year            INT NOT NULL,
  price           NUMERIC(12,2) NOT NULL,
  region          TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('available', 'sold'))
);

CREATE TABLE sales_orders (
  order_id        TEXT PRIMARY KEY,
  order_date      DATE NOT NULL,
  customer_name   TEXT NOT NULL,
  vehicle_id      TEXT NOT NULL REFERENCES inventory(vehicle_id),
  region          TEXT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  payment_type    TEXT NOT NULL CHECK (payment_type IN ('cash','loan','lease')),
  status          TEXT NOT NULL CHECK (status IN ('created','paid','cancelled'))
);

-- Inventory (small starter set)
INSERT INTO inventory(vehicle_id, make, model, year, price, region, status) VALUES
('V001','Toyota','Camry',2021,24500,'West','sold'),
('V002','Toyota','RAV4',2022,31900,'West','sold'),
('V003','Honda','Civic',2020,19900,'East','sold'),
('V004','BMW','X3',2021,42500,'North','sold'),
('V005','Tesla','Model 3',2022,38900,'South','sold'),
('V006','Ford','F-150',2021,35900,'West','available');

-- Sales Orders (analytics-ready)
INSERT INTO sales_orders(order_id, order_date, customer_name, vehicle_id, region, amount, payment_type, status) VALUES
('O1001','2026-03-02','Alice Green','V001','West',24500,'loan','paid'),
('O1002','2026-03-05','Bob Stone','V002','West',31900,'lease','paid'),
('O1003','2026-03-12','Chris Cole','V003','East',19900,'cash','paid'),
('O1004','2026-03-18','Dana Fox','V004','North',42500,'loan','paid'),
('O1005','2026-03-22','Evan Hall','V005','South',38900,'loan','paid'),
('O1006','2026-03-27','Frank Ives','V002','West',31900,'lease','paid');
