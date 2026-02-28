export default function handler(req: any, res: any) {
  return res.status(404).json({ error: 'Route Not Found' });
}
