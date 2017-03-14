const Button = {
  button: `<button id="myButton">Press, please!</button>`,
  attachEv: () => {
    document
      .querySelector('#myButton')
      .addEventListener('click', () => console.log('Clicked!'))
  }
}

export default Button
