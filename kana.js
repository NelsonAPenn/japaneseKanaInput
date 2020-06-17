var active = true;
var original = {
  hiragana: "",
  selection: "",
  index: 0,
  textBox: undefined
};
var current;

function setCursor(place)
{
  $(current.textBox).prop("selectionStart", place);
  $(current.textBox).prop("selectionEnd", place);
}

function stringReplace(source, start, end, string)
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

function modify(delta)
{
  var loc = $(current.textBox).prop("selectionStart") - 1;
  if(loc < 0)
    return;
  var c = current.textBox.value[loc];
  var modified = "";
  if(delta == 1 && hasTin(c))
  {
    modified = String.fromCharCode(c.charCodeAt(0) + 1);
  }
  if(delta == 2 && hasCircle(c))
  {
    modified = String.fromCharCode(c.charCodeAt(0) + 2);
  }
  if(modified)
  {
    replace(loc, loc + 1, modified);
    current.hiragana = stringReplace(current.hiragana, current.hiragana.length - 1, current.hiragana.length, modified).newString;
  }
}

function replace(start, end, string)
{
  var result = stringReplace(current.textBox.value, start, end, string);
  current.textBox.value = result.newString;
  setCursor(result.endOfReplacement);
}
window.addEventListener("load", function (e) {
  clearState();
});

$(window).on("keydown", function (e){
  if(e.altKey || e.ctrlKey)
    return;
  if(!active || document.activeElement.type != "text")
    return;
  sync();
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
    nextMatch();
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

function insert(code, shift)
{
  //unkanji();
  if(current.selection)
    select();

  var k = getHiragana(code, shift);


  current.hiragana += k;
  var end = $(current.textBox).prop("selectionStart");

  replace(end, end, k);

  if(isPunctuation(k))
  {
    select();
  }
}

function backspace()
{
  //unkanji();

  if(current.selection)
    select();

  var end = $(current.textBox).prop("selectionStart");
  replace(end - 1, end, "");
  if(current.hiragana)
    current.hiragana = stringReplace(current.hiragana, current.hiragana.length - 1, current.hiragana.length, "").newString;
}

function getHiragana(code, shift)
{
  var entry = kanaMap[code];
  if(entry == undefined)
    return "";
  if(shift && entry.length == 2)
    return entry[1];
  return entry[0];
}

function unkanji()
{
  if(current.selection)
  {
    var val = current.textBox.value;
    var end = $(current.textBox).prop("selectionStart");
    var size = current.selection.length;
    replace(end - size, end, current.hiragana);
    current.selection = "";
    current.index = 0;
  }
}

function select()
{
  clearState();
  sync();

}

function lookup(hiragana)
{
  var strArr = jishoObject[hiragana];
  if(!strArr)
    return "";
  var arr = jishoObject[hiragana].split(" ");
  var toReturn = arr[current.index % arr.length];
  current.index++;
  return toReturn;
}

function nextMatch()
{
  // call Rust Wasm looker upper
  // var arr = ["文", "文章"];
  // var nextSelection = arr[Math.floor(Math.random()*2)];
  var nextSelection = lookup(current.hiragana);
  if(!nextSelection)
  {
    current.selection = "";
    current.index = 0;
    return;
  }

  var val = current.textBox.value;
  var end = $(current.textBox).prop("selectionStart");
  var size = current.selection ? current.selection.length : current.hiragana.length;
  replace(end - size, end, nextSelection);
  current.selection = nextSelection;

}

function sync()
{
  var a = document.activeElement;
  if(a.type == "text")
  {
    //different text box
    if(a != current.textBox)
    {
      clearState();
      current.textBox = a;
    }
  }

}

function clearState()
{
  current = Object.assign({},original);
}


