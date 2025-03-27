import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { faker } from "@faker-js/faker";
import { z } from "zod";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  ToolArgument,
} from "@modelcontextprotocol/sdk/types";

// Mock 데이터 생성 파라미터 스키마 정의
const GenerateMockDataSchema = z.object({
  count: z.number().min(1).max(100).default(1),
  fields: z.array(z.string()).min(1),
});

// 도구 정의
const generateMockDataTool: Tool = {
  name: "generate-mock-data",
  description: "사용자 지정 필드에 대한 Mock 데이터 생성",
  arguments: [
    {
      name: "count",
      description: "생성할 데이터 개수 (1-100)",
      required: false,
      type: "number",
    } as ToolArgument,
    {
      name: "fields",
      description: "생성할 필드 목록 (name, email, phone, address 등)",
      required: true,
      type: "array",
    } as ToolArgument,
  ],
};

// 서버 인스턴스 생성
const server = new Server({
  name: "mock-data-generator",
  version: "1.0.0",
  description: "Mock 데이터 생성 MCP 서버",
}, {
  capabilities: {
    tools: {
      version: "1.0.0",
    },
  },
});

// 사용 가능한 도구 목록 반환
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [generateMockDataTool],
  };
});

// Mock 데이터 생성 도구 구현
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "generate-mock-data") {
    try {
      const { count, fields } = GenerateMockDataSchema.parse(request.params.arguments);
      
      const mockData = Array.from({ length: count }, () => {
        const data: Record<string, string> = {};
        
        fields.forEach(field => {
          switch (field.toLowerCase()) {
            case "name":
              data.name = faker.person.fullName();
              break;
            case "email":
              data.email = faker.internet.email();
              break;
            case "phone":
              data.phone = faker.phone.number();
              break;
            case "address":
              data.address = faker.location.streetAddress();
              break;
            case "company":
              data.company = faker.company.name();
              break;
            case "job":
              data.job = faker.person.jobTitle();
              break;
            case "city":
              data.city = faker.location.city();
              break;
            case "country":
              data.country = faker.location.country();
              break;
            default:
              data[field] = faker.string.sample();
          }
        });
        
        return data;
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(mockData, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid arguments: ${error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", ")}`,
        );
      }
      throw error;
    }
  }
  
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// 서버 실행
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mock Data Generator MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 