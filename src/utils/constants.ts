/**
 * MPEG-1 Audio Layer III Constants
 * Source: http://www.mp3-tech.org/programmer/frame_header.html
 */

// Bitrates Lookup Table (MPEG-1 Layer III)
// Index = The 4-bit bitrate value from the header (bits 20-23)
// Value = Bitrate in BITS PER SECOND (bps)
// Note: Index 0 is 'free', Index 15 is 'reserved/bad'
export const BITRATES = [
  0,        // 0000 (Free)
  32000,    // 0001 (32 kbps)
  40000,    // 0010
  48000,    // 0011
  56000,    // 0100
  64000,    // 0101
  80000,    // 0110
  96000,    // 0111
  112000,   // 1000
  128000,   // 1001 (128 kbps - Common)
  160000,   // 1010
  192000,   // 1011 (192 kbps - Common)
  224000,   // 1100
  256000,   // 1101
  320000,   // 1110 (320 kbps - Max)
  0         // 1111 (Bad)
] as const;

// Sample Rates Lookup Table (MPEG-1)
// Index = The 2-bit sample rate value (bits 18-19)
// Value = Frequency in Hz
export const SAMPLE_RATES = [
  44100, // 00 (44.1 kHz - CD Quality)
  48000, // 01 (48 kHz)
  32000, // 10 (32 kHz)
  0      // 11 (Reserved)
] as const;

// Used to verify we are looking at the correct file format
// Note: We only support MPEG-1 Layer III for this assessment
export enum MpegVersion {
  MPEG2_5 = 0, // 00
  Reserved = 1, // 01
  MPEG2 = 2,    // 10
  MPEG1 = 3     // 11
}

export enum MpegLayer {
  Reserved = 0, // 00
  LayerIII = 1, // 01
  LayerII = 2,  // 10
  LayerI = 3    // 11
}