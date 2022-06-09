<!--
SPDX-FileCopyrightText: 2021 Andre Staltz

SPDX-License-Identifier: CC0-1.0
-->

# ssb-http-invite-client

Plugin that implements the client-side of the [SSB HTTP Invites spec](https://ssbc.github.io/ssb-http-invite-spec/). This is supposed to be installed and used on **apps** that make remote calls to servers, thus *clients*.

## Installation

**Prerequisites:**

- Node.js 6.5.0 or higher
- Requires `secret-stack@>=6.2.0`

```
npm install --save ssb-http-invite-client
```

Require and use the following plugin into your ssb-server or secret-stack setup:

```diff
 SecretStack({appKey: require('ssb-caps').shs})
   .use(require('ssb-master'))
   .use(require('ssb-logging'))
   .use(require('ssb-conn'))
   .use(require('ssb-replicate'))
   .use(require('ssb-ebt'))
+  .use(require('ssb-http-invite-client'))
   .use(require('ssb-friends'))
   .use(require('ssb-about'))
   .call(null, require('./config'));
```

## Usage

### `ssb.httpInviteClient.claim(uri, cb)`

* `uri` is a string, either an HTTP URL or an SSB URI:
    * `https://myroom.com/join?invite=123abc`
    * `ssb:experimental?action=join-room&invite=123abc&postTo=anotherUrl`
* `cb` is called with 2nd arg `multiserverAddress` (for the server) if succeeded

## License

LGPL-3.0
