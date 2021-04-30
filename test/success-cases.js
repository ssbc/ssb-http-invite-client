const test = require('tape');
const server = require('server');
const {ROOM_MSADDR} = require('./keys');
const CreateSSB = require('./sbot');

test('can claim an invite given an HTTP URL', (t) => {
  const INVITECODE = '123abc';
  const ssb = CreateSSB((close) => ({}));

  // Launch mock server to host the alias details
  const ctx = server({port: 3000, security: {csrf: false}}, [
    server.router.get('/join', (ctx) => {
      t.equals(ctx.query.invite, INVITECODE);
      t.equals(ctx.query.encoding, 'json');
      return {
        status: 'successful',
        invite: INVITECODE,
        postTo: 'http://localhost:3000/claiminvite',
      };
    }),
    server.router.post('/claiminvite', (ctx) => ({
      multiserverAddress: ROOM_MSADDR,
    })),
  ]);

  setTimeout(() => {
    const url = `http://localhost:3000/join?invite=${INVITECODE}`;
    ssb.httpInviteClient.claim(url, (err, msaddr) => {
      t.error(err, 'no error');
      t.equals(msaddr, ROOM_MSADDR);

      ctx
        .then(({close}) => close())
        .then(() => {
          ssb.close(() => {
            t.end();
          });
        });
    });
  }, 200);
});

test('can claim an invite given an SSB URI', (t) => {
  const INVITECODE = '123abc';

  const ssb = CreateSSB((close) => ({}));

  // Launch mock server to host the alias details
  const ctx = server({port: 3000, security: {csrf: false}}, [
    server.router.get('/join', (ctx) => {
      t.fail('should not request /join endpoint');
      return {};
    }),
    server.router.post('/claiminvite', (ctx) => ({
      multiserverAddress: ROOM_MSADDR,
    })),
  ]);

  setTimeout(() => {
    const submissionUrl = 'http://localhost:3000/claiminvite';
    const ssbUri =
      'ssb:experimental?' +
      [
        'action=claim-http-invite',
        'invite=' + encodeURIComponent(INVITECODE),
        'postTo=' + encodeURIComponent(submissionUrl),
      ].join('&');

    ssb.httpInviteClient.claim(ssbUri, (err, msaddr) => {
      t.error(err, 'no error');
      t.equals(msaddr, ROOM_MSADDR);

      ctx
        .then(({close}) => close())
        .then(() => {
          ssb.close(() => {
            t.end();
          });
        });
    });
  }, 200);
});