export default function handler(req: any, res: any) {
  return res.status(404).json({ success: false, error: 'Not found' });
}
