import { routeSignOnServer } from "./upload.fetch"
import { routeLambdaProxy } from "./worker"

export default {
    fetch(request, env, ctx) {
        // const { API_HOST } = env

        const url = new URL(request.url)
        
        // tell browsers to stop asking for favicon.ico
        if (url.pathname === "/favicon.ico") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Cache-Control": "public, max-age=31536000, immutable"
                }
            });
        }
        
        // Uppy uploads
        // if (url.pathname.startsWith("/s3/sts")) {
        // 	return routeS3STS(request, env, ctx);
        // }
        if (url.pathname.startsWith("/s3/params")) {
            return routeSignOnServer(request, env, ctx);
        }
        if (url.pathname.startsWith("/s3/sign")) {
            return routeSignOnServer(request, env, ctx);
        }

        // Lambda proxy fallback
        return routeLambdaProxy(request, env, ctx);
        
        // return new Response(null, { status: 404 });
    },
} satisfies ExportedHandler<Env>;
