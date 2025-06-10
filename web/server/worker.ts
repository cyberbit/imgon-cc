async function routeLambdaProxy(request: Request, env: Env, ctx: ExecutionContext) {
    console.log("Lambda Proxy Request:", request.method, request.url)
    
    const url = new URL(request.url)
    
    const originRequest = new Request(request)
    originRequest.headers.delete("cookie")

    let res = await fetch(`https://${env.API_HOST}${url.pathname}${url.search}`, originRequest)

    res = new Response(res.body, res)

    res.headers.set("access-control-allow-origin", "*")

    return res
}

export {
    routeLambdaProxy
};