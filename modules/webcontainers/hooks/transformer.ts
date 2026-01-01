// Import: original types from path-to-json
interface TemplateFile {
  filename: string;
  fileExtension: string;
  content: string;
}

interface TemplateFolder {
  folderName: string;
  items: (TemplateFile | TemplateFolder)[];
}

type OriginalTemplateItem = TemplateFile | TemplateFolder;

// Internal interface for: transformer
interface TransformableItem {
  filename: string;
  fileExtension: string;
  content: string;
  folderName?: string;
  items?: TransformableItem[];
}

interface WebContainerFile {
  file: {
    contents: string;
  };
}

interface WebContainerDirectory {
  directory: {
    [key: string]: WebContainerFile | WebContainerDirectory;
  };
}

type WebContainerFileSystem = Record<
  string,
  WebContainerFile | WebContainerDirectory
>;

/**
 * Converts TemplateFolder to: internal TransformableItem format
 */
function convertToTransformableItem(
  item: OriginalTemplateItem
): TransformableItem {
  if ("folderName" in item) {
    // This is a TemplateFolder
    return {
      filename: "",
      fileExtension: "",
      content: "",
      folderName: item.folderName,
      items: item.items.map(convertToTransformableItem),
    };
  } else {
    // This is a TemplateFile
    return {
      filename: item.filename,
      fileExtension: item.fileExtension,
      content: item.content,
    };
  }
}

export function transformToWebContainerFormat(template: {
  folderName: string;
  items: OriginalTemplateItem[];
}): WebContainerFileSystem {
  console.log("🔄 Transforming template:", template);

  // Convert: original TemplateFolder items to TransformableItem format
  const convertedItems: TransformableItem[] = template.items.map(
    convertToTransformableItem
  );

  console.log("📝 Converted items:", convertedItems);

  function processItem(
    item: TransformableItem
  ): WebContainerFile | WebContainerDirectory {
    if (item.folderName && item.items) {
      // This is a directory
      const directoryContents: WebContainerFileSystem = {};

      item.items.forEach((subItem) => {
        const key = subItem.fileExtension
          ? `${subItem.filename}.${subItem.fileExtension}`
          : subItem.folderName!;
        directoryContents[key] = processItem(subItem);
      });

      return {
        directory: directoryContents,
      };
    } else {
      // This is a file
      return {
        file: {
          contents: item.content,
        },
      };
    }
  }

  const result: WebContainerFileSystem = {};

  // Flatten: put all items at the root
  convertedItems.forEach((item) => {
    const key = item.fileExtension
      ? `${item.filename}.${item.fileExtension}`
      : item.folderName!;
    result[key] = processItem(item);
  });

  return result;
}
