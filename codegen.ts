import type { CodegenConfig } from "@graphql-codegen/cli";

// Local dev: ../auraxis-api/schema.graphql (monorepo layout, same level as auraxis-app)
// CI: set GRAPHQL_SCHEMA_PATH to the raw GitHub URL or a checked-out path
const schema: string =
  process.env["GRAPHQL_SCHEMA_PATH"] ?? "../auraxis-api/schema.graphql";

const config: CodegenConfig = {
  schema,
  documents: [
    "features/**/*.{ts,tsx,graphql,gql}",
    "shared/**/*.{ts,tsx,graphql,gql}",
  ],
  generates: {
    "shared/types/generated/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
      config: {
        strictScalars: true,
        scalars: {
          UUID: "string",
          DecimalScalar: "string",
          DateTime: "string",
          JSONString: "string",
        },
        enumsAsTypes: true,
        avoidOptionals: false,
        nonOptionalTypename: false,
        useTypeImports: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
