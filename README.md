# MP3 Frame Analyzer API

A high-performance Node.js API built with **Fastify** that accepts MP3 file uploads and calculates the exact number of audio frames.

Designed for efficiency and security, this service uses streams to handle file uploads with minimal memory footprint and ensure file integrity.

## Key Features

- **Streaming Uploads:** Leverages `stream.pipeline` to process files directly to disk, preventing memory spikes (RAM) even with large uploads.
- **Deep Validation:** Goes beyond simple extension checks by inspecting the **Magic Bytes (File Signatures)** to detect fake MP3s (e.g., renamed `.exe` or `.txt` files).
- **OpenAPI/Swagger:** Auto-generated interactive API documentation.
- **Modular Architecture:** Clean separation of concerns between Routes (Controller) and Services (Business Logic).
- **Native Testing:** Uses the modern Node.js native Test Runner (no heavy Jest/Mocha dependencies).

## Prerequisites

- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher

## Installation & Setup

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run Server:**

    ```bash
    # Development
    npm run dev

    # Production
    npm run start
    ```

    The server will start at `http://localhost:3000`.

## API Documentation

Access the interactive Swagger UI to test endpoints directly in your browser:

**[http://localhost:3000/documentation](http://localhost:3000/documentation)**

### Endpoint Spec: `POST /file-upload`

- **Consumes:** `multipart/form-data`
- **Description:** Uploads an MP3 file, validates headers, and returns frame count.

#### Request Example (cURL)

```bash
curl -X POST http://localhost:3000/file-upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/song.mp3"
```

Success Response (200 OK):

```json
{
  "frameCount": 6090
}
```

Error Responses:

- **400 Bad Request**: Missing file or invalid file extension (Fail Fast).
- **500 Internal Server Error**: Disk I/O errors or parsing failures.

## Architecture & Design Decisions

The project is structured to separate "Traffic Control" from "Business Logic."

```plaintext
src/
├── app.ts # App entry point & plugin registration
├── routes/
│ └── upload.route.ts # Controller: Handles HTTP req/res & Validation
├── services/
│ └── parser.service.ts # Business Logic: Counts frames (Pure logic)
├── utils/
│ └── constants.ts # Constants: MPEG-1 Audio Layer III header values
└── plugins/ # Fastify configuration (Multipart, Swagger)
```

1. Streaming vs. Buffering
   Instead of loading the entire file into a RAM buffer (which crashes servers under load), this uses `request.file()` to stream the upload directly to a temporary directory (`os.tmpdir()`).

2. "Fail Fast" Validation
   1. Layer 1 (Route Level): Checks file extension immediately. If it's not .mp3, the stream is instantly closed to save bandwidth.
   2. Layer 2 (Binary Level): After streaming, the first 4 bytes of the file are inspected. If the "Magic Number" (File Signature) isn't ID3 or 0xFF, it is rejected before running the expensive parser logic.

## Running Tests

This project uses the native Node.js Test Runner.

```bash
# Run all tests

npm test

# Run a specific test file

node --test test/routes/file-upload.test.ts
```

## Code Quality

Standardized linting and formatting are enforced via ESLint and Prettier.

```bash
# Check code style

npm run lint

# Auto-fix formatting issues

npm run format
```
