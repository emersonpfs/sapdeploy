# DeployMaster - Project Structure

```
deploy-master/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── models.py               # SQLAlchemy database models
│   ├── schemas.py              # Pydantic schemas for validation
│   ├── database.py             # Database configuration
│   ├── crud.py                 # CRUD operations
│   ├── deployment.py           # Deployment logic (SSH/WinRM)
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Layout.tsx
│   │   │   │   └── Header.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatCard.tsx
│   │   │   │   └── DeploymentChart.tsx
│   │   │   ├── applications/
│   │   │   │   ├── ApplicationList.tsx
│   │   │   │   └── ApplicationForm.tsx
│   │   │   ├── servers/
│   │   │   │   ├── ServerList.tsx
│   │   │   │   └── ServerForm.tsx
│   │   │   ├── deployments/
│   │   │   │   ├── DeploymentWizard.tsx
│   │   │   │   ├── LiveConsole.tsx
│   │   │   │   └── DeploymentHistory.tsx
│   │   │   └── ui/              # Shadcn/UI components
│   │   ├── lib/
│   │   │   ├── api.ts           # API client
│   │   │   └── utils.ts         # Utility functions
│   │   ├── hooks/
│   │   │   └── useDeployment.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── components.json          # Shadcn/UI config
└── README.md
```
