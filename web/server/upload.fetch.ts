import { AwsClient } from 'aws4fetch'

const expiresIn = 900 // Define how long until a S3 signature expires.

// Generate a unique S3 key for the file
const generateS3Key = (filename: string) => `${crypto.randomUUID()}-${filename}`

// Extract the file parameters from the request
const extractFileParameters = async (request: Request) => {
  const url = new URL(request.url)
  const isPostRequest = request.method === 'POST'
  const params: URLSearchParams | Record<string, any> = isPostRequest ? (await request.json()) : url.searchParams

  if (params instanceof URLSearchParams) {
    return {
      filename: params.get('filename') || '',
      contentType: params.get('type') || ''
    }
  }

  return {
    filename: params.filename,
    contentType: params.type
  }
}

// Validate the file parameters
const validateFileParameters = (filename: string, contentType: string) => {
  if (!filename || !contentType) {
    throw new Error('Missing required parameters: filename and content type are required')
  }
}

function getAwsClient(env: Env) {
  return new AwsClient({
    accessKeyId: env.AWS_KEY,
    secretAccessKey: env.AWS_SECRET,
    service: 's3',
    region: env.AWS_REGION,
  })
}

const routeSignOnServer = async (request: Request, env: Env, ctx: ExecutionContext) => {
  const { filename, contentType } = await extractFileParameters(request)
  validateFileParameters(filename, contentType)
  const Key = generateS3Key(filename)

  // Generate a pre-signed URL using aws4fetch
  const aws = getAwsClient(env)
  const bucket = env.AWS_BUCKET
  const region = env.AWS_REGION
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${Key}?X-Amz-Expires=${expiresIn}`

  // Prepare the signed request
  const signed = await aws.sign(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    aws: {
      signQuery: true
    },
  })

  return Response.json(
    {
      url: signed.url,
      method: 'PUT',
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    }
  )
}

export {
  getAwsClient,
  generateS3Key,
  extractFileParameters,
  validateFileParameters,
  routeSignOnServer,
}