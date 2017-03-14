# Webpack

## webpack-dev-server
O webpack-dev-server é uma ferramenta que permite a gente subir um servidor web em cima das configurações do webpack. Há duas formas de configurar: Live/hot Reload e Hot Module Replacement (HRM).

Antes de entrar em cada um, é necessário fazer a instalação do Webpack-dev-server como depedência de desenvolvimento.

```bash
$ yarn add -S -D webpack-dev-server
```

### Live/Hot Reload
É um modo mais antigo (e mais fácil também) de fazer o carregamento. Assim, o webpack-dev-server(wpds) fica olhando para a os arquivos nas pastas e quando algum deles sofrer alteração, o _bundle_ é gerado novamente e a página é recarregada completamente.

#### HOW-TO-DO

Para esse módulo, você deve ter a configuração básica do webpack, como a abaixo:

```javascript
const path = require('path')

module.exports = {
  entry: './src/index.js', // Arquivo de entrada (boostrap da aplicação)
  output: { // configurações de saída
    path: path.join(__dirname, 'dist'), // Localização da pasta onde será gerado os bundles
    publicPath: '/dist/', // A pasta
    filename: 'bundle.js' // O nome do arquivo do bundle que será gerado.
  }
}
```

1. Adicione o script abaixo no `package.json`:

```json
"dev": "webpack-dev-server"
```

2. Rode o comando `yarn dev`

Dessa maneira, o **webpack-dev-server** ficará observando qualquer alteração feita nos arquivos e quando a mesma ocorrer, um novo bundle será gerado e a página será recarregada.

### Hot Module Replacement (HMR)
O Hot Module Replacement (HRM), é um pouco mais complexo, pois, ele trabalha com o esquema de **chunks**. Chunks são pequenos arquivos (enviados via stream) contendo uma informação. Assim, ele faz um canal websocket que monitora o estado da página e os arquivos do projeto. Quando algum arquivo for alterado, o **webpack-dev-server** vai criar um chunk apenas com a alteração e enviar para o navegador, alterando apenas os estados da página (conceito reativo) e recarregando somente aquele pedaço.

#### HOW-TO-DO
Para fazer dessa maneira, será necessário fazer algumas alterações na configuração do webpack e criar um arquivo de configuração para o **webpack-dev-server** chamado `dev-server.js`.

1. Crie um arquivo no root do projeto chamado `dev-server.js` com o boilerplate abaixo:
```javascript
const WebPackDevServer = require('webpack-dev-server')
const webpack = require('webpack')
const config = require('./webpack.config.js') // especifique o local da configuração do webpack
const path = require('path')

const compiler = webpack(config) // passa a configuração para o módulo do webpack
const server = new WebPackDevServer(compiler, { //Configuração do serveidor passando o webpack configurado
  hot: true,
  filename: config.output.filename, // Pega o filename da configuração do wp
  publicPath: config.output.publicPath, // Pega o PublicPath da configuração do wp
  stats: {
    colors: true
  }
})
server.listen(8080, 'localhost', function () {}) // Adiciona um listener na porta 8080

```
2. Faça as alterações abaixo no `webpack.config.js`:

```javascript
const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: [
    './src/index.js',
    'webpack/hot/dev-server', // injeção do webpack-dev-server que fará a ponte dos chunks
    'webpack-dev-server/client?http://localhost:8080' //endereço que o wpds ouvirá
  ],
  plugins: [
    new webpack.HotModuleReplacementPlugin() //Instancia o module de HMR
  ], 
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: 'bundle.js'
  }
}
```
3. além disso, no arquivo de boostrap do seu projeto, será necessário fazer a inserção do código abaixo para validar se o websocket está aberto:
```javascript
/*
...
your code above
...
*/
if (module.hot) {
  module
    .hot
    .accept()
}
/*end file*/
```
4. No `package.json`, crie o script abaixo:

```json
"dev": "node dev-server.js" 
```

5. Agora basta rodar o comando `$ yarn dev`, que será iniciado o server no `localhost:8080`.

### O problema gerado pelo Hot Module Replacement(HRM)
É uma estratégia bem interessante fazer uso do HRM, porém, ele gera um problema na hora de dar build no nosso bundle. O código utilizado por ele para montar o websocket e transmitir os chunks, gera aproximadamente 12 mil linhas. 

Se tratando de uma funcionalidade totalmente voltada para desenvolvendo, não faz sentido fazer o build da aplicação com esse código. Assim, para contornar a situação e blindar o build desse tipo de contratempo, uma boa prática é definir quais as entradas e plugins para cada ambiente, e, na hora de executar os scripts do `package.json`, passar qual o ambiente estamos utilizando e verificando através de um [operador ternário](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Operators/Operador_Condicional)

