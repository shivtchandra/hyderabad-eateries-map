// Deletes old Vercel deployments across every project in the team, keeping
// only the N most recent per project, so "Deployment Storage" / "Functions
// Storage" don't grow unbounded from every push redeploying (Hobby plan has
// no retention-policy setting, and this account runs ~25 projects that all
// redeploy on every commit). Run manually or via the weekly
// prune-deployments GitHub Action.
const TEAM_ID = "team_63MwPWJ8SYkeVXUFoR13svdU";
const KEEP = Number(process.env.KEEP || 5);

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("Missing VERCEL_TOKEN env var (create one at vercel.com/account/tokens).");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}` };

async function listProjects() {
  const projects = [];
  let next;
  do {
    const url = new URL("https://api.vercel.com/v9/projects");
    url.searchParams.set("teamId", TEAM_ID);
    url.searchParams.set("limit", "100");
    if (next) url.searchParams.set("until", next);
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`list projects failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    projects.push(...data.projects);
    next = data.pagination?.next;
  } while (next);
  return projects;
}

async function listDeployments(projectId) {
  const url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${TEAM_ID}&limit=100`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`list failed: ${res.status} ${await res.text()}`);
  const { deployments } = await res.json();
  return deployments.sort((a, b) => b.createdAt - a.createdAt);
}

async function deleteDeployment(uid) {
  const url = `https://api.vercel.com/v13/deployments/${uid}?teamId=${TEAM_ID}`;
  const res = await fetch(url, { method: "DELETE", headers });
  if (!res.ok) throw new Error(`delete ${uid} failed: ${res.status} ${await res.text()}`);
}

const projects = await listProjects();
console.log(`${projects.length} project(s) in team.`);

let totalDeleted = 0;
for (const project of projects) {
  const deployments = await listDeployments(project.id);
  const stale = deployments.slice(KEEP);
  if (!stale.length) continue;
  console.log(`${project.name}: keeping ${Math.min(KEEP, deployments.length)} of ${deployments.length}, deleting ${stale.length}.`);
  for (const d of stale) {
    await deleteDeployment(d.uid);
    totalDeleted++;
  }
}

console.log(`Done. Deleted ${totalDeleted} deployment(s) across ${projects.length} project(s).`);
