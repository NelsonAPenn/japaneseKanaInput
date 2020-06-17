var kanaMap = {
  'Backquote': "ろ",
  'Digit1': "ぬ",
  'Digit2': "ふ",
  'Digit3': "あぁ",
  'Digit4': "うぅ",
  'Digit5': "えぇ",
  'Digit6': "おぉ",
  'Digit7': "やゃ",
  'Digit8': "ゆゅ",
  'Digit9': "よょ",
  'Digit0': "わを",
  'Minus': "ほ",
  'Equal': "へ",
  'KeyQ': "た",
  'KeyW': "て",
  'KeyE': "いぃ",
  'KeyR': "す",
  'KeyT': "か",
  'KeyY': "ん",
  'KeyU': "な",
  'KeyI': "に",
  'KeyO': "ら",
  'KeyP': "せ",
  'BracketLeft': " 「",
  'BracketRight': " 」",
  'Backslash': "む",
  'KeyA': "ち",
  'KeyS': "と",
  'KeyD': "し",
  'KeyF': "は",
  'KeyG': "き",
  'KeyH': "く",
  'KeyJ': "ま",
  'KeyK': "の",
  'KeyL': "り",
  'Semicolon': "れ",
  'Quote': "け",
  'KeyZ': "つっ",
  'KeyX': "さ",
  'KeyC': "そ",
  'KeyV': "ひ",
  'KeyB': "こ",
  'KeyN': "み",
  'KeyM': "も",
  'Comma': "ね、",
  'Period': "る。",
  'Slash': "め・"
};
function hasTin(c) {
  let tins = "かきくけこさしすせそたちつてとはひふへほ";
  return tins.includes(c);
}
function hasCircle(c) {
  let circles = "はひふへほ";
  return circles.includes(c);
}
function isPunctuation(c)
{
  var punctuation = "・。、「」";
  return punctuation.includes(c);
}
