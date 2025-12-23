declare module "@prisma/client" {
  // Minimal ambient types to satisfy TypeScript when generated types are unavailable.
  export class PrismaClient {
    constructor(options?: any);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    [key: string]: any;
  }

  export const Prisma: any;
  export default PrismaClient;
}
