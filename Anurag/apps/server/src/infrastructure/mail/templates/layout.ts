export function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background: #f5f5f5; margin: 0; padding: 24px; }
    .container { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .expense-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .expense-table th, .expense-table td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    .expense-table th { font-size: 12px; color: #6b7280; font-weight: 600; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .muted { color: #6b7280; font-size: 14px; }
    .section { margin-top: 24px; }
    .section h2 { font-size: 16px; margin: 0 0 12px; }
    ul { padding-left: 20px; margin: 0; }
    li { margin-bottom: 8px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">Expense Tracker — automated financial summary</div>
  </div>
</body>
</html>`;
}
