"use client";
import React, { useEffect, useState } from "react";

export default function GithubBrowser() {
  type Repo = {
    id: number;
    name: string;
    owner: {
      login: string;
    };
    // Add other fields as needed
  };
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  type File = {
    path: string;
    sha?: string;
    name?: string;
    // Add other fields as needed
  };
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  type Commit = {
    sha: string;
    commit: {
      message: string;
      // Add other known commit fields here if needed, or remove index signature
      author?: {
        name: string;
        email: string;
        date: string;
      };
      // Add more fields as necessary
    };
    // Add other known commit fields here if needed, or remove index signature
  };
  const [commits, setCommits] = useState<Commit[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);

  // Fetch repositories
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch("/api/github/repos");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();

        if (Array.isArray(data)) {
          setRepos(data);
          setError(null);
        } else {
          const errorMessage = data.error || "Failed to fetch repositories";
          console.error("Error fetching repos:", data);
          setError(errorMessage);
          setRepos([]);
        }
      } catch (error) {
        console.error("Error fetching repos:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch repositories"
        );
        setRepos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  // Fetch files when repo is selected
  useEffect(() => {
    if (selectedRepo) {
      fetch(
        `/api/github/files?owner=${
          window.sessionStorage.getItem("github_owner") || ""
        }&repo=${selectedRepo}`
      )
        .then((res) => res.json())
        .then((data) => setFiles(Array.isArray(data) ? data : [data]));
    }
  }, [selectedRepo]);

  // Fetch file content and commits when file is selected
  useEffect(() => {
    if (selectedRepo && selectedFile) {
      fetch(
        `/api/github/files?owner=${
          window.sessionStorage.getItem("github_owner") || ""
        }&repo=${selectedRepo}&path=${selectedFile}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.content) {
            setFileContent(atob(data.content));
          } else {
            setFileContent(null);
          }
        });
      fetch(
        `/api/github/commits?owner=${
          window.sessionStorage.getItem("github_owner") || ""
        }&repo=${selectedRepo}&path=${selectedFile}`
      )
        .then((res) => res.json())
        .then((data) => setCommits(data));
    }
  }, [selectedRepo, selectedFile]);

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-2">GitHub Repository Browser</h2>

      {loading && <div className="text-gray-600">Loading repositories...</div>}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
          <br />
          <small>
            Please make sure you are authenticated with GitHub and have granted
            the necessary permissions.
          </small>
        </div>
      )}

      {!loading && !error && (
        <div>
          <label className="font-semibold">Repositories:</label>
          {repos.length === 0 ? (
            <div className="text-gray-500 mt-2">
              No repositories found. Make sure you have authenticated with
              GitHub.
            </div>
          ) : (
            <ul>
              {repos.map((repo: Repo) => (
                <li key={repo.id}>
                  <button
                    className="text-blue-600 underline"
                    onClick={() => {
                      setSelectedRepo(repo.name);
                      window.sessionStorage.setItem(
                        "github_owner",
                        repo.owner.login
                      );
                      setSelectedFile(null);
                      setFileContent(null);
                      setCommits([]);
                    }}
                  >
                    {repo.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedRepo && (
        <div className="mt-4">
          <label className="font-semibold">Files:</label>
          <ul>
            {files.map((file: File) => (
              <li key={file.path || file.sha}>
                <button
                  className="text-green-600 underline"
                  onClick={() => setSelectedFile(file.path)}
                >
                  {file.name || file.path}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {fileContent && (
        <div className="mt-4">
          <label className="font-semibold">File Content:</label>
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto max-h-64">
            {fileContent}
          </pre>
        </div>
      )}
      {commits.length > 0 && (
        <div className="mt-4">
          <label className="font-semibold">Commit History:</label>
          <ul>
            {commits.map((commit: Commit) => (
              <li key={commit.sha}>
                <span className="font-mono text-xs">
                  {commit.sha.substring(0, 7)}
                </span>
                : {commit.commit.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
