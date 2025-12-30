/**
 * Represents a file in template structure
 */
export interface TemplateFile {
  filename: string;
  fileExtension: string;
  content: string;
}

/**
 * Represents a folder in the template structure which can contain files and other folders
 */
export interface TemplateFolder {
  folderName: string;
  items: (TemplateFile | TemplateFolder)[];
}

export interface OpenFile extends TemplateFile {
  id: string;
  originalContent: string;
  hasUnsavedChanges: boolean;
}

/**
 * Type representing either a file or folder in the template structure
 */
export type TemplateItem = TemplateFile | TemplateFolder;

/**
 * Finds the file path for a given TemplateFile within the template structure
 *
 * @param file - The TemplateFile to find
 * @param templateData - The template structure to search within
 * @param currentPath - Current path during recursive search (internal use)
 * @returns The file path if found, null otherwise
 */
export function findFilePath(
  file: TemplateFile,
  templateData: TemplateFolder,
  currentPath: string = ""
): string | null {
  return searchFileInItems(file, templateData.items, currentPath);
}

/**
 * Helper function to search for a file within items array
 *
 * @param file - The TemplateFile to find
 * @param items - Array of TemplateItem to search within
 * @param currentPath - Current path during recursive search
 * @returns The file path if found, null otherwise
 */
function searchFileInItems(
  file: TemplateFile,
  items: TemplateItem[],
  currentPath: string
): string | null {
  for (const item of items) {
    if ("folderName" in item) {
      // It's a folder, search recursively
      const folderPath = currentPath
        ? `${currentPath}/${item.folderName}`
        : item.folderName;
      const result = searchFileInItems(file, item.items, folderPath);
      if (result) {
        return result;
      }
    } else {
      // It's a file, check if it matches
      if (
        item.filename === file.filename &&
        item.fileExtension === file.fileExtension
      ) {
        const fileName = `${item.filename}.${item.fileExtension}`;
        return currentPath ? `${currentPath}/${fileName}` : fileName;
      }
    }
  }
  return null;
}
