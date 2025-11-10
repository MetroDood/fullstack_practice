var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({ extended: false}))
app.use(bodyParser.json())

app.use(express.static('./public')); 

app.set('view engine', 'ejs')
app.set('views', './views'); 
var server = http.createServer(app);
server.listen(80);

console.log('Servidor rodando na porta 80...');

app.get('/', function (requisicao, resposta){
	resposta.redirect('index.html') 
})

app.get('/cadastra', function (requisicao, resposta){
    resposta.redirect('/login/cadastro.html'); 
})


app.get('/login', function (requisicao, resposta){
    resposta.redirect('/login/login.html');
})

app.get('/cadastro-submit', function (requisicao, resposta){
    var username = requisicao.query.username;
    var password = requisicao.query.password;
    
    resposta.render('resposta_cadastro', {username, password})
})


app.post('/login', function (requisicao, resposta){
    var username = requisicao.body.username;
    var password = requisicao.body.password;

    if (username === 'admin' && password === '12345') {
        resposta.render('resposta', {
            status: 'Sucesso',
            mensagem: `Bem-vindo(a), ${username}!`
        });
    } else {
        resposta.render('resposta', {
            status: 'Falha',
            mensagem: 'Nome de usuário ou senha incorretos.'
        });
    }
})