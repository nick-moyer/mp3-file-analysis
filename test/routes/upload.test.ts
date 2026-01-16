import Fastify from 'fastify';
import fs from 'fs';
import assert from 'node:assert';
import { after, describe, test } from 'node:test';
import path from 'path';
import FormData from 'form-data'; // 👈 Required for testing uploads
import { app } from '../../src/app';

// Paths
const SAMPLE_MP3_PATH = path.join(__dirname, '../../data/sample.mp3');
const BAD_FILE_PATH = path.join(__dirname, '../../data/bad_sample.txt');

describe('MP3 Analysis Endpoint', async () => {
  const url = '/file-upload';
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
    fastify.register(app);

    const form = new FormData();

    const response = await fastify.inject({
      method: 'POST',
      url,
      payload: form,
      headers: form.getHeaders()
    });

    assert.strictEqual(response.statusCode, 400);
    const body = JSON.parse(response.body);

    assert.strictEqual(body.error, 'Bad Request');
    assert.strictEqual(body.message, 'No file uploaded');
  });

  test('POST /file-upload should count frames for valid MP3', async (t) => {
    if (!fs.existsSync(SAMPLE_MP3_PATH)) {
      t.skip('sample.mp3 not found');
      return;
    }

    const fastify = Fastify();
    fastify.register(app);

    const form = new FormData();
    form.append('file', fs.createReadStream(SAMPLE_MP3_PATH));

    const response = await fastify.inject({
      method: 'POST',
      url,
      payload: form,
      headers: form.getHeaders()
    });

    assert.strictEqual(response.statusCode, 200);

    const body = JSON.parse(response.body);
    assert.strictEqual(body.frameCount, 6090); // Expected frame count for sample.mp3 (https://checkmate.gissen.nl/)
  });
});