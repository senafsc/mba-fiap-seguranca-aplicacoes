const { randomUUID } = require('crypto');

async function connect(){
    if(global.connection && global.connection.state !== 'disconnected')
        return global.connection;
 
    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: 8081,
        user: 'test',
        password: 'test',
        database: 'finalProjectSubst',
        multipleStatements: true
      } );
    console.log("Conectou no MySQL!");
    global.connection = connection;
    return connection;
}

async function getAllProducts(){
    const conn = await connect();
    
    const query = `SELECT * FROM products LIMIT 1000;`;
    console.log(`Executando query: ${query}`);

    const [rows, fields] = await connection.execute(query);
    console.log(`Rows: ${JSON.stringify(rows)}`);
    return rows;
}

async function getProductById(id){
    const conn = await connect();
    console.log('LOG => GET_PRODUCT: ', { id });
    const query = `SELECT * FROM products WHERE id = ?`;
    console.log(`Executando query: ${query}`);

    // if (id.length !== 36) throw {code: 500, message: 'Id do produto é inválido!'}; 
    try {
        const [rows, fields] = await connection.execute(query, [id]);
        return rows;
    } catch(error) {
        throw {code: 500, message: 'Erro inesperado ao tentar consultar um produto'};
    }
}


async function updateProductById(id, name, description, value){
    try{
        const conn = await connect();
        const query = `UPDATE products SET name = ?, description = ?, value = ? WHERE id = ?;`;
        const values = [name, description, value, id];
        console.log(`Executando query: ${query}`);
        
        const [rows] = await conn.execute(query, values);
        return rows;
    } catch(err){
        throw {code: 500, message: 'Erro inesperado ao tentar cadastrar usuário'};
    }
}

async function deleteProductById(id){
    const conn = await connect();
    
    const query = `DELETE FROM products WHERE id = ?;`;
    const values = [id];
    console.log(`Executando query: ${query}`);

    await connection.execute(query, values);
}

async function insertProduct(name, description, value){
    const conn = await connect();

    const query = `INSERT INTO products(id, name, description, value) VALUES (?, ?, ?, ?);`;
    const values = [randomUUID(), name, description, value];
    console.log(`Executando query: ${query}`);

    try{
        await connection.execute(query, values);
    } catch(err){
        if(err.errno === 1062){
            throw {code: 400, message: 'Já existe um produto cadastrado com este usuário!'};
        }else{
            throw {code: 500, message: 'Erro inesperado ao tentar cadastrar usuário'};
        }
    }
}

async function selectUsers(){
    const conn = await connect();
    
    const query = `SELECT * FROM users LIMIT 1000;`;
    console.log(`Executando query: ${query}`);

    const [rows, fields] = await connection.execute(query);
    console.log(`Rows: ${JSON.stringify(rows)}`);
    return rows;
}

async function selectUserByLogin(user){
    const conn = await connect();
    
    const query = "SELECT * FROM `users` WHERE `user` = ?;";
    console.log(`Executando query: ${query}`);
    
    const [rows, fields] = await connection.execute(query, [user]);

    return rows;
}

async function insertUser(user, password){
    const conn = await connect();

    const query = "INSERT INTO users(id, user, password) VALUES (?, ?, ?);";
    console.log(`Executando query: ${query}`);

    try{
        const [rows, fields] = await connection.execute(query, [randomUUID(), user, password]);
        return rows;
    } catch(err){
        if(err.errno === 1062){
            throw {code: 500, message: 'Erro ao cadastrar usuário: Usuário já existe'};
        }else{
            throw {code: 500, message: 'Erro inesperado ao tentar cadastrar usuário'};
        }
    }
}

module.exports = {getProductById, getAllProducts, insertProduct, updateProductById, deleteProductById, selectUserByLogin, selectUsers, insertUser}
