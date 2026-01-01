"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";

import { transformToWebContainerFormat } from "../hooks/transformer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/modules/playground/lib/template-types";
import TerminalComponent, { TerminalRef } from "./terminal";

interface WebContainerPreviewProps {
  templateData: TemplateFolder;
  serverUrl: string;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  forceResetup?: boolean; // Optional prop to force re-setup
}
const WebContainerPreview = ({
  templateData,
  error,
  instance,
  isLoading,
  serverUrl,
  writeFileSync,
  forceResetup = false,
}: WebContainerPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loadingState, setLoadingState] = useState({
    transforming: false,
    mounting: false,
    installing: false,
    starting: false,
    ready: false,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const [lastWriteTime, setLastWriteTime] = useState<number>(0);
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const terminalRef = useRef<TerminalRef>(null);

  // Callback to write data to terminal from WebContainer processes
  const handleTerminalData = useCallback((data: string) => {
    if (terminalRef.current?.writeToTerminal) {
      terminalRef.current.writeToTerminal(data);
    }
  }, []);

  // Hot reload mechanism - triggers when files are written
  const triggerHotReload = useCallback(() => {
    if (!instance || !isSetupComplete) return;

    const currentTime = Date.now();
    setLastWriteTime(currentTime);

    // Clear any existing timeout
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    // Set a new timeout to trigger reload after a short delay
    reloadTimeoutRef.current = setTimeout(async () => {
      try {
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "🔄 Detecting file changes, triggering hot reload...\r\n"
          );
        }

        // Check if it's a React/Vue/Angular project and trigger appropriate reload
        try {
          const packageJson = await instance.fs.readFile(
            "package.json",
            "utf8"
          );
          const packageData = JSON.parse(packageJson);

          // Check if this is an Express project with custom hot reload
          if (packageData.dependencies?.express) {
            // For Express projects, use custom API endpoint
            try {
              // Read current files to send to Express API
              const indexHtml = await instance.fs
                .readFile("pages/index.html", "utf8")
                .catch(() => "");
              const styleCss = await instance.fs
                .readFile("static/style.css", "utf8")
                .catch(() => "");

              // Send update to Express hot reload API
              const response = await fetch(`${previewUrl}/api/content`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  html: indexHtml,
                  css: styleCss,
                }),
              });

              if (response.ok) {
                if (terminalRef.current?.writeToTerminal) {
                  terminalRef.current.writeToTerminal(
                    "✅ Express hot reload triggered successfully\r\n"
                  );
                }
                return;
              } else {
                throw new Error(
                  `Express API responded with ${response.status}`
                );
              }
            } catch (apiError) {
              console.error("Express API hot reload failed:", apiError);
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(
                  `⚠️ Express API reload failed: ${apiError}\r\n`
                );
              }
              // Fall through to generic reload
            }
          }

          // Different reload strategies based on framework
          if (
            packageData.dependencies?.react ||
            packageData.dependencies?.["react-dom"]
          ) {
            // React projects - try to trigger HMR
            await instance.spawn("pkill", ["-f", "npm"]);
            setTimeout(() => {
              instance.spawn("npm", ["run", "start"]).then((process) => {
                process.output.pipeTo(
                  new WritableStream({
                    write(data) {
                      if (terminalRef.current?.writeToTerminal) {
                        terminalRef.current.writeToTerminal(data);
                      }
                    },
                  })
                );
              });
            }, 1000);
          } else if (packageData.dependencies?.vue) {
            // Vue projects - similar approach
            await instance.spawn("pkill", ["-f", "npm"]);
            setTimeout(() => {
              instance.spawn("npm", ["run", "serve"]).then((process) => {
                process.output.pipeTo(
                  new WritableStream({
                    write(data) {
                      if (terminalRef.current?.writeToTerminal) {
                        terminalRef.current.writeToTerminal(data);
                      }
                    },
                  })
                );
              });
            }, 1000);
          } else {
            // Generic approach - restart the dev server
            await instance.spawn("pkill", ["-f", "npm"]);
            setTimeout(() => {
              instance.spawn("npm", ["run", "start"]).then((process) => {
                process.output.pipeTo(
                  new WritableStream({
                    write(data) {
                      if (terminalRef.current?.writeToTerminal) {
                        terminalRef.current.writeToTerminal(data);
                      }
                    },
                  })
                );

                // Re-register server-ready listener
                instance.on("server-ready", (port: number, url: string) => {
                  if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal(
                      `🌐 Server reloaded at ${url}\r\n`
                    );
                  }
                  setPreviewUrl(url);
                });
              });
            }, 1000);
          }

          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              "✅ Hot reload triggered successfully\r\n"
            );
          }
        } catch (error) {
          console.error("Hot reload error:", error);
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              `⚠️ Hot reload failed: ${error}\r\n`
            );
          }
        }
      } catch (error) {
        console.error("Error during hot reload:", error);
      }
    }, 500); // Wait 500ms after last write before triggering reload
  }, [instance, isSetupComplete, previewUrl]);

  // Override writeFileSync to include hot reload
  const writeFileSyncWithHotReload = useCallback(
    async (path: string, content: string): Promise<void> => {
      try {
        await writeFileSync(path, content);
        triggerHotReload();
      } catch (error) {
        console.error("Error in writeFileSyncWithHotReload:", error);
        throw error;
      }
    },
    [writeFileSync, triggerHotReload]
  );

  // Reset setup state when forceResetup changes
  useEffect(() => {
    if (forceResetup) {
      setIsSetupComplete(false);
      setIsSetupInProgress(false);
      setPreviewUrl("");
      setCurrentStep(0);
      setLoadingState({
        transforming: false,
        mounting: false,
        installing: false,
        starting: false,
        ready: false,
      });
    }
  }, [forceResetup]);

  useEffect(() => {
    // Check WebContainer browser compatibility
    if (typeof window !== "undefined") {
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";
      const hasCrossOriginIsolated = window.crossOriginIsolated;

      if (!hasSharedArrayBuffer || !hasCrossOriginIsolated) {
        const errorMessage = !hasSharedArrayBuffer
          ? "WebContainer requires SharedArrayBuffer support. Please use a modern browser (Chrome 87+, Firefox 89+, Safari 14+)."
          : "WebContainer requires cross-origin isolation. Please ensure proper CORS headers are set.";

        setSetupError(errorMessage);
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            `❌ Browser Compatibility Error: ${errorMessage}\r\n`
          );
        }
        return;
      }
    }

    async function setupContainer() {
      if (!instance || isSetupComplete || isSetupInProgress) return;

      try {
        setIsSetupInProgress(true);
        setSetupError(null);

        console.log("🚀 Starting WebContainer setup...");
        console.log("📋 Template data:", templateData);
        console.log("🔧 Instance:", instance);

        try {
          // Check if key files exist to determine if container is already set up
          const [packageJsonResult, nodeModulesResult] =
            await Promise.allSettled([
              instance.fs.readFile("package.json", "utf8"),
              instance.fs
                .readFile("node_modules/.package-lock.json", "utf8")
                .catch(() => null),
            ]);

          const packageJsonExists =
            packageJsonResult.status === "fulfilled" && packageJsonResult.value;
          const nodeModulesExist =
            nodeModulesResult.status === "fulfilled" && nodeModulesResult.value;

          if (packageJsonExists && nodeModulesExist) {
            // Container is already set up, try to reconnect to existing server
            if (terminalRef.current?.writeToTerminal) {
              terminalRef.current.writeToTerminal(
                "🔄 Detected existing WebContainer session, reconnecting...\r\n"
              );
            }

            // Set loading state to show we're reconnecting
            setCurrentStep(4);
            setLoadingState((prev) => ({ ...prev, starting: true }));

            // Try to detect if server is already running by checking common ports
            const serverCheckPromise = new Promise<string>(
              (resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error("Server check timeout"));
                }, 3000); // 3 second timeout

                instance.on("server-ready", (port: number, url: string) => {
                  clearTimeout(timeout);
                  resolve(url);
                });

                // If no server-ready event within 3 seconds, assume server needs to be started
                setTimeout(() => {
                  if (!previewUrl) {
                    reject(new Error("No server detected"));
                  }
                }, 2000);
              }
            );

            try {
              const serverUrl = await serverCheckPromise;
              setPreviewUrl(serverUrl);
              setLoadingState((prev) => ({
                ...prev,
                starting: false,
                ready: true,
              }));
              setIsSetupComplete(true);
              setIsSetupInProgress(false);

              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(
                  `🌐 Successfully reconnected to server at ${serverUrl}\r\n`
                );
              }
              return;
            } catch (serverError) {
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(
                  `⚠️ Server not running, starting it...\r\n`
                );
              }
              // Fall through to start the server
            }
          }
        } catch (error) {
          // Container is not set up, proceed with full setup
        }

        // Step-1 transform data
        setLoadingState((prev) => ({ ...prev, transforming: true }));
        setCurrentStep(1);
        // Write to terminal
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "🔄 Transforming template data...\r\n"
          );
        }

        console.log("🔄 Starting template transformation...");
        const files = transformToWebContainerFormat(templateData);
        console.log("📁 Transformed files:", files);

        setLoadingState((prev) => ({
          ...prev,
          transforming: false,
          mounting: true,
        }));
        setCurrentStep(2);

        //  Step-2 Mount Files

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "📁 Mounting files to WebContainer...\r\n"
          );
        }

        console.log("📁 Starting file mount operation...");
        try {
          await instance.mount(files);
          console.log("✅ Files mounted successfully");

          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              "✅ Files mounted successfully\r\n"
            );
          }
        } catch (mountError) {
          console.error("❌ File mount error:", mountError);
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              `❌ File mount failed: ${
                mountError instanceof Error
                  ? mountError.message
                  : String(mountError)
              }\r\n`
            );
          }
          throw mountError;
        }
        setLoadingState((prev) => ({
          ...prev,
          mounting: false,
          installing: true,
        }));
        setCurrentStep(3);

        // Step-3 Install dependencies

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "📦 Installing dependencies...\r\n"
          );
        }

        const installProcess = await instance.spawn("npm", ["install"]);

        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(data);
              }
            },
          })
        );

        // Add timeout for installation (2 minutes)
        const installTimeout = setTimeout(() => {
          if (installProcess.kill) {
            installProcess.kill();
            throw new Error("Installation timed out after 2 minutes");
          }
        }, 120000);

        const installExitCode = await installProcess.exit;
        clearTimeout(installTimeout);

        if (installExitCode !== 0) {
          throw new Error(
            `Failed to install dependencies. Exit code: ${installExitCode}`
          );
        }

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "✅ Dependencies installed successfully\r\n"
          );
        }

        setLoadingState((prev) => ({
          ...prev,
          installing: false,
          starting: true,
        }));
        setCurrentStep(4);

        // STEP-4 Start The Server

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "🚀 Starting development server...\r\n"
          );
        }

        const startProcess = await instance.spawn("npm", ["run", "start"]);

        // Add timeout for server startup (1 minute)
        const serverTimeout = setTimeout(() => {
          if (startProcess.kill) {
            startProcess.kill();
            throw new Error("Server startup timed out after 1 minute");
          }
        }, 60000);

        instance.on("server-ready", (port: number, url: string) => {
          clearTimeout(serverTimeout);
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              `🌐 Server ready at ${url}\r\n`
            );
          }
          setPreviewUrl(url);
          setLoadingState((prev) => ({
            ...prev,
            starting: false,
            ready: true,
          }));
          setIsSetupComplete(true);
          setIsSetupInProgress(false);
        });

        // Handle start process output - stream to terminal
        startProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(data);
              }
            },
          })
        );

        // Handle server process exit
        startProcess.exit.then((exitCode) => {
          if (exitCode !== 0 && !isSetupComplete) {
            clearTimeout(serverTimeout);
            throw new Error(`Server process exited with code: ${exitCode}`);
          }
        });
      } catch (err) {
        console.error("Error setting up container:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(`❌ Error: ${errorMessage}\r\n`);
        }

        // Retry logic
        if (retryCount < maxRetries) {
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);

          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              `🔄 Retrying setup... Attempt ${newRetryCount} of ${maxRetries}\r\n`
            );
          }

          // Reset state and retry after a delay
          setTimeout(() => {
            setSetupError(null);
            setCurrentStep(0);
            setLoadingState({
              transforming: false,
              mounting: false,
              installing: false,
              starting: false,
              ready: false,
            });
          }, 2000 * newRetryCount); // Exponential backoff
        } else {
          // Max retries reached, show final error
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              `❌ Max retries (${maxRetries}) reached. Setup failed.\r\n`
            );
          }
          setSetupError(`${errorMessage} (Failed after ${maxRetries} retries)`);
          setIsSetupInProgress(false);
          setLoadingState({
            transforming: false,
            mounting: false,
            installing: false,
            starting: false,
            ready: false,
          });
        }
      }
    }

    setupContainer();
  }, [instance, templateData, isSetupComplete, isSetupInProgress]);

  useEffect(() => {
    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 rounded-lg bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <h3 className="text-lg font-medium">Initializing WebContainer</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Setting up environment for your project...
          </p>
        </div>
      </div>
    );
  }

  if (error || setupError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5" />
            <h3 className="font-semibold">Error</h3>
          </div>
          <p className="text-sm">{error || setupError}</p>
        </div>
      </div>
    );
  }
  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (stepIndex === currentStep) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    } else {
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepText = (stepIndex: number, label: string) => {
    const isActive = stepIndex === currentStep;
    const isComplete = stepIndex < currentStep;

    return (
      <span
        className={`text-sm font-medium ${
          isComplete
            ? "text-green-600"
            : isActive
            ? "text-blue-600"
            : "text-gray-500"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {!previewUrl ? (
        <div className="h-full flex flex-col">
          <div className="w-full max-w-md p-6 m-5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm mx-auto">
            <Progress
              value={(currentStep / totalSteps) * 100}
              className="h-2 mb-6"
            />

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                {getStepIcon(1)}
                {getStepText(1, "Transforming template data")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(2)}
                {getStepText(2, "Mounting files")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(3)}
                {getStepText(3, "Installing dependencies")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(4)}
                {getStepText(4, "Starting development server")}
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div className="flex-1 p-4">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            {previewUrl ? (
              <iframe
                key={lastWriteTime} // Force iframe reload when files change
                src={previewUrl}
                className="w-full h-full border-none"
                title="WebContainer Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                allow="clipboard-read; clipboard-write;"
                onLoad={() => {
                  console.log(
                    "Preview iframe loaded successfully:",
                    previewUrl
                  );
                }}
                onError={(e) => {
                  console.error("Preview iframe error:", e);
                  if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal(
                      `❌ Preview iframe error: ${e}\r\n`
                    );
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-center">
                  <div className="text-lg font-medium mb-2">
                    Preview Loading...
                  </div>
                  <div className="text-sm text-gray-500">
                    Waiting for server to start...
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-64 border-t">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WebContainerPreview;
