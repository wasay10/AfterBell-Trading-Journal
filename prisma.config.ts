import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter: () => new PrismaPg({ connectionString: process.env.DATABASE_URL! }) as any,
  },
});
