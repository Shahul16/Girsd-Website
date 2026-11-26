import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getUserFromRequest } from "@/lib/server/supabase-admin";
import { getSiteContent } from "@/lib/server/site-content";
import type { Event } from "@/lib/data/events";
import type { JobOpening } from "@/lib/data/careers";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Please sign in to view your submissions." }, { status: 401 });
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Submissions are temporarily unavailable." }, { status: 503 });

  const [abstracts, applications] = await Promise.all([
    admin.from("abstract_submissions").select("id, event_slug, event_title, title, track, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    admin.from("job_applications").select("id, job_id, job_title, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  if (abstracts.error || applications.error) {
    console.error("Could not load member submissions:", abstracts.error ?? applications.error);
    return NextResponse.json({ error: "Could not load your submissions." }, { status: 503 });
  }
  return NextResponse.json({ abstracts: abstracts.data ?? [], applications: applications.data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Please sign in to submit an application." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || !["abstract", "job"].includes(body.type)) {
    return NextResponse.json({ error: "Choose an abstract or job application submission." }, { status: 400 });
  }
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Submissions are temporarily unavailable." }, { status: 503 });

  if (body.type === "abstract") {
    const title = String(body.title ?? "").trim();
    const abstract = String(body.abstract ?? "").trim();
    const track = String(body.track ?? "").trim();
    const eventSlug = String(body.eventSlug ?? "");
    const wordCount = abstract.split(/\s+/).filter(Boolean).length;
    if (title.length < 3 || title.length > 200 || !abstract || wordCount > 300) {
      return NextResponse.json({ error: "Enter a paper title and an abstract of no more than 300 words." }, { status: 400 });
    }
    const eventContent = await getSiteContent("events");
    const currentEvents = Array.isArray(eventContent) ? eventContent as Event[] : [];
    const event = currentEvents.find((item) => item.slug === eventSlug);
    if (!event || event.category !== "Research Conferences") {
      return NextResponse.json({ error: "This conference is not accepting abstract submissions here." }, { status: 400 });
    }
    const { data, error } = await admin.from("abstract_submissions").insert({
      user_id: user.id,
      event_slug: event.slug,
      event_title: event.title,
      title,
      track: track.slice(0, 120) || null,
      abstract,
    }).select("id, status, created_at").single();
    if (error) {
      console.error("Could not save abstract submission:", error);
      return NextResponse.json({ error: "Could not submit your abstract. Please try again." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, submission: data });
  }

  const jobId = String(body.jobId ?? "");
  const careerContent = await getSiteContent("careers");
  const currentJobs = Array.isArray(careerContent) ? careerContent as JobOpening[] : [];
  const job = currentJobs.find((item) => item.id === jobId);
  if (!job) return NextResponse.json({ error: "This position is no longer available." }, { status: 404 });

  const { data: profile, error: profileError } = await admin
    .from("member_profiles")
    .select("profile")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Could not load applicant profile:", profileError);
    return NextResponse.json({ error: "Could not verify your profile." }, { status: 503 });
  }
  const cvPath = profile?.profile?.cv?.path;
  if (typeof cvPath !== "string" || !cvPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Upload a CV to your profile before applying." }, { status: 400 });
  }

  const { data, error } = await admin.from("job_applications").insert({
    user_id: user.id,
    job_id: job.id,
    job_title: job.title,
    profile_snapshot: profile?.profile ?? {},
    cv_path: cvPath,
  }).select("id, status, created_at").single();
  if (error) {
    console.error("Could not save job application:", error);
    return NextResponse.json({ error: "Could not submit your application. Please try again." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, application: data });
}
