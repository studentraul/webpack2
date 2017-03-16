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
