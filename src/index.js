import style from './style/global.css'
/*const style = require('./style/global.css')*/

/*import {NodeIcon, NodeLogo} from './Image'*/

const app = document.querySelector('#app')

const message = () => (`
  <p class="${style.box}">
    DEV: ${DEVELOPMENT.toString()}<br>
    PROD: ${PRODUCTION.toString()} <br>
  </p>
  <div class="${style.caixa}">OII</div>
`)

app.innerHTML = message()

if (DEVELOPMENT) {
  if (module.hot) {
    module
      .hot
      .accept()
  }
}
