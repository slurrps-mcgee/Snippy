import fs from 'fs';
import path from 'path';
import swaggerSpec from '../common/utilities/swagger';

const docsOut = path.resolve(__dirname, '../../../../documentation/openapi.json');
const spaOut = path.resolve(__dirname, '../../../frontend/src/app/api/openapi.json');

function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/** Pretty-print like JSON.stringify(null, 2), but keep primitive arrays on one line. */
function stableJson(value: unknown, indent = 0): string {
  if (isPrimitive(value)) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    if (value.every(isPrimitive)) {
      return `[${value.map((item) => JSON.stringify(item)).join(', ')}]`;
    }
    const pad = '  '.repeat(indent);
    const inner = '  '.repeat(indent + 1);
    const items = value.map((item) => `${inner}${stableJson(item, indent + 1)}`).join(',\n');
    return `[\n${items}\n${pad}]`;
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, item]) => item !== undefined
    );
    if (entries.length === 0) {
      return '{}';
    }
    const pad = '  '.repeat(indent);
    const inner = '  '.repeat(indent + 1);
    const items = entries
      .map(([key, item]) => `${inner}${JSON.stringify(key)}: ${stableJson(item, indent + 1)}`)
      .join(',\n');
    return `{\n${items}\n${pad}}`;
  }

  return 'null';
}

const json = `${stableJson(swaggerSpec)}\n`;
fs.mkdirSync(path.dirname(docsOut), { recursive: true });
fs.mkdirSync(path.dirname(spaOut), { recursive: true });
fs.writeFileSync(docsOut, json);
fs.writeFileSync(spaOut, json);
console.log(`Wrote OpenAPI spec to ${docsOut}`);
console.log(`Copied OpenAPI spec to ${spaOut}`);
