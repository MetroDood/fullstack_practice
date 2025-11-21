var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');

var app = express();

// MongoDB setup
var mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;

const uri = `mongodb+srv://DBinahMaster:Beenah2121@dbinah.b5pytzf.mongodb.net/?appName=DBinah`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

let posts, users, cars;

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Conectado ao MongoDB com sucesso!");
        const database = client.db('DBinahBlog');
        posts = database.collection('posts');
        users = database.collection('usuarios');
        cars = database.collection('carros');
    } catch (e) {
        console.error("Erro ao conectar ao MongoDB:", e);
    }
}
connectToDatabase();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'carros_secret_202511',
    resave: false,
    saveUninitialized: true
}));
// Arquivos estáticos (style.css e imagens)
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs')
app.set('views', './views'); 

// REDIRECT / para página de projetos
app.get('/', function (req, res) {
    res.redirect('cadastro_usuario');
});

// Página de projetos
app.get('/projects', function(req, res){
    res.render('projects');
});


// Rota: Página de cadastro de usuário
app.get('/usuario/cadastrar', function(req, res){
    res.render('cadastro_usuario');
});

// Rota POST: Realiza o cadastro
app.post('/usuario/cadastrar', async function(req, res){
    if(!users) return res.send("DB não disponível!");
    try {
        let { nome, login, senha } = req.body;
        // Não permite logins duplicados:
        const existe = await users.findOne({ login });
        if (existe) {
            return res.send('Login já existe.');
        }
        await users.insertOne({ nome, login, senha });
        res.send("Usuário cadastrado! <a href='/usuario/login'>Login</a>");
    } catch(e) {
        res.send("Erro: " + e);
    }
});

// Rota: Página de login
app.get('/usuario/login', function(req, res){
    res.render('login_usuario');
});

// POST: Login check
app.post('/usuario/login', async function(req, res){
    if(!users) return res.send("DB não disponível!");
    const { login, senha } = req.body;
    const user = await users.findOne({ login, senha });
    if(user) {
        req.session.auth = true;
        req.session.userlogin = user.login;
        req.session.username = user.nome;
        res.redirect('/carros/gerenciar');
    } else {
        res.send("Login ou senha inválidos! <a href='/usuario/login'>Tentar novamente</a>");
    }
});

// Logout
app.get('/logout', function(req, res){
    req.session.destroy(() => {
        res.redirect('/usuario/login');
    })
});

// Página pública que lista os carros
app.get('/carros/listar', async function(req, res){
    if(!cars) return res.send("DB não disponível!");
    let lista = await cars.find().toArray();
    res.render('lista_carros', { carros: lista });
});

// --- Middleware para proteger rotas -- admin/gerência
function authRequired(req, res, next) {
    if (req.session.auth) next();
    else res.redirect('/usuario/login');
}

// Painel de gerência dos carros (precisa estar logado)
app.get('/carros/gerenciar', authRequired, async function(req, res){
    if(!cars) return res.send("DB não disponível!");
    let lista = await cars.find().toArray();
    res.render('gerenciar_carros', { carros: lista, usuario: req.session.username });
});

// CRUD dos carros

// Cadastrar novo carro
app.post('/carros/cadastrar', authRequired, async function(req, res){
    if(!cars) return res.send("DB não disponível!");
    const { marca, modelo, ano, qtde_disponivel } = req.body;
    await cars.insertOne({
        marca,
        modelo,
        ano: parseInt(ano),
        qtde_disponivel: parseInt(qtde_disponivel)
    });
    res.redirect('/carros/gerenciar');
}); 

// Remover carro
app.post('/carros/remover/:id', authRequired, async function(req, res){
    if(!cars) return res.send("DB não disponível!");
    await cars.deleteOne({_id: new ObjectId(req.params.id)});
    res.redirect('/carros/gerenciar');
});

// Atualizar dados do carro
app.post('/carros/atualizar/:id', authRequired, async function(req, res){
    if(!cars) return res.send("DB não disponível!");
    const { marca, modelo, ano, qtde_disponivel } = req.body;
    await cars.updateOne({_id: new ObjectId(req.params.id)}, {
        $set: {
            marca,
            modelo,
            ano: parseInt(ano),
            qtde_disponivel: parseInt(qtde_disponivel)
        }
    });
    res.redirect('/carros/gerenciar');
});

// Vender um carro
app.post('/carros/vender/:id', authRequired, async function(req, res){
    if(!cars) return res.send("DB não disponível!");
    let carro = await cars.findOne({_id: new ObjectId(req.params.id)});
    if (carro.qtde_disponivel > 0) {
        await cars.updateOne({_id: new ObjectId(req.params.id)}, { $inc: { qtde_disponivel: -1 }});
    }
    res.redirect('/carros/gerenciar');
});

// ----------------------------------------------------
// Blog 

// Página de Blog: lista posts
app.get('/blog', async function(req, resp) {
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

// Formulário de cadastro de Post
app.get('/cadastrar_post', function (req, resp) {
    resp.redirect('/cadastrar_post.html');
});

// Cadastrar novo post no blog
app.post("/postar", async function(req, resp) {
    if (!posts) {
        return resp.render('resposta_post', { resposta: "Erro: Conexão com DB indisponível!" });
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

// Páginas antigas
app.get('/cadastra', function (req, resposta){
    resposta.redirect('/Cadastro.html');
});
app.get('/login', function (req, resposta){
    resposta.redirect('/Login.html');
});

// Página padrão antiga (não uso)
app.get('/cadastro-submit', function (requisicao, resposta){
    var username = requisicao.query.username;
    var password = requisicao.query.password;
    resposta.render('resposta_cadastro', {username, password})
});

var server = http.createServer(app);
server.listen(80, () => {
    console.log('Servidor rodando na porta 80...');
});