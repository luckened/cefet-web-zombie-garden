// módulos da plataforma
import path from 'path'

// módulos npm
import express from 'express'
import hbs from 'hbs'
import logger from 'morgan'
import session from 'express-session'
import methodOverride from 'method-override'
import flash from 'connect-flash'


// outros módulos da aplicação
import { resetDb } from './db-utils.js'


// a definição das rotas de cada "entidade" está isolada em seu próprio arquivo
// de forma a tornar o código do projeto organizado
import index from './routes/index.js'
import people from './routes/people.js'
import zombies from './routes/zombies.js'



const app = express()
const __dirname = "./";

// configura a pasta que contém as views e o handlebars como templating engine
app.set('views', `${__dirname}/views`)
app.set('view engine', 'hbs')
hbs.registerPartials(`${__dirname}/views/partials`, console.error)
app.set('json spaces', 2);

// possibilita enviar um DELETE via formulário,
// quando é um POST com ?_method=DELETE na querystring
//
// isto é necessário porque formulários aceitam apenas GET e POST
app.use(methodOverride('_method', { methods: ['GET', 'POST'] }))
app.use(logger('dev'))                                    // registra tudo no terminal
app.use(express.json())                                   // necessário pra POST, PUT, PATCH etc.
app.use(express.urlencoded({ extended: false }))
app.use(session({                                         // necessário para flash()
  secret: 'lalala',
  resave: false,
  saveUninitialized: true
}))
app.use(flash())                                          // necessário para msgs efêmeras
app.use(express.static(path.join(__dirname, 'public')))   // serve arquivos estáticos


// configura as rotas "de cada entidade" da aplicação (separadinho, organizado)
app.use('/', index)
app.use('/people', people)
app.use('/zombies', zombies)
app.use('/db/reset', async (req, res) => {
  try {
    await resetDb()
    req.flash('success', 'Banco de dados restaurado ao estado original.')

  } catch (error) {
    req.flash('error', error.friendlyMessage ?? error.message)

  } finally {
    res.redirect('back')
  }
})

// uma rota "catch-all" para erros de caminho inexistente
app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// handler de erros em ambientes de dev
// imprime a stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    const message = err.friendlyMessage ? [err.friendlyMessage, err.message].join('. ') : err.message
    res.status(err.status || 500)
    res.render('error', {
      message: message,
      error: err
    })
  })
}

// handler de erros de ambiente de produção
// não mostra a stack de erros pro usuário
app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.render('error', {
    message: err.friendlyMessage ?? err.message,
    error: {}
  })
})


export default app
