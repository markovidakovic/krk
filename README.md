# krk

Service for processing and extracting initialization segments from mp4 files. The service consists of a client facing node rest api service, a go processing service, NATS internal communication, a postgres database and a react web application to manage and visualize mp4 files. All services are containerized with docker.

## Architecture

### Components

- **rest api service** (node.js): handles http requests, database operations, and coordinates processing requests
- **processing service** (go): performs binary parsing of mp4 files to extract initialization segments
- **nats**: message broker for service communication
- **postgresql**: stores file metadata and processing results
- **shared file system**: accessible by both services for reading mp4 files and writing initialization segments

### Service responsibilites

#### REST api service

- exposes restful endpoints for client interaction
- manages file metadata in the postgres database
- initiates processing by sending messages to nats
- receives and stores processing results
- provides status and result information to clients

#### Processing service

- receives processing requests via nats
- parses mp4 file structure to identify and extract initialization boxes
- extracts the initialization segment (ftyp + moov boxes)
- saves initialization segment to a new file
- reports back to the api service

## Communication flow

1. client submits file path via rest api
2. api service records request in database and publishes message to nats
3. processing service consumes message, processes file, and publishes results
4. api service receives results and updates database
5. client retrieves processing status and results via rest api

## Technical details

### `mp4` File Structure

```txt
MP4 files are made up of boxes, like these:

[box1_size][box1_type][box1_bytes][box2_size][box2_type][box2_bytes]...
Box size is 32-bit, unsigned, big-endian integer, giving you the size of the box in bytes,
including the bytes for the size, the type, and the data.
The type is also 32-bit, or 4 bytes, telling you the type of the box, as ASCII text.
Example:
[36][ftyp][28 bytes of ftyp data][787][moov][779 bytes of moov data]
The total size of the "ftyp" box is 36 bytes. The data portion is 28 bytes, which is 36 minus 4
bytes for the box size and 4 bytes for the box type.

The total size of the "moov" box is 787 bytes. The data portion is 779 bytes, which is 787 minus
4 bytes for the box size and 4 bytes for the box type.
We expect to find precisely the "ftyp" box followed by the "moov" box. These two represent the
initialization segment.
```

## Tech

- **node.js**
- **go**
- **nats**
- **postgresql**
- **docker**

## Project structure

```
krk/
|-api/
|-proc/
|-db/
|-files/
|   |-mp4/
|   |-processed/
|-docker-compose.yml
|-README.md
```

- `api` - node api service
- `proc` - go processing service
- `db` - database initialization script which is mounted as a volume in the database docker compose service
- `files` - shared volume for mp4 files

## Setup and installation

### Prerequisites

- docker and docker compose

### Running the project

1. navigate to the root of the project
2. if you want, add additional files in the `files/mp4` dir (by default comes with a `video.mp4` sample file in the `files/mp4` dir for testing). That folder is mounted for access to both `api` and `proc` docker compose services.
3. start the services (check out the makefile for more cmds)

    ```bash
    make compose-up
    ```

## API usage

the api is available at `http://localhost:3000` and provides the following endpoints:

- `GET /files` - list all files with processing status
- `GET /files/:id` - get details of a specific file
- `POST /files/process` - start file processing
- `DELETE /files/:id` - delete file information and processed data

## Testing

example request using curl:

```bash
# List all files
curl http://localhost:3000/files

# Process a file
curl -X http://localhost:3000/files/process \
    -H "Content-Type: application/json" \
    -d '{"filePath": "files/mp4/video.mp4"}'
```