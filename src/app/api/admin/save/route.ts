import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const VALID_COLLECTIONS = ["events", "courses", "awards", "news", "site", "hero", "pages", "members", "reports"];

/**
 * Commits a content collection to local disk and/or GitHub (src/content/<collection>.json).
 * In local development, saves directly to disk so you can preview changes immediately.
 * In production (with GITHUB_TOKEN & GITHUB_REPO), commits to GitHub to trigger live redeployment.
 */
export async function POST(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY;
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? "main";

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // If ADMIN_KEY is configured, check it. In dev mode without ADMIN_KEY, allow local saves.
  if (adminKey && body.adminKey !== adminKey) {
    return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
  }

  const collection = String(body.collection || "");
  if (!VALID_COLLECTIONS.includes(collection)) {
    return NextResponse.json({ error: `Unknown collection: ${collection}` }, { status: 400 });
  }

  const data = body.data;
  if (data === undefined || data === null) {
    return NextResponse.json({ error: "Data is required" }, { status: 400 });
  }

  // 1. Write to local disk if we can access the project directory
  let localSaved = false;
  try {
    const filePath = path.join(process.cwd(), "src", "content", `${collection}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    localSaved = true;
  } catch (err) {
    console.warn("Could not save to local filesystem:", err);
  }

  // 2. If GitHub credentials are provided, commit to GitHub
  if (token && repo) {
    const filePath = `src/content/${collection}.json`;
    const api = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "girsd-admin",
    };

    try {
      const current = await fetch(`${api}?ref=${branch}`, { headers });
      if (!current.ok) {
        const detail = await current.text();
        return NextResponse.json(
          {
            error: `GitHub read failed (${current.status})`,
            detail,
            hint: `Check GITHUB_REPO ("${repo}") and branch "${branch}".`,
            localSaved,
          },
          { status: 502 }
        );
      }

      const { sha } = await current.json();
      const content = Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64");
      const commit = await fetch(api, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Admin update: ${collection}`,
          content,
          sha,
          branch,
        }),
      });

      if (!commit.ok) {
        const detail = await commit.text();
        return NextResponse.json(
          { error: `GitHub commit failed (${commit.status})`, detail, localSaved },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Published to live site! Changes committed to GitHub and live redeploy triggered (~1-2 mins).",
        localSaved: true,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Network error during GitHub commit: " + (err.message || String(err)), localSaved },
        { status: 502 }
      );
    }
  }

  // If local file was saved without GitHub credentials:
  if (localSaved) {
    return NextResponse.json({
      ok: true,
      message: "Saved locally! Preview changes immediately on your site.",
      localSaved: true,
      githubCommitted: false,
    });
  }

  return NextResponse.json(
    {
      error: "Publishing is not configured. Missing GITHUB_TOKEN or GITHUB_REPO.",
    },
    { status: 503 }
  );
}
