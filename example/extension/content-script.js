function sendMsg() {
  try {
    chrome.runtime.sendMessage(Date.now().toString())
    console.log('send')
  } catch (e) {}
  setTimeout(() => {
    sendMsg()
  }, 1000)
}

sendMsg();
