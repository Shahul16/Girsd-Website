import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

/**
 * Self-diagnostic endpoint so the admin can verify, from the UI, whether
 * publishing is correctly wired up — without having to read Railway logs.
 * Checks that ADMIN_KEY / GITHUB_TOKEN / GITHUB_REPO are set, then makes a
 * live GitHub API call to confirm the token can actually see the configured
 * repo and branch. Protected by ADMIN_KEY (sent as ?key=... or header).
 */
export async function GET(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return NextResponse.json({ error: "ADMIN_KEY is not set on the server" }, { status: 503 });
  }
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Invalid admin key" }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? "main";

  const env = {
    ADMIN_KEY: true,
    GITHUB_TOKEN: !!token,
    GITHUB_REPO: !!repo,
    GITHUB_BRANCH_configured: !!process.env.GITHUB_BRANCH,
  };

  if (!token || !repo) {
    return NextResponse.json({
      ok: false,
      env,
      repo: repo ?? null,
      branch,
      message: "Publishing is not fully configured. Set the missing Railway variable(s) below, then redeploy.",
    });
  }

  // Live check: can this token see this repo/branch, and can it write?
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "girsd-admin" };
  const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  const repoInfo = repoRes.ok ? await repoRes.json() : null;

  const branchRes = await fetch(`https://api.github.com/repos/${repo}/branches/${branch}`, { headers });

  const checks = {
    repoReachable: repoRes.ok,
    repoStatus: repoRes.status,
    repoPushAccess: repoInfo?.permissions?.push ?? null,
    branchExists: branchRes.ok,
    branchStatus: branchRes.status,
  };

  const ok = checks.repoReachable && checks.branchExists && checks.repoPushAccess !== false;

  return NextResponse.json({
    ok,
    env,
    repo,
    branch,
    checks,
    message: ok
      ? `Connected — this token can read and write to ${repo}@${branch}. Admin changes should go live via Railway's auto-deploy within a couple of minutes.`
      : !checks.repoReachable
      ? `Can't reach repo "${repo}" (HTTP ${checks.repoStatus}). Check GITHUB_REPO is spelled exactly as "owner/name" and the token has access to it.`
      : !checks.branchExists
      ? `Branch "${branch}" not found on ${repo} (HTTP ${checks.branchStatus}). Check GITHUB_BRANCH, or that Railway is deployed from this branch.`
      : `Token can read ${repo} but does not appear to have push (write) access. Regenerate GITHUB_TOKEN with "repo" contents write permission.`,
  });
}
