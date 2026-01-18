import fs from 'fs';
import assert from 'node:assert';
import { after, before, describe, test } from 'node:test';
import { countMp3Frames } from '../../src/services/parser.service';
import { BAD_FILE_PATH, EMPTY_FILE_PATH, SAMPLE_MP3_PATH } from '../constants';

describe('Parser Service: countMp3Frames', () => {
  // Create bad files for testing
  before(() => {
    fs.writeFileSync(BAD_FILE_PATH, 'This is text, not audio');
    fs.writeFileSync(EMPTY_FILE_PATH, '');
  });

  // Clean up after tests finish
  after(() => {
    if (fs.existsSync(BAD_FILE_PATH)) fs.unlinkSync(BAD_FILE_PATH);
    if (fs.existsSync(EMPTY_FILE_PATH)) fs.unlinkSync(EMPTY_FILE_PATH);
  });

  test('should accurately count frames in a valid MP3 file', async () => {
    const expectedFrames = 6090;

    const count = await countMp3Frames(SAMPLE_MP3_PATH);
    assert.strictEqual(count, expectedFrames);
  });

  test('should throw an error for a text file', async () => {
    try {
      await countMp3Frames(BAD_FILE_PATH);
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.strictEqual((err as Error).message, 'Invalid file signature');
    }
  });

  test('should throw an error for an empty file', async () => {
    try {
      await countMp3Frames(EMPTY_FILE_PATH);
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.strictEqual((err as Error).message, 'Invalid file signature');
    }
  });
});
