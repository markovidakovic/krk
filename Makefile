# default shell
SHELL := /bin/bash

# docker compose files
DEV_COMPOSE_FILE := docker-compose-dev.yml
DEBUG_COMPOSE_FILE := docker-compose-debug.yml
TEST_COMPOSE_FILE := docker-compose-test.yml

# vars
API_IMAGE_NAME := krk-api
API_DEV_TAG := dev

.PHONY: help \ 
	build-api run-api stop-api  \
	compose-build compose-up compose-up-build compose-down  \
	clean clean-all

help:
	@echo "Availbale commands:"
	@echo ""
	@echo "API container commands:"
	@echo "make build-api - Build the API development image"
	@echo "make run-api - Run the API container in development mode"
	@echo "make stop-api - Stop the running API container"
	@echo ""
	@echo "Development commands:"
	@echo "make compose-build - Build all services with docker compose"
	@echo "make compose-up - Start all services with docker compose"
	@echo "make compose-up-build - Start and build all services with docker compose"
	@echo "make compose-up-d - Start all services in deatached mode"
	@echo "make compose-down - Stop all services started with docker compose"
	@echo "make compose-logs - View logs for all services"
	@echo ""
	@echo "Debugging commands:"
	@echo ""
	@echo "Testing commands:"
	@echo ""
	@echo "Cleanup commands:"
	@echo "make clean - Remove docker containers and images related to the project for current mode"
	@echo "make clean-all - Remove all docker containers and images related to the project"

# build the api development image
build-api:
	@echo "Building $(API_IMAGE_NAME) development image..."
	docker build --target development -t $(API_IMAGE_NAME):$(API_DEV_TAG) ./api

# run the api container in development mode
run-api:
	@echo "Running $(API_IMAGE_NAME) development container..."
	docker run -p 3000:3000 -v $$(pwd)/api:/usr/src/app --name $(API_IMAGE_NAME)-dev $(API_IMAGE_NAME):$(API_DEV_TAG)

# stop the api container
stop-api:
	@echo "Stopping $(API_IMAGE_NAME) development container..."
	docker stop $(API_IMAGE_NAME)-dev || true
	docker rm $(API_IMAGE_NAME)-dev || true

# build all services with docker compose
compose-build:
	@echo "Building all services with docker compose..."
	docker compose -f $(DEV_COMPOSE_FILE) build

# start all services with docker compose
compose-up:
	@echo "Starting all services with docker compose..."
	docker compose -f $(DEV_COMPOSE_FILE) up

# start and build all services with docker compose
compose-up-build:
	@echo "Starting and building all services with docker compose..."
	docker compose -f $(DEV_COMPOSE_FILE) up --build

# start all services with docker compose in deatached mode
compose-up-d:
	@echo "Starting all services with docker compose in deatached mode..."
	docker compose -f $(DEV_COMPOSE_FILE) up -d

# stop all services started with docker compose
compose-down:
	@echo "Stopping all services started with docker compose..."
	docker compose -f $(DEV_COMPOSE_FILE) down

# view logs for all services
compose-logs:
	@echo "Viewing logs for all services..."
	docker compose -f $(DEV_COMPOSE_FILE) logs -f

# clean containers and images
clean:
	@echo "Removing containers"
	docker compose -f $(DEV_COMPOSE_FILE) down --volumes --remove-orphans
	@echo "Cleanup completed!"

# Clean all containers and images
clean-all:
	@echo "Removing all Docker containers and images related to the project..."
	docker compose -f $(DEV_COMPOSE_FILE) down --rmi all --volumes --remove-orphans || true
	docker rm -f $$(docker ps -a -q --filter "name=$(API_IMAGE_NAME)*") 2>/dev/null || true
	docker rmi -f $$(docker images "$(API_IMAGE_NAME)*" -q) 2>/dev/null || true
	@echo "Full cleanup completed!"