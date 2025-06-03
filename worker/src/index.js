async function handleRequest(request, env, ctx) {
    const { API_HOST, ASSET_HOST } = env

    console.log(env)

    const url = new URL(request.url)
    const pathname = url.pathname
    const search = url.search
    const pathWithParams = pathname + search
    
    // tell browsers to stop asking for favicon.ico
    if (pathname === "/favicon.ico") {
        return new Response(null, {
            status: 204,
            headers: {
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        });
    } else if (pathname.startsWith("/static/")) {
        return retrieveStatic(request, pathWithParams, env, ctx)
    } else {
        return forwardRequest(request, pathWithParams, env)
    }
}

async function retrieveStatic(request, pathname, env, ctx) {
    const { API_HOST, ASSET_HOST } = env

    let response = await caches.default.match(request)
    if (!response) {
        response = await fetch(`https://${ASSET_HOST}${pathname}`)
        ctx.waitUntil(caches.default.put(request, response.clone()))
    }
    return response
}

async function forwardRequest(request, pathWithSearch, env) {
    const { API_HOST, ASSET_HOST } = env

    const originRequest = new Request(request)
    originRequest.headers.delete("cookie")

    return await fetch(`https://${API_HOST}${pathWithSearch}`, originRequest)
}

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env, ctx);
    }
};