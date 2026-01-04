s; // Simple test to check if environment variables are loaded correctly
require("dotenv").config();

console.log(
  "NEXTAUTH_SECRET:",
  process.env.NEXTAUTH_SECRET ? "Set" : "Missing"
);
console.log(
  "NEXTAUTH_GITHUB_ID:",
  process.env.NEXTAUTH_GITHUB_ID ? "Set" : "Missing"
);
console.log(
  "NEXTAUTH_GITHUB_SECRET:",
  process.env.NEXTAUTH_GITHUB_SECRET ? "Set" : "Missing"
);
console.log(
  "NEXTAUTH_GOOGLE_ID:",
  process.env.NEXTAUTH_GOOGLE_ID ? "Set" : "Missing"
);
console.log(
  "NEXTAUTH_GOOGLE_SECRET:",
  process.env.NEXTAUTH_GOOGLE_SECRET ? "Set" : "Missing"
);
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL ? "Set" : "Missing");

console.log(
  "\nOAuth Redirect URIs that should be configured in your provider dashboards:"
);
console.log("GitHub: http://localhost:3000/api/auth/callback/github");
console.log("Google: http://localhost:3000/api/auth/callback/google");
