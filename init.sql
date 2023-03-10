USE finalProjectSubst;

CREATE TABLE products(
    id VARCHAR(36) PRIMARY KEY, 
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(150) NOT NULL,
    value FLOAT NOT NULL
);

INSERT INTO products(id, name, description, value) VALUES 
('1cf641f0-19a1-4699-94f6-5cc45c061ca8', 'Mochila', 'Mochila Black com compartimento para notebook', 200),
('9dc5bbbd-39f2-49ec-a8c2-7294b31e9385', 'Notebook', 'Core i9, 16 Gb DDR5', 3999.99),
('aee94fdd-fa8b-46c7-a6ad-c01e0f1c567e', 'Caneta', 'Bic Vermelha', 1.85);

CREATE TABLE users (
    id VARCHAR(355) PRIMARY KEY, 
    user VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(50) NOT NULL
);

INSERT INTO users (id, user, password) VALUES 
('1cf641f0-19a1-4699-94f6-5cc45c061ca8', 'admin', 'admin'),
('e37bbaa3-1428-4fdd-af10-d16e08d143e4', 'luissena', '!pasSW0rd!');
