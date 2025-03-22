import http from 'node:http';

const hostname = '0.0.0.0';
const port = 3000;

http
	.createServer((req, res) => {
		const { headers, method, url } = req;

		res.writeHead(200, {
			'Content-Type': 'application/json',
		});
		res.end(JSON.stringify({ headers, method, url }));
	})
	.listen(port, hostname);
