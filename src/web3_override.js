// on injected page: lookup for an ethereum object, hook into logic related to signing
// @see https://eips.ethereum.org/EIPS/eip-1193

// list of tx actions requiring confirmation
const confirmableMethods = [
  'eth_sendTransaction',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'personal_sign',
]

// object wait loop
function waitForEthereum(retries) {
  const NEXT_TICK = 1000
  if (typeof window.ethereum !== 'undefined') {
    // wrapping core object
    wrapProvider(window.ethereum)
    // wrapping separate providers and proxies
    if (window.ethereum.providers && window.ethereum.providers.length) {
      window.ethereum.providers.forEach(wrapProvider)
    }
  } else {
    // reschedule or die
    if (retries > 0) {
      setTimeout(waitForEthereum, NEXT_TICK, retries - 1)
    }
  }
}

// wrap provider methods
function wrapProvider(provider) {
  const trappingMethods = ['request', 'sendAsync']

  trappingMethods.forEach((methodName) => {
    if (typeof provider[methodName] === 'function') {
      const originalHandler = provider[methodName]
      provider[methodName] = confirmationTrap(provider, methodName, originalHandler)
    }
  })
}

// confirmation handler trap
function confirmationTrap(provider, methodName, originalHandler) {
  return function(payload) {
    console.warn('web3-confirm: catch provider call', methodName, 'with payload', payload)

    if (payload && payload.method && confirmableMethods.includes(payload.method)) {
      // request user confirmation
      const message = '⚠️ Web3-Confirm guard ⚠️\n' +
        'You are going to perform `' + payload.method + '` action.\n' +
        'Type "OK" to pass into wallet otherwise action will be declined.'
      if (prompt(message) === 'OK') {
        // pass to original handler
        return (function() {
          // perform call
          const answer = originalHandler(payload)
          answer.then(() => {
            // tx passed through
          }).catch(() => {
            // optional notification
            alert('You rejected transaction in wallet')
          })
          return answer
        })()
      } else {
        // return blank self-reject promise to comply with third-party UX
        return new Promise(function(done, fail) {
          setTimeout(() => {
            fail({
              code: 4001,
              message: 'Web3-Confirm guard: User denied transaction signature.',
            })
          }, 0)
        })
      }
    } else {
      // call original handler
      return originalHandler(payload)
    }
  }
}

// run the process, make few attempts
waitForEthereum(4)
