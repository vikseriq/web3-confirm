// inject web3_override script into current page

function injectScript() {
  if (!document.head) {
    // not a valid html page
    return
  }
  const tag = document.createElement('script')
  tag.src = chrome.runtime.getURL('web3_override.js')
  tag.onload = function() {
    this.remove()
  }
  // inject script
  document.head.appendChild(tag)
  // that's all
}

injectScript()
