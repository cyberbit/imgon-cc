import { deleteObject } from "./upload.fetch"
import escape from 'regexp.escape'

async function routeLambdaProxy(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)
    
    const originRequest = new Request(request)
    originRequest.headers.delete("cookie")

    let res: Response

    if (env.API_MODE === "invoke") {
        // Use AWS Lambda runtime API invoke format
        const lambdaPayload = {
            rawPath: url.pathname,
            rawQueryString: url.search.slice(1) // remove the leading '?'
        }
        
        const invokeRes = await fetch(`http://${env.API_HOST}/2015-03-31/functions/function/invocations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(lambdaPayload)
        })
        
        // Parse the wrapped Lambda response
        const lambdaResponse = await invokeRes.json() as {
            statusCode: number;
            headers: Record<string, string>;
            body: string;
        }

        console.log("Lambda response:", lambdaResponse.body)
        
        // Create response from unwrapped data
        res = new Response(JSON.stringify(lambdaResponse.body), {
            status: lambdaResponse.statusCode,
            headers: lambdaResponse.headers
        })
    } else {
        // Default "http" mode - work as originally written
        res = await fetch(`https://${env.API_HOST}${url.pathname}${url.search}`, originRequest)
    }

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