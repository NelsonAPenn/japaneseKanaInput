var active = false;
browser.storage.local.get("active").then( (result) => {
  active = Boolean(result.active);
  if(result.active == undefined)
    browser.storage.local.set({active:false});
});
browser.storage.onChanged.addListener(async function(e) {
  active = (await browser.storage.local.get("active")).active;
});


var original = {
  hiragana: "",
  selection: "",
  setValue: async (value) => {},
  getValue: async () => {},
  setCursor: async (value) => {},
  getCursor: async () => {},
  index: -1,
  textBox: undefined
};
var current;


async function focusPositionInNode(node, start, end)
{
  var range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

async function currentLength()
{
  return (current.selection ? current.selection.length : current.hiragana.length);
}

async function stringReplace(source, start, end, string)
{
  if(start < 0)
  {
    start = 0;
  }
  if(end < 0)
  {
    end = 0;
  }
  if(start > source.length)
  {
    start = source.length;
  }
  if(end > source.length)
  {
    end = source.length;
  }
  var front = source.substring(0, start);
  var end = source.substring(end);
  //setCursor(front.length + string.length);
  return {
    newString: front + string + end,
    endOfReplacement: front.length + string.length
  };
}

async function isHiragana(character)
{
  var num = character.charCodeAt(0);
  return num >= 'ぁ'.charCodeAt(0) && num <= 'ゟ'.charCodeAt(0);
}
function isKatakana(character)
{
  var num = character.charCodeAt(0);
  return num >= 'ァ'.charCodeAt(0) && num <= 'ヿ'.charCodeAt(0);
}
async function convert(x)
{
  var y = "";
  for(var i = 0; i < x.length; i++) 
  {
    var c = x[i];
    var num = x.charCodeAt(i);

    if(await isHiragana(c))
      y += String.fromCharCode(num + 'ァ'.charCodeAt(0) - 'ぁ'.charCodeAt(0));
    else
      y += c;
  }
  return y;
}


async function modify(delta)
{
  var loc = await current.getCursor();
  loc--;
  if(loc < 0)
    return;
  var c = (await current.getValue())[loc];
  var modified = "";
  if(delta == 1 && await hasTin(c))
  {
    modified = String.fromCharCode(c.charCodeAt(0) + 1);
  }
  if(delta == 2 && await hasCircle(c))
  {
    modified = String.fromCharCode(c.charCodeAt(0) + 2);
  }
  if(modified)
  {
    await replace(loc, loc + 1, modified);
    current.hiragana = await stringReplace(current.hiragana, current.hiragana.length - 1, current.hiragana.length, modified).newString;
  }
}

async function replace(start, end, string)
{
  var result = await stringReplace(await current.getValue(), start, end, string);
  await current.setValue(result.newString);
  await current.setCursor(result.endOfReplacement);
}

window.addEventListener("load", async function (e) {
  await clearState();
});

$(window).on("keydown", async function (e){
  if(!active || e.altKey || e.ctrlKey || !(await validElem(document.activeElement)))
    return;
  await sync();
  var shouldPrevent = true;
  var code = e.code;
  if(code == 'Enter')
  {
    select();
  }
  else if(code == 'Escape')
  {
    unkanji();
  }
  else if(code == 'Backspace')
  {
    backspace();
  }
  else if(code == 'Space')
  {
    nextMatch(e.shiftKey);
  }
  else if(code == 'BracketLeft' && !e.shiftKey)
  {
    modify(1);
  }
  else if(code == 'BracketRight' && !e.shiftKey)
  {
    modify(2);
  }
  else if(code in kanaMap)
  {
    insert(code, e.shiftKey);
  }
  else
  {
    shouldPrevent = false;
  }

  if(shouldPrevent)
    e.preventDefault();

});

async function insert(code, shift)
{
  if(current.selection)
    await select();

  var k = await getHiragana(code, shift);


  current.hiragana += k;
  var end = await current.getCursor();

  await replace(end, end, k);

  if(await isPunctuation(k))
  {
    await select();
  }
}

async function backspace()
{

  if(current.selection)
    await select();

  var end = await current.getCursor();
  if(current.hiragana)
    current.hiragana = (await stringReplace(current.hiragana, current.hiragana.length - 1, current.hiragana.length, "")).newString;
  await replace(end - 1, end, "");
}

async function getHiragana(code, shift)
{
  var entry = kanaMap[code];
  if(entry == undefined)
    return "";
  if(shift && entry.length == 2)
    return entry[1];
  return entry[0];
}

async function unkanji()
{
  if(current.selection)
  {
    var end = await current.getCursor();
    var size = current.selection.length;
    current.selection = "";
    current.index = -1;
    replace(end - size, end, current.hiragana);
  }
}

async function select()
{
  await clearState();
  await sync();
  await current.setCursor(await current.getCursor());
}

async function lookup(hiragana, backwards)
{
  var katakana = await convert(hiragana);
  var strArr = (await browser.storage.local.get(katakana))[katakana];

  if(!strArr)
    return "";
  var arr = strArr.split(" ");

  if(backwards)
    current.index--;
  else
    current.index++;

  if(current.index < 0)
    current.index = arr.length - 1;

  var toReturn = arr[current.index % arr.length];

  return toReturn;
}

async function nextMatch(backwards)
{
  // call Rust Wasm looker upper
  // var arr = ["文", "文章"];
  // var nextSelection = arr[Math.floor(Math.random()*2)];
  var nextSelection = await lookup(current.hiragana, backwards);
  if(!nextSelection)
  {
    var nextSelection = await convert(current.hiragana);
  }

  var end = await current.getCursor();
  var length = await currentLength();
  current.selection = nextSelection;
  await replace(end - length, end, nextSelection);

}

async function sync()
{
  var a = document.activeElement;
  if(await validElem(a))
  {
    //different text box
    if(a != current.textBox)
    {
      await clearState();
      current.textBox = a;
      switch(current.textBox.tagName)
      {
        case "INPUT":
        case "TEXTAREA":
          current.setValue = async (value) => {current.textBox.value = value;};
          current.getValue = async () => {return current.textBox.value;};
          current.setCursor = async (end) => {
            $(current.textBox).prop("selectionStart", end - (await currentLength()));
            $(current.textBox).prop("selectionEnd", end);
          };
          current.getCursor = async () => {
            return $(current.textBox).prop("selectionEnd");
          };
          break;
        case "DIV":
          current.setValue = async (value) => {
            // current.textBox.textContent = value;
            var sel = window.getSelection();
            var nodeToFocus = sel.anchorNode;
            if(nodeToFocus == current.textBox)
            {
              if(current.textBox.childNodes.length == 0)
              {
                var textNode = document.createTextNode("");
                current.textBox.appendChild(textNode);
                nodeToFocus = textNode;
              }
              else
              {
                nodeToFocus = current.textBox.childNodes[0];
              }
            }
            nodeToFocus.textContent = value;
            setPositionInNode(nodeToFocus, value.length - (await currentLength()), value);
          };
          current.getValue = async () => {
            // return current.textBox.textContent;
            return window.getSelection().anchorNode.textContent;
          };

          current.setCursor = async (end) => {
            var sel = window.getSelection();
            var nodeToFocus = sel.anchorNode;
            console.assert(value <= sel.anchorNode.length);

            setPositionInNode(nodeToFocus, value - (await currentLength()), value);
          };
          current.getCursor = async () => {
            return window.getSelection().anchorOffset;
          };
          break;

      }

    }
  }
  else
  {
    await clearState();
  }

}

async function validElem(elem)
{
  if(elem.tagName == "INPUT" && (elem.type == "text" || elem.type == "search"))
    return true;
  if(elem.tagName == "TEXTAREA")
    return true;
  if(elem.tagName == "DIV" && elem.contentEditable == "true")
    return true;
  return false;
}

async function clearState()
{
  current = Object.assign({},original);
}

clearState();


window.addEventListener('focus', async function(e) {
  await sync();
}, true);

window.addEventListener('blur', async function(e) {
  await sync();
}, true);