import Fastify from 'fastify';
import FormData from 'form-data';
import fs from 'fs';
import assert from 'node:assert';
import { after, before, describe, test } from 'node:test';
import { app } from '../../src/app';
import { BAD_FILE_PATH, EMPTY_FILE_PATH, SAMPLE_MP3_PATH } from '../constants';

describe('MP3 Analysis Endpoint', async () => {
  const url = '/file-upload';

  // Create a bad file for testing
  before(() => {
    fs.writeFileSync(BAD_FILE_PATH, 'This is text, not audio');
    fs.writeFileSync(EMPTY_FILE_PATH, '');
  });

  // Clean up after tests finish
  after(() => {
    if (fs.existsSync(BAD_FILE_PATH)) fs.unlinkSync(BAD_FILE_PATH);
    if (fs.existsSync(EMPTY_FILE_PATH)) fs.unlinkSync(EMPTY_FILE_PATH);
  });

  test('POST /file-upload should return 400 if no file is uploaded', async (_t) => {
    const fastify = Fastify();
    fastify.register(app);

    const form = new FormData();

    const response = await fastify.inject({
      method: 'POST',
      url,
      payload: form,
      headers: form.getHeaders(),
    });

    assert.strictEqual(response.statusCode, 400);
    const body = JSON.parse(response.body);

    assert.strictEqual(body.error, 'Bad Request');
    assert.strictEqual(body.message, 'No file uploaded');
  });

  test('POST /file-upload should return 400 for invalid file type', async (t) => {
    if (!fs.existsSync(BAD_FILE_PATH)) {
      t.skip('bad_sample.txt not found');
      return;
    }

    const fastify = Fastify();
    fastify.register(app);

    const form = new FormData();
    form.append('file', fs.createReadStream(BAD_FILE_PATH));

    const response = await fastify.inject({
      method: 'POST',
      url,
      payload: form,
      headers: form.getHeaders(),
    });

    assert.strictEqual(response.statusCode, 400);
    const body = JSON.parse(response.body);

    assert.strictEqual(body.error, 'Bad Request');
    assert.strictEqual(body.message, 'Invalid file type');
  });

  test('POST /file-upload should return 400 for invalid file type', async (t) => {
    if (!fs.existsSync(BAD_FILE_PATH)) {
      t.skip('bad_sample.txt not found');
      return;
    }

    const fastify = Fastify();
    fastify.register(app);

    const form = new FormData();
    form.append('file', fs.createReadStream(BAD_FILE_PATH));

    const response = await fastify.inject({
      method: 'POST',
      url,
      payload: form,
      headers: form.getHeaders(),
    });

    assert.strictEqual(response.statusCode, 400);
    const body = JSON.parse(response.body);

    assert.strictEqual(body.error, 'Bad Request');
    assert.strictEqual(body.message, 'Invalid file type');
  });

  test('POST /file-upload should return 500 for empty file', async (t) => {
    if (!fs.existsSync(EMPTY_FILE_PATH)) {
      t.skip('bad_sample.txt not found');
      return;
    }

    const fastify = Fastify();
    fastify.register(app);

    const form = new FormData();
    form.append('file', fs.createReadStream(EMPTY_FILE_PATH));

    const response = await fastify.inject({
      method: 'POST',
      url,
      payload: form,
      headers: form.getHeaders(),
    });

    assert.strictEqual(response.statusCode, 500);
    const body = JSON.parse(response.body);

    assert.strictEqual(body.error, 'Internal Server Error');
    assert.strictEqual(body.message, 'Failed to process file');
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
      headers: form.getHeaders(),
    });

    assert.strictEqual(response.statusCode, 200);

    const body = JSON.parse(response.body);
    assert.strictEqual(body.frameCount, 6090); // Expected frame count for sample.mp3 (https://checkmate.gissen.nl/)
  });
});
