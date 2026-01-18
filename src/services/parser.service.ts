import fs from 'fs/promises';
import { BITRATES, SAMPLE_RATES, MpegVersion, MpegLayer } from '../utils/constants';

/**
 * Service to parse MP3 files efficiently using File Descriptors.
 */
export async function countMp3Frames(filePath: string): Promise<number> {
  let fileHandle: fs.FileHandle | null = null;

  try {
    // Open the file
    // File: [I][D][3][03][00][...size bytes...][FF][FB][90][64][Audio...][FF][FB]...
    fileHandle = await fs.open(filePath, 'r');
    const stats = await fileHandle.stat();

    // Buffer for the header (4 bytes)
    // Buffer: [00][00][00][00]
    const buffer = Buffer.alloc(4);

    let frameCount = 0;
    let offset = 0;

    // ID3v2 SKIP LOGIC
    // Buffer: ['I']['D']['3'][?]
    await fileHandle.read(buffer, 0, 3, 0);

    const signature = buffer.toString('utf8', 0, 3);

    if (signature !== 'ID3') {
      throw new Error('Invalid file signature');
    }

    // ID3 header is 10 bytes
    const headerBuf = Buffer.alloc(10);

    // Buffer: ['I']['D']['3'][ver][rev][flags][size1][size2][size3][size4]
    await fileHandle.read(headerBuf, 0, 10, 0);

    // ID3 size is encoded as "Synchsafe integers" (7 bits per byte)
    // We combine bytes 6-9 to get the total tag size
    const tagSize =
      (headerBuf[6] << 21) | (headerBuf[7] << 14) | (headerBuf[8] << 7) | headerBuf[9];

    // Jump past the metadata + 10 byte header
    offset = tagSize + 10;

    // Main loop to read through the file
    while (offset < stats.size - 4) {
      // Read the next 4 bytes (Potential Frame Header)
      const { bytesRead } = await fileHandle.read(buffer, 0, 4, offset);

      if (bytesRead < 4) {
        break;
      }

      // Sync Word (11 bits set to 1)
      // Byte 0 must be 0xFF (11111111)
      // Byte 1 top 3 bits must be 111 (0xE0 mask)
      // Buffer: [11111111][111xxxxx][xxxxxxxx][xxxxxxxx]
      if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
        // PExtract Version and Layer to validate
        // Buffer: [xxxxxxxx][xxx????x][xxxxxxxx][xxxxxxxx]
        const version = (buffer[1] & 0x18) >> 3;
        const layer = (buffer[1] & 0x06) >> 1;

        // We only want MPEG-1 (3) Layer III (1)
        if (version !== MpegVersion.MPEG1 || layer !== MpegLayer.LayerIII) {
          offset++;
          continue;
        }

        // Bitrate, Sample Rate, Padding
        // Buffer: [xxxxxxxx][xxxxxxxx][xxxx????][xxxxxxxx]
        const bitrateIdx = (buffer[2] & 0xf0) >> 4;
        const sampleRateIdx = (buffer[2] & 0x0c) >> 2;
        const padding = (buffer[2] & 0x02) >> 1;

        // Lookup actual values
        const bitrate = BITRATES[bitrateIdx];
        const sampleRate = SAMPLE_RATES[sampleRateIdx];

        // Check for bad/free bitrate/sample
        if (!bitrate || !sampleRate) {
          offset++;
          continue;
        }

        // Calculate Frame Size
        const frameSize = Math.floor((144 * bitrate) / sampleRate) + padding;

        // Valid frame found
        frameCount++;

        // Skip audio data and move to the next frame
        offset += frameSize;
      } else {
        // Sync word lost
        // Move 1 byte forward to hunt for it
        offset++;
      }
    }

    return frameCount;
  } finally {
    // Cleanup
    if (fileHandle) await fileHandle.close();
  }
}
