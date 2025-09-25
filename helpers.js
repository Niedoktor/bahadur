const helpers = {
  toCapitalCase: (text) => {
    return text.split(' ').map((word) => { return word[0].toUpperCase() + word.substring(1) }).join(' ');
  },
  randomInt: (min, max) => {
    return Math.round(Math.random() * (max - min)) + min;
  },
  shuffleArray: (array) => {
    let count = array.length, randomnumber, temp;
    while(count){
      randomnumber = Math.random() * count-- | 0;
      temp = array[count];
      array[count] = array[randomnumber];
      array[randomnumber] = temp
    }
  },
  centerText: (text, width) => {
    return text.padStart((width - text.length) / 2 + text.length, " ").padEnd(width, " ")
  },
  clippedText: (text, width) => {
    return `${text.substring(0, width - 2)}${text.length > width - 2 ? String.fromCharCode(0x2026) : ""} `.padEnd(width, ' ')
  }
}

exports = module.exports = helpers;