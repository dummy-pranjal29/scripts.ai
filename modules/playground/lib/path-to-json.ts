import { TemplateFile, TemplateFolder, TemplateItem } from "./template-types";

// Server-side implementation for reading template structure from JSON
export const readTemplateStructureFromJson = async (
  filePath: string
): Promise<TemplateFolder> => {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    // Validate the structure matches our TemplateFolder interface
    if (!data.folderName || !Array.isArray(data.items)) {
      throw new Error("Invalid template structure in JSON file");
    }

    return data as TemplateFolder;
  } catch (error) {
    console.error("Error reading template structure from JSON:", error);
    throw new Error(`Failed to read template from ${filePath}: ${error}`);
  }
};

export const saveTemplateStructureToJson = async (
  templatePath: string,
  outputPath: string
): Promise<void> => {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    // First, scan the template directory to get the structure
    const templateStructure = await scanTemplateDirectory(templatePath);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write the structure to JSON file
    const jsonString = JSON.stringify(templateStructure, null, 2);
    await fs.writeFile(outputPath, jsonString, "utf-8");

    console.log(`Template structure saved to ${outputPath}`);
  } catch (error) {
    console.error("Error saving template structure to JSON:", error);
    throw new Error(`Failed to save template to ${outputPath}: ${error}`);
  }
};

export const scanTemplateDirectory = async (
  templatePath: string
): Promise<TemplateFolder> => {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    const stats = await fs.stat(templatePath);
    if (!stats.isDirectory()) {
      throw new Error("Template path must be a directory");
    }

    const folderName = path.basename(templatePath);
    const items = await scanDirectory(templatePath);

    return {
      folderName,
      items,
    };
  } catch (error) {
    console.error("Error scanning template directory:", error);
    throw new Error(
      `Failed to scan template directory ${templatePath}: ${error}`
    );
  }
};

async function scanDirectory(dirPath: string): Promise<TemplateItem[]> {
  const fs = await import("fs/promises");
  const path = await import("path");

  try {
    const items: TemplateItem[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other common ignore directories
        if (
          ["node_modules", ".git", ".next", "dist", "build"].includes(
            entry.name
          )
        ) {
          continue;
        }

        // Recursively scan subdirectory
        const subItems = await scanDirectory(fullPath);
        items.push({
          folderName: entry.name,
          items: subItems,
        });
      } else if (entry.isFile()) {
        // Read file content
        try {
          const content = await fs.readFile(fullPath, "utf-8");
          const parsedPath = path.parse(entry.name);

          items.push({
            filename: parsedPath.name,
            fileExtension: parsedPath.ext.slice(1), // Remove the dot
            content,
          });
        } catch (fileError) {
          console.warn(`Failed to read file ${fullPath}:`, fileError);
          // Skip files that can't be read (binary files, etc.)
          continue;
        }
      }
    }

    return items;
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    throw error;
  }
}
