FROM golang:1.23-bullseye AS base

WORKDIR /usr/src/app

# copy only files required to install dependencies (better layer caching)
COPY go.mod go.sum* ./

# use cache mount to speed up install of existing dependencies
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

FROM base AS development

COPY . .

CMD ["go", "run", "./cmd/main.go"]

FROM base AS build

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main ./cmd/main.go

FROM scratch AS production

WORKDIR /

COPY --from=build /usr/src/app/main .

CMD ["./main"]