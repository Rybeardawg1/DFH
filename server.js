const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const port = Number(process.env.PORT || 4173);
const root = __dirname;

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const gzipTypes = new Set([".css", ".html", ".js", ".json", ".mjs", ".svg"]);

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://localhost:${port}`);
  const rawPathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const pathname = rawPathname.endsWith("/") ? `${rawPathname}index.html` : rawPathname;
  const safePath = path
    .normalize(decodeURIComponent(pathname))
    .replace(/^[/\\]+/, "")
    .replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, body) => {
    if (error) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    const headers = {
      "cache-control": "no-cache",
      "content-type": types[ext] || "application/octet-stream"
    };

    if (gzipTypes.has(ext) && /\bgzip\b/.test(request.headers["accept-encoding"] || "")) {
      zlib.gzip(body, (zipError, zippedBody) => {
        if (zipError) {
          response.writeHead(200, headers);
          response.end(body);
          return;
        }

        response.writeHead(200, {
          ...headers,
          "content-encoding": "gzip",
          vary: "Accept-Encoding"
        });
        response.end(zippedBody);
      });
      return;
    }

    response.writeHead(200, headers);
    response.end(body);
  });
});

server.listen(port, () => {
  console.log(`Developer For Hire site running at http://localhost:${port}`);
});