```javascript
/*webpack.config.js*/
const path = require('path')
const webpack = require('webpack')
// Definição de uma constate que irá receber o NODE_ENVIROMENT
const PRODUCTION = process.env.NODE_ENV === 'production'

/*
Validar se é produção - ENTRADA
Se for, passa só o arquivo boostrap para gerar o bundle
Se não, passa as configurações do webpack-dev-server
*/
const entry = PRODUCTION
  ? ['./src/index.js']
  : ['webpack/hot/dev-server', 'webpack-dev-server/client?http://localhost:8080']

/*
Validar se é produção - PLUGINS
Se for, passa somente os plugins de produção (ainda não temos nenhum)
Se não, ativa o HRM
*/
const plugins = PRODUCTION
  ? []
  : [new webpack.HotModuleReplacementPlugin()]

module.exports = {
  entry: entry,
  plugins: plugins,
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: 'bundle.js'
  }
}

```

Agora, precisamos alterar também os scripts de `build` e `dev`, passando antes qual é o ambiente em questão:

```json
  /*package.json*/

  "scripts": {
    "build": "rimraf dist/bundle.js && NODE_ENV='production' webpack",
    "dev": "rimraf dist/bundle.js && NODE_ENV='development' node dev-server.js"
  }
```

## Transpile ES6: BabelJS
É sabído que os browsers não implementam as especificações ECMA na mesma velocidade que elas saem. Isso significa que apesar de ser lançada toda vez novas versões e funcionalidades para Javascript, não são todos os browsers que as implementam, e, como somos bons desenvolvedores, precisamos pensar em todos os browsers (possíveis né?) para dar suporte.

Assim, nasceu a necessidade do transpiler, que nada mais é do que pegar um código atual (ES6,7+..) e colocar no ES5, que a todos os browseres possuem 100% implementado.

Dessa forma, para codarmos um código novo com novas funcionalidades e mesmo assim garantir suporte, basta utilizarmos um transpiler, que no caso em questão, será o BabelJS.

### Dependências
São necessárias algumas dependências para o transpile acontecer junto com o Webpack, são elas:
* **babel-core**: É o transpiler em si
* **babel-loader**: É o loader que será usado pelo webpack para fazer o processo
* **babel-preset-2015**: É o preset que identifica para qual versão queremos ir
* **babel-preset-stage-0**: É o preset que identifica para qual versão queremos ir

Assim, para adicionarmos a dependência, basta utilizar o comando abaixo:
```bash
$ yarn add -S -D babel-core babel-loader babel-preset-es2015 babel-preset-stage-0
```

Instalada as dependências, precisamos criar um arquivo de configuração para o babel chamado `.babelrc`:

```json
/* .babelrc */

{
  "presets": ["es2015","stage-0"]
}
```

Agora, é preciso informar o webpack de que ele deverá usar o babel para transpilar o código e aí então, gerar para produção:

```javascript
const path = require('path')
const webpack = require('webpack')

const PRODUCTION = process.env.NODE_ENV === 'production'

const entry = PRODUCTION
  ? ['./src/index.js']
  : ['./src/index.js', 'webpack/hot/dev-server', 'webpack-dev-server/client?http://localhost:8080']

const plugins = PRODUCTION
  ? []
  : [new webpack.HotModuleReplacementPlugin()]

module.exports = {
  entry: entry,
  plugins: plugins,
  //Novidades aqui (babel)
  module: {
    loaders:[{ // Recebe um array de objetos contendo loaders
      test: /\.js$/, // Qual arquivo passará pelo loader (todos os js)
      loaders: ['babel-loader'], // quais são as ferramentas de load que utilizaremos nesse objeto
      exclude: '/node_modules/' // Quais arquivos NÃO passarão pelo loader
    }]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: 'bundle.js'
  }
}

```
Feito essa configuração, agora será possível utilizar todos os benefícios do ES6+ para codar de forma mais limpa e organizada, inclusive, usando o sistema de módulos do ES6 para fazer o import e export de componentes e funções.

## Source-map
Como vimos até aqui, o bundle gera um código totalmente diferente do que escrevemos. Assim, caso dê algum erro, o stack do erro será no bundle. Como podemos identificar um bug em um arquivo transpilado e gerado? 

É nesse caso que entra o **source-map**. É exatamente o que o nome diz, um mapa do código, onde ele consegue relacionar o código gerado com o código que você escreveu. Assim, caso você imprima algo no console ou dê algum erro, ao clicar no trace para exibição, você será direcionado para o seu código.

Para ativar o source-map, basta adicionar a seguinte opção dentro do export do módulo de nossa configuração:

```javascript
/*webpack.config.js*/
module.exports = {
  devtool: 'source-map', //Essa configuração
  entry: entry,
  plugins: plugins,
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: '/node_modules/'
      }
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: 'bundle.js'
  }
}

```
