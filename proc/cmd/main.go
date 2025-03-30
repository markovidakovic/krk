package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/nats-io/nats.go"
)

var (
	maxJobs  = 5
	semaphor = make(chan struct{}, maxJobs)
)

func main() {
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	nc, err := nats.Connect("nats:4222")
	if err != nil {
		log.Fatalf("failed to connect to nats: %v", err)
	}

	sub, err := nc.Subscribe("mp4.process", func(m *nats.Msg) {
		type request struct {
			Id   int    `json:"id"`
			Path string `json:"path"`
		}
		var req request
		err := json.Unmarshal(m.Data, &req)
		if err != nil {
			fmt.Printf("failed to unmarshal incoming message data: %v\n", err)
		}

		fmt.Printf("received processing request for -> fileId: %d, filePath: %s\n", req.Id, req.Path)

		go func(fileId int, filePath string) {
			semaphor <- struct{}{} // acquire
			fmt.Printf("starting processing for -> fileId: %d, filePath: %s (active jobs: %d/%d)\n", fileId, filePath, len(semaphor), maxJobs)

			defer func() {
				<-semaphor // release
				fmt.Printf("finished processing for -> fileId %d, filePath: %s (active jobs: %d/%d)\n", fileId, filePath, len(semaphor), maxJobs)
			}()

			type result struct {
				Id              int    `json:"id"`
				ProcessedPath   string `json:"processedPath,omitempty"`
				ProcessingError string `json:"processingError,omitempty"`
			}

			res := result{Id: fileId}

			procPath, err := processFile(filePath)
			if err != nil {
				res.ProcessingError = err.Error()
			} else {
				res.ProcessedPath = procPath
			}

			// publish result to nats
			resData, _ := json.Marshal(res)
			nc.Publish("mp4.result."+fmt.Sprintf("%d", fileId), resData)
		}(req.Id, req.Path)
	})
	if err != nil {
		log.Fatalf("failed to subscribe: %v", err)
	}

	fmt.Println("processing service listening for messages")
	<-sigCh
	fmt.Println("processing service shutting down")
	sub.Unsubscribe()
}

func processFile(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", fmt.Errorf("failed to open the file")
	}
	defer f.Close()

	fDir := filepath.Dir(path)
	fName := filepath.Base(path)

	procDestDir := filepath.Join(fDir, "../processed")

	err = os.MkdirAll(procDestDir, 0755)
	if err != nil {
		return "", fmt.Errorf("failed to create the processed destination directory")
	}

	// construct processed file
	procFilePath := filepath.Join(procDestDir, "init_segment_"+fName)

	// create the file
	procFile, err := os.Create(procFilePath)
	if err != nil {
		return "", fmt.Errorf("failed to create the processed file: %v", err)
	}
	defer procFile.Close()

	var box [8]byte
	ftypFound := false
	moovFound := false

	// example of mp4 file structure:
	// 4 bytes for box size and box type, rest for data
	// [36][ftyp][28 bytes of ftyp data][787][moov][779 bytes of moov data]
	for {
		// read 8 byte chunks
		_, err := f.Read(box[:])
		if err != nil {
			if err == io.EOF {
				break
			}
			return "", fmt.Errorf("failed reading chunk of bytes: %v", err)
		}

		// extract and type convert the box size and box type
		boxSize := binary.BigEndian.Uint32(box[0:4])
		boxType := string(box[4:8])

		// box size needs to be at least 8 bytes (box_size + box_type)
		if boxSize < 8 {
			return "", fmt.Errorf("invalid box size: %d", boxSize)
		}

		if boxType == "ftyp" || boxType == "moov" {
			// write the content to the new file
			_, err := procFile.Write(box[:])
			if err != nil {
				return "", fmt.Errorf("failed to write box content to the processed file: %v", err)
			}

			_, err = io.CopyN(procFile, f, int64(boxSize-8))
			if err != nil {
				return "", fmt.Errorf("failed copying box data: %v", err)
			}

			if boxType == "ftyp" {
				ftypFound = true
			} else {
				moovFound = true
			}
		}

		// if we have found both boxes, we're done
		if ftypFound && moovFound {
			break
		}
	}

	if !ftypFound {
		return "", fmt.Errorf("ftyp box not found in the file")
	}
	if !moovFound {
		return "", fmt.Errorf("moov box not found in the file")
	}

	return procFilePath, nil
}
