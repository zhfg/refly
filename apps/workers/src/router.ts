import { Router } from 'itty-router';

import { randomUUID } from 'node:crypto';
import { validateToken, uploadS3 } from './utils';

// declare let AWS_ACCESS_KEY: string;
// declare let AWS_SECRET_KEY: string;
// declare let S3_ENDPOINT: string;
// declare let S3_BUCKET: string;

// https://developers.cloudflare.com/workers/reference/apis/environment-variables/#secrets

// now let's create a router (note the lack of "new")
const router = Router();

// GET collection index
router.post('/htmlUpload', async (request, env) => {
	// Check authorization header for jwt token
	if (!(await validateToken(request, env))) {
		return new Response('Invalid token', { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get('file');
	const data = await file.arrayBuffer();
	const hash = await sha256(new TextEncoder().encode(formData.get('url')));

	// Upload HTML file
	const objectKey = `html-upload/${hash}.html`;
	await uploadS3({ env, objectKey: `${hash}.html`, data });

	return Response.json({ storageKey: objectKey }, { status: 200 });
});

// GET collection index
router.post('/resourceUpload', async (request, env) => {
	// Check authorization header for jwt token
	if (!(await validateToken(request, env))) {
		return new Response('Invalid token', { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get('file');
	const data = await file.arrayBuffer();

	let objectKey: string;

	// NOTE: allowing `storageKey` to be specified can be dangerous, but for now
	// `storageKey` is only visible to resource owner, so it should be fine
	if (formData.get('storageKey')) {
		objectKey = formData.get('storageKey');
	} else {
		objectKey = `resource/${randomUUID()}`;
	}

	await uploadS3({ env, objectKey, data });

	return Response.json({ storageKey: objectKey }, { status: 200 });
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;

async function sha256(data: ArrayBuffer) {
	const digest = await crypto.subtle.digest('SHA-256', data);
	const array = Array.from(new Uint8Array(digest));
	return array.map((b) => b.toString(16).padStart(2, '0')).join('');
}
