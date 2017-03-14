import Button from './Button'

/*const message = require('./message.js')*/

const app = document.querySelector('#app')

app.innerHTML = Button.button

Button.attachEv()

if (module.hot) {
  module
    .hot
    .accept()
}
