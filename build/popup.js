function update()
{
  browser.storage.local.get("active").then( (obj) => {
    if(obj.active)
      toggleButton.innerHTML = "Sys. language";
    else
      toggleButton.innerHTML = "かな";
  });
}

var toggleButton = document.getElementById("toggle");
update();

toggleButton.addEventListener("click", async function(e) {
  let active = (await browser.storage.local.get("active")).active;
  if(active)
  {
    browser.storage.local.set({active:false});
    update();
  }
  else
  {
    browser.storage.local.set({active:true});
    update();
  }
});

function sendMessage(tabs) {
  browser.tabs.sendMessage(tabs[0].id, {
    command: (popup.active ? "activate" : "deactivate")
  });
}
