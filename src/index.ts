const Ref = require('ssb-ref');
import {makeRequest} from '@minireq/node';

interface Callback<T = any> {
  (err?: any, x?: T): void;
}

interface SSB {
  id: string;
}

const minireq: ReturnType<typeof makeRequest> =
  typeof window !== 'undefined'
    ? require('@minireq/browser').makeRequest()
    : require('@minireq/node').makeRequest();

const INVITE_URI_ACTION = 'claim-http-invite';

module.exports = {
  name: 'httpInviteClient',
  version: '1.0.0',
  manifest: {
    claim: 'async',
  },
  permissions: {
    anonymous: {},
  },
  init(ssb: SSB, _config: unknown) {
    function jsonResponseFailed(data: any) {
      return (
        typeof data.status === 'string' &&
        data.status !== 'successful' &&
        data.error
      );
    }

    async function executePostTo(
      invite: string | null,
      url: string | null,
    ): Promise<string> {
      if (!invite || typeof invite !== 'string') {
        throw new Error(`invalid invite code: ${invite}`);
      }
      if (!url || typeof url !== 'string') {
        throw new Error(`invalid postTo: ${url}`);
      }
      const {status, data} = await minireq({
        url: url,
        method: 'POST',
        accept: 'application/json',
        send: {
          id: ssb.id,
          invite,
        },
        timeout: 10e3,
      }).promise;
      if (!(status >= 200 && status < 300)) {
        throw new Error(`failed (${status}) to claim invite at ${url}`);
      }
      if (jsonResponseFailed(data)) {
        throw new Error(data.error);
      }
      const multiserverAddress = data.multiserverAddress;
      if (!Ref.isAddress(multiserverAddress)) {
        throw new Error(`bad multiserverAddress: ${multiserverAddress}`);
      }
      return multiserverAddress;
    }

    async function claim(input: string, cb: Callback<string>) {
      if (!input) {
        cb(new Error('missing URI input'));
        return;
      }
      if (typeof input !== 'string') {
        cb(new Error('URI input should be a string'));
        return;
      }
      let url: URL;
      try {
        url = new URL(input);
      } catch (err) {
        cb(err);
        return;
      }

      if (url.protocol.startsWith('http')) {
        url.searchParams.set('encoding', 'json');
        const jsonUrl = url.toString();
        try {
          // Fetch invite details
          const {status, data} = await minireq({
            url: jsonUrl,
            method: 'GET',
            accept: 'application/json',
            timeout: 10e3,
          }).promise;
          if (!(status >= 200 && status < 300)) {
            cb(new Error(`failed (${status}) to get invite from ${jsonUrl}`));
            return;
          }
          if (jsonResponseFailed(data)) {
            cb(new Error(data.error));
            return;
          }

          // POST our ssb.id to claim the invite
          const {invite, postTo} = data;
          try {
            const multiserverAddress = await executePostTo(invite, postTo);
            cb(null, multiserverAddress);
            return;
          } catch (err) {
            cb(err);
            return;
          }
        } catch (err) {
          cb(err);
          return;
        }
      } else if (url.protocol === 'ssb:') {
        if (url.pathname !== 'experimental' && url.host !== 'experimental') {
          cb(new Error('SSB URI input isnt experimental'));
          return;
        }
        const action = url.searchParams.get('action');
        if (action !== INVITE_URI_ACTION) {
          cb(new Error(`SSB URI input isnt ${INVITE_URI_ACTION}: ${input}`));
          return;
        }

        // POST our ssb.id to claim the invite
        const invite = url.searchParams.get('invite');
        const postTo = url.searchParams.get('postTo');
        try {
          const multiserverAddress = await executePostTo(invite, postTo);
          cb(null, multiserverAddress);
          return;
        } catch (err) {
          cb(err);
          return;
        }
      } else {
        cb(new Error(`unsupported URI input: ${input}`));
        return;
      }
    }

    return {
      claim,
    };
  },
};
