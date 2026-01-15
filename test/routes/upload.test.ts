import multipart from '@fastify/multipart';
import Fastify from 'fastify';
import fs from 'fs';
import assert from 'node:assert';
import { after, describe, test } from 'node:test';
import path from 'path';
import { app } from '../../src/app';

// Paths
const SAMPLE_MP3_PATH = path.join(__dirname, '../../sample.mp3');
const BAD_FILE_PATH = path.join(__dirname, '../../bad_sample.txt');

describe('MP3 Analysis Endpoint', async () => {
  // Create a bad file for testing
  fs.writeFileSync(BAD_FILE_PATH, 'This is text, not audio.');

  // Clean up after tests finish
  after(() => {
    if (fs.existsSync(BAD_FILE_PATH)) {
      fs.unlinkSync(BAD_FILE_PATH);
    }
  });

  test('POST /file-upload should return 400 if no file is uploaded', async (t) => {
    const fastify = Fastify();
    fastify.register(multipart);
    fastify.register(app);

    const response = await fastify.inject({
      method: 'POST',
      url: '/file-upload',
    });

    assert.strictEqual(response.statusCode, 400);
    const body = JSON.parse(response.body);
    assert.ok(body.error, 'Response should contain an error message');
  });

  test('POST /file-upload should count frames for valid MP3', async (t) => {
    if (!fs.existsSync(SAMPLE_MP3_PATH)) {
      t.skip('sample.mp3 not found');
      return;
    }

    const fastify = Fastify();
    fastify.register(multipart);
    fastify.register(app);

    const response = await fastify.inject({
      method: 'POST',
      url: '/file-upload',
      headers: { 'content-type': 'multipart/form-data' },
      payload: {
        file: fs.createReadStream(SAMPLE_MP3_PATH),
      },
    });

    assert.strictEqual(response.statusCode, 200);

    const body = JSON.parse(response.body);
    assert.ok(body.frameCount !== undefined, 'Response should have frameCount');
    assert.strictEqual(typeof body.frameCount, 'number');
    assert.ok(body.frameCount > 0, 'Frame count should be positive');
  });
});