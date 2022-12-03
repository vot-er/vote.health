import { createClient } from '@supabase/supabase-js'

export default {
	async fetch(request, env, ctx) {
		const requestUrl = new URL(request.url);
		const code = requestUrl.pathname.replace('/', '');
		const searchParams = requestUrl.searchParams;

		const destinationUrl = await getUrl(code, searchParams, env);

		return Response.redirect(destinationUrl, 301);
	},
};

async function getUrl(code, searchParams, env) {
  let destinationUrl = 'https://act.vot-er.org/';

  if (code) {
    try {
      const { organizationId, customUrl } = await getParams(code, env);

      searchParams.set('organizationId', organizationId);
      searchParams.set('ref', code);
      if (customUrl) { destinationUrl = customUrl; }

      destinationUrl = destinationUrl  + '?' + searchParams.toString();
    } catch (error) {
      console.log(error);
    }
  }

  return destinationUrl;
}

async function getParams(code, env) {
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
}
