export default async function handler(req, res) {
  const query = `
    {
      wrappedDomains(where: { name_ends_with: ".emperor.club.agi.eth" }) {
        id   // This is the namehash hex which is the ERC-1155 token ID
      }
    }
  `;

  const response = await fetch(
    "https://api.studio.thegraph.com/query/62917/emperor-ens/v0.0.1",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) }
  );

  const { data } = await response.json();

  const ids = data.wrappedDomains.map((d) => BigInt(d.id).toString());

  res.setHeader("Content-Type", "text/plain");
  res.send(ids.join(","));
}
