import { useState, useEffect, useCallback, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/modules/playground/lib/template-types";
import { transformToWebContainerFormat } from "./transformer";

declare global {
  interface GlobalThis {
    __webcontainerInstance?: WebContainer | null;
    __webcontainerPromise?: Promise<WebContainer> | null;
  }
}

interface UseWebContainerProps {
  templateData: TemplateFolder;
  onTerminalData?: (data: string) => void; // callback for terminal output
}

interface UseWebContainerReturn {
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  destory: () => void;
}

export const useWebContainer = ({
  templateData,
  onTerminalData,
}: UseWebContainerProps): UseWebContainerReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<WebContainer | null>(null);
  const [lastWriteTime, setLastWriteTime] = useState<number>(0);

  // Singleton WebContainer instance (module-level)
  const webContainerSingleton: WebContainer | null =
    (globalThis as GlobalThis).__webcontainerInstance || null;
  const webContainerPromise: Promise<WebContainer> | null =
    (globalThis as GlobalThis).__webcontainerPromise || null;

  useEffect(() => {
    let mounted = true;

    async function initializeWebContainer() {
      try {
        // Check if WebContainer is supported in this environment
        if (typeof window === "undefined") {
          setError("WebContainer requires a browser environment");
          setIsLoading(false);
          return;
        }
        if (!WebContainer || typeof WebContainer.boot !== "function") {
          setError("WebContainer API not available");
          setIsLoading(false);
          return;
        }
        if (webContainerSingleton) {
          setInstance(webContainerSingleton);
          setIsLoading(false);
          return;
        }
        if (webContainerPromise) {
          const inst = await webContainerPromise;
          if (!mounted) return;
          setInstance(inst);
          setIsLoading(false);
          return;
        }
        const newPromise = WebContainer.boot();
        (globalThis as GlobalThis).__webcontainerPromise = newPromise;
        const inst = await newPromise;
        (globalThis as GlobalThis).__webcontainerInstance = inst;
        if (!mounted) return;
        setInstance(inst);
        setIsLoading(false);
      } catch (error) {
        if (mounted) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("window")) {
            setError(
              "WebContainer requires a browser environment. Please open this page in a modern browser."
            );
          } else if (errorMessage.includes("SharedArrayBuffer")) {
            setError(
              "WebContainer requires SharedArrayBuffer support. Please enable cross-origin isolation."
            );
          } else if (errorMessage.includes("security")) {
            setError(
              "WebContainer security requirements not met. Please check browser security settings."
            );
          } else {
            setError(`WebContainer initialization failed: ${errorMessage}`);
          }
          setIsLoading(false);
        }
      }
    }

    initializeWebContainer();

    return () => {
      mounted = false;
    };
  }, []);

  // Simplified hot reload mechanism - just trigger iframe refresh
  const writeFileSync = useCallback(
    async (path: string, content: string): Promise<void> => {
      if (!instance) {
        throw new Error("WebContainer instance is not available");
      }

      try {
        const pathParts = path.split("/");
        const folderPath = pathParts.slice(0, -1).join("/");

        if (folderPath) {
          await instance.fs.mkdir(folderPath, { recursive: true }); // Create folder structure recursively
        }

        await instance.fs.writeFile(path, content);

        // Trigger hot reload by updating timestamp
        const currentTime = Date.now();
        setLastWriteTime(currentTime);

        // Log to terminal if callback provided
        if (onTerminalData) {
          onTerminalData(`📝 File saved: ${path}\r\n`);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to write file";
        console.error(`Failed to write file at ${path}:`, err);
        throw new Error(`Failed to write file at ${path}: ${errorMessage}`);
      }
    },
    [instance, onTerminalData]
  );

  const destory = useCallback(() => {
    if (instance) {
      instance.teardown();
      setInstance(null);
      setServerUrl(null);
    }
  }, [instance]);

  return { serverUrl, isLoading, error, instance, writeFileSync, destory };
};
