import { Octokit } from "@octokit/rest";
import { auth } from "@/auth";

export async function GET() {
  try {
    console.log("=== GitHub Repos API Called ===");
    const session = await auth();
    console.log(
      "Session:",
      session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
          }
        : "No session"
    );

    if (!session?.user) {
      console.log("No user in session");
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    // Get the GitHub access token from the database
    const { getAccountByUserId, getUserById } = await import(
      "@/modules/auth/actions"
    );
    if (!session.user.id) {
      return new Response(
        JSON.stringify({ error: "User ID not found in session" }),
        {
          status: 401,
        }
      );
    }

    // Get user with all accounts to find GitHub account
    const user = await getUserById(session.user.id);
    type AccountType = { provider: string; access_token?: string };
    const account = user?.accounts?.find(
      (acc: AccountType) => acc.provider === "github"
    );

    console.log(
      "User accounts:",
      user?.accounts?.map((acc: AccountType) => ({
        provider: acc.provider,
        hasToken: !!acc.access_token,
      }))
    );
    console.log(
      "Found GitHub account:",
      account
        ? {
            provider: account.provider,
            hasToken: !!account.access_token,
          }
        : null
    );

    if (!account?.access_token) {
      // Check if user has any GitHub account linked
      const { getUserById } = await import("@/modules/auth/actions");
      const user = await getUserById(session.user.id);
      type Account = { provider: string };
      const hasGitHubAccount = user?.accounts?.some(
        (acc: Account) => acc.provider === "github"
      );

      if (!hasGitHubAccount) {
        return new Response(
          JSON.stringify({
            error:
              "No GitHub account linked. Please sign in with GitHub to access repositories.",
            needsGitHubAuth: true,
          }),
          {
            status: 401,
          }
        );
      }

      // User has GitHub account but no valid token - needs reauth
      return new Response(
        JSON.stringify({
          error:
            "GitHub access token not found or expired. Please reconnect your GitHub account.",
          needsReauth: true,
        }),
        {
          status: 401,
        }
      );
    }

    // Check if the GitHub account is the one we want (not another provider's token)
    if (account.provider !== "github") {
      // User is authenticated but with a different provider
      const { getUserById } = await import("@/modules/auth/actions");
      const user = await getUserById(session.user.id);
      type Account = { provider: string };
      const hasGitHubAccount = user?.accounts?.some(
        (acc: Account) => acc.provider === "github"
      );

      if (!hasGitHubAccount) {
        return new Response(
          JSON.stringify({
            error:
              "You need to connect your GitHub account to access repositories.",
            needsGitHubAuth: true,
          }),
          {
            status: 401,
          }
        );
      }

      // User has GitHub account but we're getting the wrong token
      return new Response(
        JSON.stringify({
          error: "Please sign in with GitHub to access repositories.",
          needsReauth: true,
        }),
        {
          status: 401,
        }
      );
    }

    const octokit = new Octokit({ auth: account.access_token });

    console.log("GitHub account info:", {
      provider: account.provider,
      hasToken: !!account.access_token,
      tokenLength: account.access_token?.length,
    });

    // Fetch all repositories with pagination
    const allRepos = [];
    let page = 1;
    const perPage = 100; // Maximum allowed per page

    while (true) {
      console.log(`Fetching page ${page} of repositories...`);
      const { data } = await octokit.repos.listForAuthenticatedUser({
        page,
        per_page: perPage,
        sort: "updated",
        direction: "desc",
      });

      console.log(`Page ${page} returned ${data.length} repositories`);
      allRepos.push(...data);

      // If we got fewer than perPage repos, we're done
      if (data.length < perPage) {
        break;
      }

      page++;
    }

    console.log(`Total repositories fetched: ${allRepos.length}`);
    console.log(
      "Repository names:",
      allRepos.map((repo) => repo.name)
    );

    return new Response(JSON.stringify(allRepos), { status: 200 });
  } catch (error) {
    console.error("GitHub API error:", error);

    // Handle specific GitHub API errors
    if (error instanceof Error) {
      if (error.message.includes("Bad credentials")) {
        return new Response(
          JSON.stringify({
            error:
              "GitHub credentials invalid. Please reconnect your GitHub account.",
            needsReauth: true,
          }),
          {
            status: 401,
          }
        );
      }

      if (error.message.includes("Unauthorized")) {
        return new Response(
          JSON.stringify({
            error: "GitHub access revoked. Please sign in with GitHub again.",
            needsReauth: true,
          }),
          {
            status: 401,
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
      }
    );
  }
}
