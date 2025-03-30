package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/nats-io/nats.go"
)

func main() {
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	nc, err := nats.Connect("nats:4222")
	if err != nil {
		log.Fatalf("failed to connect to nats: %v", err)
	}

	nc.Subscribe("mp4.process", func(m *nats.Msg) {
		type request struct {
			Id   int    `json:"id"`
			Path string `json:"path"`
		}
		var r request
		err := json.Unmarshal(m.Data, &r)
		if err != nil {
			fmt.Printf("failed to unmarshal incoming message data: %v", err)
		}
		fmt.Printf("r: %v\n", r)
	})

	fmt.Println("processing service listening for messages")
	<-sigCh
	fmt.Println("processing service shutting down")
}
