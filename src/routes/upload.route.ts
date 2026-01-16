import { FastifyPluginAsync } from 'fastify';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { countMp3Frames } from '../services/parser.service';

const uploadRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post('/file-upload', async (request, reply) => {
    // Get the uploaded file
    const data = await request.file();

    if (!data) {
      throw fastify.httpErrors.badRequest('No file uploaded');
    }

    // Create a temporary file path
    const tempFilePath = path.join(os.tmpdir(), `mp3-${Date.now()}-${data.filename}`);

    try {
      // Stream to disk
      await pipeline(data.file, fs.createWriteStream(tempFilePath));

      // Get frame count
      const frameCount = await countMp3Frames(tempFilePath);

      return { frameCount };
    } catch (err) {
      request.log.error(err);
      throw fastify.httpErrors.internalServerError('Failed to process file');
    } finally {
      try {
        // Cleanup
        await fs.promises.unlink(tempFilePath);
      } catch (ignore) { }
    }
  });
}

export default uploadRoutes;