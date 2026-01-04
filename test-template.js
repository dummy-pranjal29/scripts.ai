import { scanTemplateDirectoryInMemory } from "./modules/playground/lib/path-to-json.js";
import path from "path";
import fs from "fs";

async function testTemplate() {
  try {
    const templateKey = "VUE";
    const templatePath = "/scripts.ai-starters/vue";
    const inputPath = path.join(process.cwd(), templatePath);

    console.log("Template path:", inputPath);
    console.log("Template exists:", fs.existsSync(inputPath));

    const result = await scanTemplateDirectoryInMemory(inputPath);
    console.log("Success! Template folder:", result.folderName);
    console.log("Items count:", result.items.length);

    // Test validation
    const isValid = Array.isArray(result.items) && result.folderName;
    console.log("Structure valid:", isValid);
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

testTemplate();
