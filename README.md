

<div align="center">  
  <h1>nosdav-shim</h1>
</div>

<div align="center">  
<i>nosdav-shim</i>
</div>

---

<div align="center">
<h4>Documentation</h4>
</div>

---

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/nosdav/nosdav-shim/blob/gh-pages/LICENSE)
[![npm](https://img.shields.io/npm/v/nosdav-shim)](https://npmjs.com/package/nosdav-shim)
[![npm](https://img.shields.io/npm/dw/nosdav-shim.svg)](https://npmjs.com/package/nosdav-shim)
[![Github Stars](https://img.shields.io/github/stars/nosdav/nosdav-shim.svg)](https://github.com/nosdav/nosdav-shim/)

## Introduction

This shim intercepts all requests made by a web page using the "fetch" API. If the request method is "PUT", it creates a Nostr event object, signs it, and adds the signed object to the "authorization" header of the request before sending it out. This allows the web page to authenticate the request with Nostr. Otherwise, the shim simply passes the request through to the original "fetch" method.

## Usage

```JavaScript
<script src="https://unpkg.com/nosdav-shim"></script>
```

## Code

```JavaScript
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
```

## License

- MIT
