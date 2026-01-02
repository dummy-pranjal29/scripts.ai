import { Octokit } from "@octokit/rest";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("next-auth.session-token")?.value ||
    cookieStore.get("next-auth.token")?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
    });
  }
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");
  const path = url.searchParams.get("path") || "";

  if (!owner || !repo) {
    return new Response(JSON.stringify({ error: "Missing owner or repo" }), {
      status: 400,
    });
  }
  const octokit = new Octokit({ auth: token });
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
      }
    );
  }
}
