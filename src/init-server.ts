import fs from 'node:fs'
import path from 'node:path'

import { OpenAPIV3 } from 'openapi-types'
import OpenAPISchemaValidator from 'openapi-schema-validator'

import { MCPProxy } from './openapi-mcp-server/mcp/proxy'

export class ValidationError extends Error {
  constructor(public errors: any[]) {
    super('OpenAPI validation failed')
    this.name = 'ValidationError'
  }
}

async function loadOpenApiSpec(specPath: string, baseUrl: string | undefined): Promise<OpenAPIV3.Document> {
  console.error('📌 [init-server.ts] Loading OpenAPI spec from:', specPath)
  let rawSpec: string

  try {
    rawSpec = fs.readFileSync(path.resolve(process.cwd(), specPath), 'utf-8')
    console.error('📌 [init-server.ts] OpenAPI spec loaded successfully, length:', rawSpec.length)
  } catch (error) {
    console.error('❌ [init-server.ts] Failed to read OpenAPI specification file:', (error as Error).message)
    process.exit(1)
  }

  // Parse and validate the OpenApi Spec
  try {
    const parsed = JSON.parse(rawSpec)
    console.error('📌 [init-server.ts] OpenAPI spec parsed successfully')

    // Override baseUrl if specified.
    if (baseUrl) {
      parsed.servers[0].url = baseUrl
      console.error('📌 [init-server.ts] Base URL overridden to:', baseUrl)
    }

    return parsed as OpenAPIV3.Document
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    console.error('❌ [init-server.ts] Failed to parse OpenAPI spec:', (error as Error).message)
    process.exit(1)
  }
}

export async function initProxy(specPath: string, baseUrl: string |undefined) {
  console.error('📌 [init-server.ts] initProxy called')
  const openApiSpec = await loadOpenApiSpec(specPath, baseUrl)
  console.error('📌 [init-server.ts] Creating MCPProxy instance...')
  const proxy = new MCPProxy('Notion API', openApiSpec)
  console.error('📌 [init-server.ts] MCPProxy created successfully')

  return proxy
}
