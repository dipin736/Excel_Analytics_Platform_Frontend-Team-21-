# Excel Analytics Platform - Frontend

This is the frontend for the Excel Analytics Platform, a powerful tool for uploading, analyzing, and visualizing Excel data with interactive dashboards and advanced charting features.

## ✨ Features
- User authentication (JWT-based)
- Upload and manage Excel files
- Interactive dashboards with advanced chart types (2D, 3D, pie, doughnut, column, etc.)
- Download and save chart images
- Admin and user roles
- Responsive, modern UI with dark mode

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd excel-analytics-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🏗 Project Structure
```
excel-analytics-frontend/
├── public/                # Static assets
├── src/
│   ├── Components/        # React components (User/Admin, charts, auth, etc.)
│   ├── Context/           # React context (Auth)
│   ├── services/          # API service functions
│   ├── endpoint/          # API base URLs
│   ├── assets/            # Images and static assets
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── package.json           # Project dependencies
├── vite.config.js         # Vite config
└── README.md              # Project documentation
```

## 🧑‍💻 Usage
- Register or log in as a user or admin
- Upload Excel files and view them in your dashboard
- Analyze data and create interactive charts
- Download or save charts to your dashboard

## 🛠 Tech Stack
- React + Vite
- Tailwind CSS
- Chart.js and custom Canvas rendering
- Framer Motion (animations)

## 📄 License
MIT
