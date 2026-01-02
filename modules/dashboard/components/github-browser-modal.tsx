"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  GitCommit,
  AlertCircle,
  Github,
  Loader2,
  UserPlus,
  Shield,
} from "lucide-react";
import { signIn } from "next-auth/react";
import GitHubAuthSignin from "@/modules/auth/components/github-auth-signin";

interface GithubBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Repo = {
  id: number;
  name: string;
  owner: {
    login: string;
  };
  description?: string;
  language?: string;
  stargazers_count?: number;
  forks_count?: number;
};

type File = {
  path: string;
  sha?: string;
  name?: string;
  type?: string;
};

type Commit = {
  sha: string;
  commit: {
    message: string;
    author?: {
      name: string;
      email: string;
      date: string;
    };
  };
};

export default function GithubBrowserModal({
  isOpen,
  onClose,
}: GithubBrowserModalProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsGitHubAuth, setNeedsGitHubAuth] = useState<boolean>(false);
  const [needsReauth, setNeedsReauth] = useState<boolean>(false);

  // Fetch repositories
  useEffect(() => {
    if (isOpen) {
      const fetchRepos = async () => {
        try {
          setLoading(true);
          setAuthError(null);
          setNeedsGitHubAuth(false);
          setNeedsReauth(false);

          console.log("Starting to fetch GitHub repositories...");
          const res = await fetch("/api/github/repos");
          console.log("Response status:", res.status);
          console.log("Response ok:", res.ok);

          const data = await res.json();
          console.log("Response data:", data);

          if (!res.ok) {
            // Handle authentication errors gracefully without throwing
            const errorMessage = data.error || "Failed to fetch repositories";

            // Check for specific authentication flags from the API
            if (data.needsGitHubAuth) {
              setNeedsGitHubAuth(true);
              setAuthError(
                "No GitHub account linked. Please sign in with GitHub to access repositories."
              );
            } else if (data.needsReauth) {
              setNeedsReauth(true);
              setAuthError(errorMessage);
            } else if (errorMessage === "Not authenticated") {
              setAuthError(
                "Please sign in to access your GitHub repositories."
              );
            } else if (res.status === 401) {
              setAuthError(
                "Please sign in with your GitHub account to access repositories."
              );
            } else {
              setError(errorMessage);
            }

            setRepos([]);
            return;
          }

          if (Array.isArray(data)) {
            console.log("GitHub repos received:", data);
            console.log("Number of repos:", data.length);
            console.log(
              "Repo names:",
              data.map((repo) => repo.name)
            );
            setRepos(data);
            setError(null);
            setAuthError(null);
            setNeedsGitHubAuth(false);
            setNeedsReauth(false);
          } else {
            const errorMessage = data.error || "Failed to fetch repositories";
            console.error("Error fetching repos:", data);
            setError(errorMessage);
            setRepos([]);
          }
        } catch (error) {
          console.error("Error fetching repos:", error);

          // Check if it's an authentication error (401)
          if (error instanceof Error && error.message.includes("401")) {
            setAuthError(
              "Please sign in with your GitHub account to access repositories."
            );
          } else {
            setError(
              error instanceof Error
                ? error.message
                : "Failed to fetch repositories"
            );
          }
          setRepos([]);
        } finally {
          setLoading(false);
        }
      };

      fetchRepos();
    }
  }, [isOpen]);

  // Fetch files when repo is selected
  useEffect(() => {
    if (selectedRepo) {
      const fetchFiles = async () => {
        try {
          setLoadingFiles(true);
          const res = await fetch(
            `/api/github/files?owner=${
              window.sessionStorage.getItem("github_owner") || ""
            }&repo=${selectedRepo}`
          );
          const data = await res.json();
          setFiles(Array.isArray(data) ? data : [data]);
        } catch (error) {
          console.error("Error fetching files:", error);
          setFiles([]);
        } finally {
          setLoadingFiles(false);
        }
      };

      fetchFiles();
    }
  }, [selectedRepo]);

  // Fetch file content and commits when file is selected
  useEffect(() => {
    if (selectedRepo && selectedFile) {
      const fetchFileData = async () => {
        try {
          setLoadingContent(true);

          // Fetch file content
          const contentRes = await fetch(
            `/api/github/files?owner=${
              window.sessionStorage.getItem("github_owner") || ""
            }&repo=${selectedRepo}&path=${selectedFile}`
          );
          const contentData = await contentRes.json();
          if (contentData.content) {
            setFileContent(atob(contentData.content));
          } else {
            setFileContent(null);
          }

          // Fetch commits
          const commitsRes = await fetch(
            `/api/github/commits?owner=${
              window.sessionStorage.getItem("github_owner") || ""
            }&repo=${selectedRepo}&path=${selectedFile}`
          );
          const commitsData = await commitsRes.json();
          setCommits(commitsData);
        } catch (error) {
          console.error("Error fetching file data:", error);
          setFileContent(null);
          setCommits([]);
        } finally {
          setLoadingContent(false);
        }
      };

      fetchFileData();
    }
  }, [selectedRepo, selectedFile]);

  const handleRepoSelect = (repo: Repo) => {
    setSelectedRepo(repo.name);
    window.sessionStorage.setItem("github_owner", repo.owner.login);
    setSelectedFile(null);
    setFileContent(null);
    setCommits([]);
  };

  const handleBack = () => {
    setSelectedRepo(null);
    setSelectedFile(null);
    setFileContent(null);
    setCommits([]);
  };

  const handleClose = () => {
    onClose();
    // Reset state when closing
    setSelectedRepo(null);
    setSelectedFile(null);
    setFileContent(null);
    setCommits([]);
  };

  const handleGitHubSignIn = () => {
    signIn("github", { callbackUrl: window.location.href });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Repository Browser
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : authError ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Authentication Required:</strong> {authError}
                </AlertDescription>
              </Alert>

              <GitHubAuthSignin
                needsGitHubAuth={needsGitHubAuth}
                needsReauth={needsReauth}
                onAuthSuccess={() => {
                  // Refetch repositories after successful authentication
                  setAuthError(null);
                  setNeedsGitHubAuth(false);
                  setNeedsReauth(false);
                  setLoading(true);
                  // Trigger a refetch
                  const fetchRepos = async () => {
                    try {
                      const res = await fetch("/api/github/repos");
                      const data = await res.json();
                      if (res.ok && Array.isArray(data)) {
                        setRepos(data);
                        setError(null);
                        setAuthError(null);
                        setNeedsGitHubAuth(false);
                        setNeedsReauth(false);
                      }
                    } catch (error) {
                      console.error("Error refetching repos:", error);
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchRepos();
                }}
              />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {error}
                <br />
                <small>
                  Please make sure you are authenticated with GitHub and have
                  granted necessary permissions.
                </small>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="h-full flex flex-col">
              {!selectedRepo ? (
                // Repository List
                <div>
                  <h3 className="font-semibold mb-4">Your Repositories</h3>
                  {repos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No repositories found. Make sure you have authenticated
                      with GitHub.
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {repos.map((repo: Repo) => (
                          <div
                            key={repo.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleRepoSelect(repo)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-blue-600 hover:underline">
                                  {repo.name}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  by {repo.owner.login}
                                </p>
                                {repo.description && (
                                  <p className="text-sm mt-2 line-clamp-2">
                                    {repo.description}
                                  </p>
                                )}
                                <div className="flex gap-2 mt-3">
                                  {repo.language && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {repo.language}
                                    </Badge>
                                  )}
                                  {repo.stargazers_count !== undefined && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      ⭐ {repo.stargazers_count}
                                    </Badge>
                                  )}
                                  {repo.forks_count !== undefined && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      🍴 {repo.forks_count}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              ) : (
                // File Explorer
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={handleBack}>
                      ← Back to Repositories
                    </Button>
                    <h3 className="font-semibold">{selectedRepo}</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
                    {/* Files List */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Files
                      </h4>
                      {loadingFiles ? (
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : (
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-1">
                            {files.map((file: File) => (
                              <div
                                key={file.path || file.sha}
                                className={`p-2 rounded cursor-pointer hover:bg-muted transition-colors ${
                                  selectedFile === file.path ? "bg-muted" : ""
                                }`}
                                onClick={() => setSelectedFile(file.path)}
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-green-600" />
                                  <span className="text-sm">
                                    {file.name || file.path}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>

                    {/* File Content & Commits */}
                    <div className="space-y-4">
                      {selectedFile && (
                        <>
                          {/* File Content */}
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">File Content</h4>
                            {loadingContent ? (
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                              </div>
                            ) : fileContent ? (
                              <ScrollArea className="h-[200px]">
                                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                  {fileContent}
                                </pre>
                              </ScrollArea>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                No content available
                              </div>
                            )}
                          </div>

                          {/* Commits */}
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <GitCommit className="h-4 w-4" />
                              Recent Commits
                            </h4>
                            {loadingContent ? (
                              <div className="space-y-2">
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                              </div>
                            ) : commits.length > 0 ? (
                              <ScrollArea className="h-[150px]">
                                <div className="space-y-2">
                                  {commits.slice(0, 5).map((commit: Commit) => (
                                    <div key={commit.sha} className="text-sm">
                                      <div className="flex items-start gap-2">
                                        <span className="font-mono text-xs bg-muted px-1 rounded">
                                          {commit.sha.substring(0, 7)}
                                        </span>
                                        <div className="flex-1">
                                          <p className="font-medium">
                                            {commit.commit.message}
                                          </p>
                                          {commit.commit.author && (
                                            <p className="text-xs text-muted-foreground">
                                              {commit.commit.author.name} •{" "}
                                              {new Date(
                                                commit.commit.author.date
                                              ).toLocaleDateString()}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                No commits found
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
