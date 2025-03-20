import { createServer } from 'node:http';

const hostname = '0.0.0.0';
const port = 3000;

const server = createServer((req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.end('hello');
});

server.listen(port, hostname, () => {
	console.log(`server running at http://${hostname}:${port}`);
});
