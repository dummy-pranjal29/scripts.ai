import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function checkPlayground() {
  try {
    const playground = await db.playground.findUnique({
      where: { id: "cmjxbfk0e0004urrcyzubqsys" },
      include: { templateFile: true },
    });
    console.log("Playground data:", JSON.stringify(playground, null, 2));

    if (playground) {
      console.log("\nTemplate:", playground.template);
      console.log("TemplateFile exists:", !!playground.templateFile);
      if (playground.templateFile) {
        console.log(
          "TemplateFile content type:",
          typeof playground.templateFile.content
        );
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await db.$disconnect();
  }
}

checkPlayground();
