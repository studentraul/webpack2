import Button from './Button'
import {sum} from './mathStuffs'

/*const message = require('./message.js')*/

const app = document.querySelector('#app')

app.innerHTML = sum(3, 4) // Button.button

/*Button.attachEv()*/

if (module.hot) {
  module
    .hot
    .accept()
}
