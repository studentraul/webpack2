# Webpack

## Intro
...ESCREVER...

## rimraf
O [rimraf](https://github.com/isaacs/rimraf) é uma biblioteca npm que permite a gente executar comandos UNIX através do nodejs. É possível também adiciona-lo como depedência e adicionar comandos unix e rodar em qualquer ambiente que execute o nodejs.
 
A grande vantagem é que como ele roda em cima do Nodejs e o mesmo roda em qualquer plataforma, nossos scripts NPM não ficarão restritos a nenhum Sistema Operacional. Seu uso mais simples em um projeto é apagar arquivos e pastas, que é o que será implentado aqui.

Antes de mais nada, criaremos um script para constuir (build) o projeto e outro para subir um servidor web de desenvolvimento. Assim, teremos dois scripts no **package.json**:

```json
  "scripts": {
    "build": "rimraf rmdir dist/ && NODE_ENV='production' webpack",
    "dev": "rimraf rmdir dist/ && NODE_ENV='development' node dev-server.js"
  }
```

Uma boa prática, é sempre apagar o bundle gerado antes de gerar um novo com as novas correções e implementações. Por via de garantia de gerar todos os arquivos corretamente, utilizamos o comando `rimraf rmdir` para apagar a pasta `dist` (ficarão os arquivos que serão distribuidos) inteira, seguida da definição de ambiente e execução dos comandos.

## webpack-dev-server
O webpack-dev-server é uma ferramenta que permite a gente subir um servidor web em cima das configurações do webpack. Há duas formas de configurar: Live/hot Reload e Hot Module Replacement (HRM).

Antes de entrar em cada um, é necessário fazer a instalação do Webpack-dev-server como depedência de desenvolvimento.

```bash
$ yarn add -S -D webpack-dev-server
```

## Live/Hot Reload
É um modo mais antigo (e mais fácil também) de fazer o carregamento. Assim, o webpack-dev-server(wpds) fica olhando para a os arquivos nas pastas e quando algum deles sofrer alteração, o _bundle_ é gerado novamente e a página é recarregada completamente.

### HOW-TO-DO

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

## Hot Module Replacement (HMR)
O Hot Module Replacement (HRM), é um pouco mais complexo, pois, ele trabalha com o esquema de **chunks**. Chunks são pequenos arquivos (enviados via stream) contendo uma informação. Assim, ele faz um canal websocket que monitora o estado da página e os arquivos do projeto. Quando algum arquivo for alterado, o **webpack-dev-server** vai criar um chunk apenas com a alteração e enviar para o navegador, alterando apenas os estados da página (conceito reativo) e recarregando somente aquele pedaço.

### HOW-TO-DO
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

## Tree-shaking

### WTF?
O tree-shaking foi uma forma que RollupJS (module bundle) criou de fazer a exclusão de código javascript morto. Mas o que é um código morto? Bem, um código morto é aquele aquela função escrita e nunca chamada em outra parte do código, é aquele if que só pode dar false.

[Neste artigo](https://medium.com/@Rich_Harris/tree-shaking-versus-dead-code-elimination-d3765df85c80#.twae6q27z), o Rich Harris (criador do RollupJS), explica a diferença entre excluir um código morto ou fazer um Tree-shaking. Basicamente, no primeiro caso, você remove o código obsoleto depois do bundle pronto, e no segundo, você primeiro faz a análise do código, pra daí então gerar o bundler.

Segundo ele, os testes dos dois casos mostraram que fazer o Tree-shaking gera melhores resultados.

### Ok, mas e a vantagem?
Bem, a vantagem dessa abordagem é justamente gerar um bundle com menos código, ou seja, as funções que não são usadas (mas precisam existir), não são necessárias na nossa aplicação. Veja um exemplo:

```javascript
/*mathStuffs.js*/
export function sum(a,b) { return a + b }
export function sub(a,b) { return a - b }
export function mult(a,b) { return a * b }
```

```javascript
/*index.js*/
import {mult} from './mathSuffs'

console.log(mult(2,3));
```

Como estamos utilizando o babel para gerar o módulo, ele vai pegar nosso código e colocar nos moldes do ES2015. Para fazer a conversão da importação de módulos, ele usa o padrão do CommonJS. Esse por sua vez, não vai fazer nada semelhante ao Tree-shaking, e no fim, vai gerar um bundle com as 3 funções, mesmo que utilizamos apenas 1 delas.

Para evitar esse tipo de comportamento, precisamos - no `.babelrc` - desabilitar a opção dos módulos. Ele ficará da seguinte forma:

```json
{
  "presets": [
    ["es2015", { // Novo código aqui
      "modules": false // Informa ao babel não fazer conversão de ES6 Modules -> CommonJS
    }], "stage-0"
  ]
}
```

Agora, quando o webpack for gerar o bundle, ele passará a utilizar o conceito do Tree-shaking. Mas isso não é o suficiente. Para fazer uso de tal estratégia, teremos que configurar no webpack o uso do UgglifyJS (tema do próximo tópico).


## UglifyJS

Quando vamos fazer a build de um projeto, é necessário eliminar identenção, comentários, trocar os nomes das funções, fazendo com que ele fique mais enxuto e mais leve. Mas faz isso na mão é impraticável, assim, sempre utilizamos alguma ferramenta que faça isso de forma automatizada.

No caso do webpack, ele possui um pluggin nativo chamado UglifyJsPlugin. Como se trata de um pluggin, precisamos adiciona-lo na nossa lista de pluggins no `webpack.config.js` e passar algumas configurações:

```javascript
const path = require('path')
const webpack = require('webpack')

const PRODUCTION = process.env.NODE_ENV === 'production'

const entry = PRODUCTION
  ? ['./src/index.js']
  : ['./src/index.js', 'webpack/hot/dev-server', 'webpack-dev-server/client?http://localhost:8080']

const plugins = PRODUCTION
  ? [new webpack.optimize.UglifyJsPlugin({ // NEW CODE!
    comments: true, // Aqui dizemos se os comentários do código serão mantidos. Podemos setar para false.
    mangle: false, // Ainda não entendi muito bem o que essa opção faz. (PESQUISAR E ESCREVER)
    compress: { // Aqui entra algumas configurações a respeito da compressão
      warnings: true // Ativa ou desativa os avisos sobre a remoção do código morto antes do bundle. Exemplo abaixo.
    }
  })]
  : [new webpack.HotModuleReplacementPlugin()]

module.exports = {
  devtool: 'source-map',
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

### Warning: True

Com o warning setado para true nas configurações, é gerado informações no console (durante o build), parecidas com as abaixo:
```
WARNING in bundle.js from UglifyJs
Condition always false [bundle.js:88,4]
Dropping unreachable code [bundle.js:89,2]
Collapsing variable app [bundle.js:84,0]
Side effects in initialization of unused variable __WEBPACK_IMPORTED_MODULE_0__Button__ [bundle.js:75,25]
Dropping unused variable Button [bundle.js:97,4]
Dropping unused variable _unused_webpack_default_export [bundle.js:106,40]
Dropping unused function subtract [bundle.js:119,9]
Dropping unused function multiply [bundle.js:122,9]
```
Mas isso é só questão de informar a você o que está sendo removido ou não. Se for setado para `false`, o bundle será gerado da mesma forma, ou seja, fazendo o Tree-shaking e removendo o código obsoleto.

### Ugglify config: Default

Caso não queira se preocupar com nenhuma configuração, o plugin do ugglify fornece uma configuração padrão, basta não passarmos nenhum objeto para o mesmo. 

```javascript
/* webpack.config.js */

// code...

const plugins = PRODUCTION
  ? [new webpack.optimize.UglifyJsPlugin()]
  : [new webpack.HotModuleReplacementPlugin()]

  // code...
```

As opções padrão podem ser consultadas [aqui](https://github.com/webpack-contrib/uglifyjs-webpack-plugin)

### Uma sacada de mestre!

Ainda podemos tirar bastante proveito do Tree-shaking que o **uglifyJS** nos provê. No webpack, é possível criar variáveis que poderão ser usadas em todo o contexto da aplicação através de definição do mesmo em formato de plugin. 

Parece estranho, né? Mas podemos usar definindo algum comportamento ou ação que o código deve tomar em produção ou homologação. Lembra da regra do Tree-shaking? Pois é, ela vai valer aqui. Logo, se definirmos algo como:

```javascript
if(false){
  console.log('totalmente false')
}
```

Essa expressão nunca será `true`, logo, ela vai ser removida do programa.

Agora, _let's to the code_:

```javascript
/* webpack.config.js */

// ... code

const PRODUCTION = process.env.NODE_ENV === 'production'
const DEVELOPMENT = process.env.NODE_ENV === 'development' // Definição de uma variável para ambiente DEV

// ... code

// Manteremos os plugins normais
const plugins = PRODUCTION
  ? [
    new webpack
      .optimize
      .UglifyJsPlugin({
        comments: true,
        mangle: false,
        compress: {
          warnings: true
        }
      })
  ]
  : [new webpack.HotModuleReplacementPlugin()]

/*
Aqui, adicionaremos as "variáveis globais", onde, será possível checar em qualquer parte do código
e definir algum comportamento caso seja produção ou homologação
*/
plugins.push(
  new webpack.DefinePlugin({
    PRODUCTION: JSON.stringify(PRODUCTION),
    DEVELOPMENT: JSON.stringify(DEVELOPMENT)
  })
)
```

No **index.js** temos um código que será executado somente se haver o módulo:

```javascript
/* index.js */
// code...
if (module.hot) {
  module
    .hot
    .accept()
}
```

Entretanto, se quisermos tira-lo de produção, agora podemos fazer da seguinte forma:
```javascript
/* index.js */
// code...
if(DEVELOPMENT){
  if (module.hot) {
    module
      .hot
      .accept()
  }
}
```

Ou seja, quando executarmos o build como `produção`, a variável `DEVELOPMENT` terá valor de falso sempre, consequentemente, a função será removida do código de Produção! :D

## Imagens e outros arquivos
Por padrão, o webpack manuseia apenas os arquivos Javascript. Quando temos outros arquivos que precisam ser manipulados, como por exemplo, imagens, precisamos de outro loader para explicitar o que precisa ser feito. 

Caso tertamos simplesmente fazer o import de uma imagem dentro de um módulo, dará um erro semelhante a esse:

```bash
ERROR in ./src/img/logonodejs.png
Module parse failed: /home/raul/Desktop/test-webpack/src/img/logonodejs.png Unexpected character '�' (1:0)
You may need an appropriate loader to handle this file type.
(Source code omitted for this binary file)
```

Assim, para resolver este problema usaremos o [file-loader](https://github.com/webpack-contrib/file-loader).

### File-loader
Primeiro, precisamos adicionar a dependência ao projeto:
```bash
$ yarn add -S -D file-loader
```

Em seguida, precisamos configurar o Loader para o que queremos que ele faça. No caso do exemplo, informaremos como ele deverá tratar as imagens:

```javascript
/*webpack.config.js*/
// código...
module.exports = {
  devtool: 'source-map',
  entry: entry,
  plugins: plugins,
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: '/node_modules/'
      }, {
        test: /\.(png|jpg|gif)$/, // Alteramos para pegar as imagens
        loaders: ['file-loader'], // Definimos qual o loader que será usado para tal
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
// código...
```
Dessa forma, quando fizemos o uso dessa imagem algum lugar:

```javascript
/*Imagem module: Image.js*/
const NodeLogo = require('./img/logonodejs.png')
const Image = `<img src="${NodeLogo}"/>`

export default Image
```

```javascript
/*index.js*/
import Image from './Image'

const app = document.querySelector('#app')

app.innerHTML = Image
```

A imagem será inserida no corpo do elemento `#app`. É interessante observar que ao rodarmos o `yarn dev`, gerará um console semelhante a esse:

```bash
Hash: 7af22981c6076cdaf65e
Version: webpack 2.2.1
Time: 3460ms
                               Asset     Size  Chunks                    Chunk Names
f8dab57d048fabd69ea16c67e1615b86.png  46.8 kB          [emitted]
                           bundle.js   347 kB       0  [emitted]  [big]  main
                       bundle.js.map   668 kB       0  [emitted]         main
```

Perceba que nossa imagem foi gerada com um **hash MD5** `f8dab57d048fabd69ea16c67e1615b86` + a extensão original do arquivo (`png`). Esse é o padrão do file-loader . Podemos fazer alterações com relação a isto, como veremos adiante.

### Url-loader
Em alguns casos, a imagem é bem pequena e podemos querer envia-la para nosso site como um texto, gerando assim, um base64 image. Porém, para isso ser possível, precisamos instalar uma outra dependência chamada [`url-loader`](https://github.com/webpack-contrib/url-loader).

Ela trabalhada da mesma forma que o `file-loader`, entretando, será possível determinar a seguinte condição:
> Para casos onde a imagem for menor que X (tamanho definido por você), será usado o URL-loader e transformado em base64. Caso seja maior, será utilizado o **file-loader** e a imagem será mandada para a pasta normalmente.

#### Uso
1. Precisamos instalar a dependência no projeto:

```bash
$ yarn add -S -D url-loader
```

2. Precisamos alterar nosso `loader` de imagens para utilizar primeiro o url-loader, ficando assim:
```javascript
/*webpack.config.js*/
// código...
module.exports = {
  devtool: 'source-map',
  entry: entry,
  plugins: plugins,
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: '/node_modules/'
      }, {
        test: /\.(png|jpg|gif)$/, 
        loaders: ['url-loader?limit=12000&name=images/[hash:12].[ext]'], // Uso do url-loader first
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
// código...
```

#### Parâmetros
Na configuração acima, passamos alguns parâmetros para o `url-loader`
```javascript
// ...
loaders: ['url-loader?limit=12000&name=images/[hash:12].[ext]']
// ...
```
* **limit**: será o tamanho máximo do arquivo que se tornará um base64
* **name**: podemos definir como será o nome. No caso, falamos que ele deverá criar os arquivos dentro da pasta **images** (`images/`), gerar um nome com o hash de 12 digitos (`[hash:12]`) com a extensão padrão do arquivo (`.[ext]`) 

#### Adicionando um Icon
Agora, para ver o resultado, basta pegar uma imagem com o tamanho menor do que definimos no **limit** e fazer uso. No caso, será um ícone:

```javascript
/*image.js*/
const nodeLogo = require('./img/logonodejs.png')
const nodeIcon = require('./img/nodejs-128.png')

export const NodeLogo = `<img src="${nodeLogo}"/>`
export const NodeIcon = `<img src="${nodeIcon}"/>`
```

```javascript
import {NodeIcon, NodeLogo} from './Image'

const app = document.querySelector('#app')

const message = () => (`
  <p>
    ${NodeIcon}
    ${NodeLogo}
  </p>
`)

app.innerHTML = message()

if (module.hot) {
  module
    .hot
    .accept()
}
```

Ao executar o `yarn dev`, teremos dois cenários:

1. A imagem do ícone foi gerada com `data:image/png;base64` e o código com o valor dela foi pra dentro do bundle.
2. A imagem maior, foi levada para a pasta `dist/images/` e seu nome foi gerado um hash de 12 caracteres.

## Estilos, por favor! 

... PENDENTE ...

Falamos de arquivos javascript, imagens, agora vamos falar do nosso querido CSS!

```bash
yarn add -S -D css-loader style-loader
```

```javascript
import './style/style.css'
```

[webpack css documentation](https://webpack.js.org/guides/code-splitting-css/)

[css local](https://medium.com/seek-developers/the-end-of-global-css-90d2a4a06284#.kueeczqxv)
[style-loader](https://github.com/webpack-contrib/style-loader)

```javascript
/* webpack.config.js */

// code... 

module.exports = {
  devtool: 'source-map',
  entry: entry,
  plugins: plugins,
  module: {
    // Outros Loaders
     {
        test: /\.css$/, // Pegando todos os arquivos que terminam com .css
        loaders: [
          'style-loader', 'css-loader' //Usando ambos Loaders
        ],
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
