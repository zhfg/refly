import { IRequest } from 'itty-router';
import { AwsClient } from 'aws4fetch';
import jwt from '@tsndr/cloudflare-worker-jwt';

export const validateStorageKey = (storageKey: string) => {
	if (!storageKey.startsWith('resource/')) {
		return false;
	}
	const uuid = storageKey.slice('resource/'.length);
	// Check for the correct length
	if (uuid.length !== 36) {
		return false;
	}
	// Check for the correct format
	if (!uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
		return false;
	}
	return true;
};

export const validateToken = async (request: IRequest, env: any) => {
	const authorization = request.headers.get('Authorization');
	if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
		return new Response('Authorization failed', { status: 401 });
	}
	const token = authorization.substring(7);
	return await jwt.verify(token, env.JWT_SECRET);
};

export const uploadS3 = async ({ env, objectKey, data }: { env: any; objectKey: string; data: any }) => {
	const aws = new AwsClient({
		service: 's3',
		accessKeyId: env.AWS_ACCESS_KEY,
		secretAccessKey: env.AWS_SECRET_KEY,
	});
	const uploadUrl = `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${objectKey}`;
	console.log('uploadUrl:', uploadUrl);

	const res = await aws.fetch(uploadUrl, {
		body: data,
		method: 'PUT',
		headers: {
			'Content-Type': 'application/html',
		},
	});
	const resText = await res.text();
	console.log(resText);
};
