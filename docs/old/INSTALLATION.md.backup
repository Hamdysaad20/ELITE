# 🎯 Installation Guide (no database required)

This project runs out of the box using a JSON file database. Follow these steps on Windows PowerShell.

## 1) Install dependencies
```powershell
npm install
```

## 2) (Optional) Configure Odoo
Create `.env.local` in the project root if you want to enable Odoo endpoints:

```dotenv
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user@example.com
ODOO_API_KEY=your_api_key
```

You can omit this file if you’re not using Odoo.

## 3) Start the development server
```powershell
npm run dev
```

Open http://localhost:3000

## 4) Test the API
```powershell
# Menu
curl http://localhost:3000/api/menu

# Cart (uses x-user-id header; defaults to demo-user)
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"
```

## Commands
```powershell
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Typecheck + ESLint
npm run format    # Biome format
npm run db:reset  # Reset JSON database (data/database.json)
```

## JSON database

- File location: `data/database.json`
- Managed by: `src/server/utils/jsonDatabase.ts`
- Resets with: `npm run db:reset`

## Troubleshooting

Port 3000 in use
```powershell
npm run dev -- -p 3001
```

Modules not found or type errors
```powershell
Remove-Item -Recurse -Force node_modules, .next; npm install
```

Odoo auth errors
- Verify `.env.local` values
- Prefer API key over password

---

You’re ready to develop. No SQL database required. ☕🚀
