"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chrome, Github, UserPlus, Shield } from "lucide-react";
import { signIn } from "next-auth/react";
import { useCurrentUser } from "../hooks/use-current-user";

interface GitHubAuthSigninProps {
  needsGitHubAuth?: boolean;
  needsReauth?: boolean;
  onAuthSuccess?: () => void;
}

const GitHubAuthSignin = ({
  needsGitHubAuth = false,
  needsReauth = false,
  onAuthSuccess,
}: GitHubAuthSigninProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const user = useCurrentUser();

  const handleGoogleSignIn = async () => {
    setIsLoading("google");
    try {
      await signIn("google", { callbackUrl: window.location.href });
    } catch (error) {
      console.error("Google sign-in error:", error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsLoading("github");
    try {
      await signIn("github", { callbackUrl: window.location.href });
    } catch (error) {
      console.error("GitHub sign-in error:", error);
    } finally {
      setIsLoading(null);
    }
  };

  const isAuthenticated = !!user;

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Github className="h-6 w-6" />
            GitHub Access Required
          </CardTitle>
          <CardDescription className="text-center">
            {needsGitHubAuth
              ? "Connect your GitHub account to browse repositories"
              : needsReauth
              ? "Reconnect your GitHub account to restore access"
              : "Sign in to access your GitHub repositories"}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {/* If user is already authenticated with Google, show that info */}
          {isAuthenticated && !needsGitHubAuth && (
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium">Currently signed in as:</span>
              </div>
              <p className="text-muted-foreground ml-6">{user.email}</p>
            </div>
          )}

          {/* GitHub Sign In - Primary option */}
          <Button
            onClick={handleGitHubSignIn}
            disabled={isLoading === "github"}
            className="w-full"
            variant={needsGitHubAuth || needsReauth ? "default" : "outline"}
          >
            {isLoading === "github" ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                {needsReauth
                  ? "Reconnect GitHub"
                  : needsGitHubAuth
                  ? "Connect GitHub Account"
                  : "Sign in with GitHub"}
              </>
            )}
          </Button>

          {/* Google Sign In - Show if user is not authenticated or for fresh sign-in */}
          {(!isAuthenticated || !needsGitHubAuth) && (
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading === "google"}
              variant="outline"
              className="w-full"
            >
              {isLoading === "google" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-4 w-4" />
                  {isAuthenticated
                    ? "Add Google Account"
                    : "Sign in with Google"}
                </>
              )}
            </Button>
          )}

          {/* Explanation text */}
          <div className="text-xs text-muted-foreground text-center space-y-1 pt-2">
            {needsGitHubAuth ? (
              <>
                <p>
                  If you&#39;re already signed in with Google, you can connect your
                  GitHub account to access repositories.
                </p>
                <p>
                  This will link both accounts to your profile for seamless
                  access.
                </p>
              </>
            ) : needsReauth ? (
              <p>
                Your GitHub access token has expired. Please sign in again to
                refresh your access to repositories.
              </p>
            ) : (
              <>
                <p>
                  Choose your preferred sign-in method to access GitHub
                  repositories.
                </p>
                <p>
                  You can link multiple accounts to your profile for
                  convenience.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Refresh option for reauth scenarios */}
      {needsReauth && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-muted-foreground hover:text-foreground"
          >
            <Shield className="h-4 w-4 mr-2" />
            Try refreshing the page first
          </Button>
        </div>
      )}
    </div>
  );
};

export default GitHubAuthSignin;
