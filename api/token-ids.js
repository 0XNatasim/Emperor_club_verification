import { request, gql } from 'graphql-request';
import { utils } from 'ethers';

// The Graph ENS subgraph endpoint
const ENS_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens';

// Parent domain node id for `emperor.club.agi.eth` (you already fetched this)
// If you want this function to be generic, you can accept a query param like ?parentId=0x...
const PARENT_ID = '0xc13876f4f3eb119eb10a538a0cd56e0f034bcce2eb37e73a5b0e09a81017c122';

const QUERY = gql`
  query getSubdomains($parentId: ID!) {
    domains(where: { parent: $parentId }, first: 1000) {
      name
    }
  }
`;

export default async function handler(req, res) {
  try {
    // Optional: allow overriding parentId through query string
    const parentId = (req.url && new URL(req.url, 'http://localhost').searchParams.get('parentId')) || PARENT_ID;

    // Query The Graph
    const data = await request(ENS_SUBGRAPH, QUERY, { parentId });

    if (!data || !data.domains) {
      return res.status(200).json([]);
    }

    // Convert each name to namehash hex then to decimal string
    const tokenIds = data.domains
      .map(d => d.name)
      .filter(Boolean)
      .map(name => {
        // ethers.utils.namehash returns a 0x-prefixed hex (32 bytes)
        const hex = utils.namehash(name);
        // BigInt accepts hex with 0x prefix
        const decimal = BigInt(hex).toString();
        return decimal;
      });

    // Remove duplicates just in case
    const unique = Array.from(new Set(tokenIds));

    // Cache headers (adjust as needed)
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    return res.status(200).json(unique);
  } catch (err) {
    console.error('Error fetching subdomains:', err);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'internal_error', message: String(err.message) });
  }
}
