var http = require('http'); 

const express = require('express') 
const app = express()
const port = 3001

const db = require("./db");
const cript = require("./cript");
require('dotenv').config();

// Utilizar método de autenticação com a biblioteca OAuth;
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

var cookieParser = require('cookie-parser'); 
const bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());
app.use(cookieParser());

const fs = require('fs');
const { randomUUID } = require('crypto');


// Implementando RateLimit para bloquear excesso de requisições de um mesmo IP;
// Entrega do item 4 do trabalho;
var RateLimit = require('express-rate-limit');

// Limite de requisições:
var limiter = new RateLimit({
    windowMs: 15*60*1000,
    max: 20,
    delayMs: 0,
    message: "Too many accounts created from this IP, please try again after an hour"
});

app.use(limiter);

var https = require('https');
var key  = fs.readFileSync('./node-product-api/sslcert/mySecret.key', 'utf8');
var secret = fs.readFileSync('./node-product-api/sslcert/private_key.pem', 'utf8');
var certificate = fs.readFileSync('./node-product-api/sslcert/test.crt', 'utf8');

var credentials = {key: key, cert: certificate};

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(port);

const checkScopes = requiredScopes(['openid']);
const checkJwt = auth({
    issuerBaseURL: process.env.issuerBaseURL,
    audience: process.env.audience,
    secret: secret,
    tokenSigningAlg: 'HS256'
});


app.get('/', checkJwt, checkScopes, async (req, res, next)  => {
    res.send('Hello World!')
  });

  

app.get('/products', checkJwt, checkScopes, async (req, res, next) => { 
    var resp = await db.getAllProducts();
    res.status(200).json(resp);
});

app.post('/products', checkJwt, checkScopes, async (req, res, next) => { 

    if(!req.body.name){
        return res.status(400).json({error: "Nome do produto obrigatório", message: "Deve conter um nome o produto"});
    }

    if(!req.body.description){
        return res.status(422).json({error: "Descricao do produto obrigatório", message: "Deve conter uma breve descricao"});
    }

    if(!req.body.value){
        return res.status(422).json({error: "Valor do produto Obrigatório", message: "Deve conter um valor em reais"});
    }

    try{
        var name = req.body.name;
        var description = req.body.description
        var value = req.body.value
        
        await db.insertProduct(name, description, value);
        return res.status(200).json({message: 'Produto cadastrado com sucesso!'});

    }catch(err){
        return res.status(err.code).json({message: err});
    }
});


app.get('/products/:id', checkJwt, checkScopes, async (req, res, next) => { 

    try{
        var id = req.params.id;
        const [rows] = await db.getProductById(id);
        if(rows){
            return res.status(200).send(rows);
        }
        return res.status(404).send(`Produto ${id} não encontrado!`);
    }catch(err){
        return res.status(err.code).json(err);
    }
});

app.put('/products/:id', checkJwt, checkScopes, async (req, res, next) => { 

    try{
        var id = req.params.id;

        var name = req.body.name;
        var description = req.body.description
        var value = req.body.value
        
        const rows = await db.updateProductById(id, name, description, value);
        if(rows){
            return res.status(200).send({message: "Produto atualizado com sucesso!"});
        }
        return res.status(404).send(`Produto ${id} atualizado com sucesso!`);
    }catch(err){
        return res.status(err.code).json(err);
    }
});

app.delete('/products/:id', checkJwt, checkScopes, async (req, res, next) => {

    try{
        var id = req.params.id;
        const [rows] = await db.getProductById(id);

        if (!rows) return res.status(401).send({ message: 'Produto inexistente' });
        await db.deleteProductById(id);
        return res.status(200).send({message: `Produto ${id} deletado com sucesso!`}); 

    } catch(err){
        return res.status(err.code).json(err);
    }
});

app.get('/users', checkJwt, checkScopes, async (req, res, next) => {
    try {
        console.log('LOG => USERS');
        console.log("Retornou todos usuarios!");
        var resp = await db.selectUsers()
        res.status(200).json(resp);
    } catch (error) {
        console.log('LOG => USERS_ERROR: ', error);
    }
});

app.post('/register', async (req, res, next) => { 

    if(!req.body.username.match("^[A-Za-z0-9]{5,}")){
        return res.status(400).json({error: "Usuário Inválido", message: "Deve conter ao menos 5 caracteres entre maiúsculas, minúsculas e numéricos e caracteres especiais"});
    }

    if(!req.body.password.match("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{10,})")){
        return res.status(422).json({error: "A senha é muito fraca", message: "Deve conter ao menos 10 caracteres entre maiúsculas, minúsculas, numéricos e caracteres especiais"});
    }

    try{
        const users = await db.insertUser(req.body.username, cript.hash(req.body.password));
        if(users.affectedRows){ 
            console.log(`Usuário ${req.body.username} registrado com sucesso!`);
            return res.status(201).send({ message: `Usuário '${req.body.username}' registrado com sucesso!` });
        }
    }catch(err){
        return res.status(err.code).json(err);
    }
});

app.post('/login', async (req, res, next) => { 
    try {
        console.log('LOG => LOGIN: ', { req: req.body });
        const users = await db.selectUserByLogin(req.body.username);
        console.log('LOG => USERS: ', { users });
        if(users.length && cript.validate(users[0].password, req.body.password)){ 
            const user = users[0].id;
            const sub = randomUUID();
            const jti = randomUUID();
            const iss = process.env.ISSUER_BASE_URL;
            const client_id = users[0].id;
            const aud = [process.env.AUDIENCE];
            const scope = 'openid';
            var token = jwt.sign({ user,sub,jti, iss, client_id, aud, scope }, secret, {
                expiresIn: 60 * 30,
                algorithm:  "HS256"
            });
            console.log("Fez login e gerou token!");
            return res.status(200).send({ auth: true, token: token });
        }
        console.log("Erro 401 - Unautorized!");
        return res.status(401).send('Login inválido!');
    } catch (error) {
        console.log('LOG => LOGIN_ERROR: ', error);
        return res.status(401).send('Falha ao realizar Login!');
    }
});    

app.post('/logout', function(req, res, next) { 
    console.log("Fez logout e cancelou o token!");
    res.status(200).send({ auth: false, token: "" }); 
});