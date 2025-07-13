const helpers = {
  toCapitalCase: (text) => {
    return text.split(' ').map((word) => { return word[0].toUpperCase() + word.substring(1) }).join(' ');
  },
  randomInt: (min, max) => {
    return Math.round(Math.random() * (max - min)) + min;
  }
}

exports = module.exports = helpers;