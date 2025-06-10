import { deleteObject } from "./upload.fetch"
import escape from 'regexp.escape'

async function routeLambdaProxy(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)
    
    const originRequest = new Request(request)
    originRequest.headers.delete("cookie")

    let res = await fetch(`https://${env.API_HOST}${url.pathname}${url.search}`, originRequest)

    // imgon is strictly consume-on-read for uploads, so we
    // immediately trash the upload now that the response is
    // returned. in the future this will happen in the lambda
    const bucketPath = `https://${env.AWS_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`
    const bucketPathPattern = new RegExp(`\/${escape(bucketPath)}\/([^\?]+)`, 'g')
    const key = bucketPathPattern.exec(url.pathname)?.at(1)

    if (key) {
        // execute the delete operation after the response is returned
        ctx.waitUntil(deleteObject(env, key))
    }

    res = new Response(res.body, res)

    res.headers.set("access-control-allow-origin", "*")

    return res
}

export {
    routeLambdaProxy
};