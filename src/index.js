import { createClient } from '@supabase/supabase-js';
import Toucan from 'toucan-js';

export default {
  async fetch(request, env, context) {
    const sentry = new Toucan({
      dsn: env.SENTRY_DSN,
      context,
      request,
      allowedHeaders: ['user-agent'],
      allowedSearchParams: /(.*)/,
    });
    let destinationUrl = 'https://act.vot-er.org/act/';
    try {
      const { code, searchParams } = getCodeAndParams(request);
      const { organizationId, customUrl } = await getOrgData(code, env);
      destinationUrl = getUrl(destinationUrl, code, organizationId, customUrl, searchParams);
      return Response.redirect(destinationUrl, 301);
    } catch(error) {
      sentry.captureException(error);
      return Response.redirect(destinationUrl, 301);
    }
  },
};

function getCodeAndParams(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.pathname.replace('/', '');
  const searchParams = requestUrl.searchParams;
  return { code, searchParams };
}

async function getOrgData(code, env) {
  if (code) {
    const client = createClient(env.SUPABASE_ENDPOINT, env.SUPABASE_PUBLIC_ANON_KEY);
    const { data, error } = await client
      .from('kits')
      .select(`
        user (
          organization (
            id, customUrl
          )
        )
      `)
      .eq('code', code);
    const organization = data?.pop()?.user?.organization;
    return { organizationId: organization?.id, customUrl: organization?.customUrl };
  } else {
    return {};
  }
}

function getUrl(destinationUrl, code, organizationId, customUrl, searchParams) {
  if (organizationId) {
    searchParams.set('organizationId', organizationId);
    searchParams.set('ref', code);
    if (customUrl) { destinationUrl = customUrl; }
  }

  destinationUrl = destinationUrl  + '?' + searchParams.toString();
  return destinationUrl;
}
