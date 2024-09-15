import { assertSecret } from '../blitzkit/assertSecret';

export function patreonLoginUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: assertSecret(process.env.PUBLIC_PATREON_CLIENT_ID),
    redirect_uri: assertSecret(process.env.PUBLIC_PATREON_REDIRECT_URI),
    scope: 'identity',
  });

  return `https://www.patreon.com/oauth2/authorize?${params}`;
}
