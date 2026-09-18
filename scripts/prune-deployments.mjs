// Deletes old Vercel deployments, keeping only the N most recent, so
// "Deployment Storage" doesn't grow unbounded from every push redeploying
// (Hobby plan has no retention-policy setting). Run manually or via the
// weekly prune-deployments GitHub Action.
const TEAM_ID = "team_63MwPWJ8SYkeVXUFoR13svdU";
const PROJECT_ID = "prj_nSHj0qzTYN9hBQ4g4vo1B6eK7XUn";
const KEEP = Number(process.env.KEEP || 5);

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("Missing VERCEL_TOKEN env var (create one at vercel.com/account/tokens).");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}` };

async function listDeployments() {
  const url = `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=100`;
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

const deployments = await listDeployments();
const stale = deployments.slice(KEEP);

if (!stale.length) {
  console.log(`${deployments.length} deployment(s), nothing older than the ${KEEP} kept.`);
  process.exit(0);
}

console.log(`Keeping ${Math.min(KEEP, deployments.length)} of ${deployments.length}, deleting ${stale.length}.`);
for (const d of stale) {
  await deleteDeployment(d.uid);
  console.log(`deleted ${d.url}`);
}
