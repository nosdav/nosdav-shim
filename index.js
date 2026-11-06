const originalFetch = window.fetch

// hex sha256 of a string body, the NIP-98 payload tag
async function sha256 (text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

// modifies fetch PUT to add nip98 auth header
window.fetch = async function (url, options) {
  const newOptions = { ...options }

  if (newOptions.method === 'PUT') {
    const tags = [['u', url], ['method', 'PUT']]
    if (typeof newOptions.body === 'string') tags.push(['payload', await sha256(newOptions.body)])
    const event = {
      kind: 27235,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: ''
    }
    const signedEvent = await window.nostr.signEvent(event)
    const auth = `Nostr ${btoa(JSON.stringify(signedEvent))}`

    newOptions.headers = {
      ...newOptions.headers,
      authorization: auth
    }
  }

  return originalFetch.call(this, url, newOptions)
}
