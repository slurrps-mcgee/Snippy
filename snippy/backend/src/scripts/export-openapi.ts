import fs from 'fs';
import path from 'path';
import swaggerSpec from '../common/utilities/swagger';

const docsOut = path.resolve(__dirname, '../../../../documentation/openapi.json');
const spaOut = path.resolve(
  __dirname,
  '../../../frontend/src/app/api/openapi.json'
);

const json = JSON.stringify(swaggerSpec, null, 2);
fs.mkdirSync(path.dirname(docsOut), { recursive: true });
fs.mkdirSync(path.dirname(spaOut), { recursive: true });
fs.writeFileSync(docsOut, json);
fs.writeFileSync(spaOut, json);
console.log(`Wrote OpenAPI spec to ${docsOut}`);
console.log(`Copied OpenAPI spec to ${spaOut}`);
