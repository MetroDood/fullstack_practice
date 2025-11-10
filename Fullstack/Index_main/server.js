var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

//Configuração do MongoDB
var mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

const uri = `mongodb+srv://DBinahMaster:Beenah2121@dbinah.b5pytzf.mongodb.net/?appName=DBinah`; 

const client = new MongoClient(uri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true
});

let posts; 
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Conectado ao MongoDB com sucesso!");
        
        // Define o nome do banco de dados e da coleção do Blog
        const database = client.db('DBinahBlog'); 
        posts = database.collection('posts');
        
    } catch (e) {
        console.error("Erro ao conectar ao MongoDB:", e);
    }
}

connectToDatabase();

app.use(bodyParser.urlencoded({ extended: false}))
app.use(bodyParser.json())


app.use(express.static('./public')); 

app.set('view engine', 'ejs')
app.set('views', './views'); 

var server = http.createServer(app);
server.listen(80, () => {
    console.log('Servidor rodando na porta 80...'); 
});


app.get('/', function (requisicao, resposta){
    resposta.redirect('index.html') 
})

app.get('/cadastra', function (requisicao, resposta){
    resposta.redirect('/Cadastro.html'); 
})

app.get('/login', function (requisicao, resposta){
    resposta.redirect('/Login.html');
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

app.get('/blog', async function (req, resp) {
    if (!posts) {
        return resp.status(503).send("Serviço indisponível: Conexão com DB falhou.");
    }
    
    try {
        const allPosts = await posts.find({}).toArray();
        resp.render('blog', { posts: allPosts });
        
    } catch (err) {
        console.error("Erro ao buscar posts:", err);
        resp.render('blog', { posts: [], erro: "Erro ao carregar posts." });
    }
});

app.get('/cadastrar_post', function (req, resp){
    resp.redirect('/cadastrar_post.html'); 
});

app.post("/postar", async function(req, resp) {
    if (!posts) {
        return resp.render('resposta_post', {resposta: "Erro: Conexão com DB indisponível!"});
    }

    var data = { 
        titulo: req.body.titulo, 
        resumo: req.body.resumo, 
        conteudo: req.body.conteudo,
        data: new Date()
    };

    try {
        await posts.insertOne(data);

        resp.render('resposta_post', {
            resposta: `Post "${data.titulo}" cadastrado com sucesso!`
        });
        
    } catch (err) {
        console.error("Erro ao cadastrar post:", err);
        resp.render('resposta_post', {
            resposta: "Erro ao cadastrar post no banco de dados."
        });
    }
});