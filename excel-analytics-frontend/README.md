# Excel Analytics Platform - Frontend

A comprehensive web-based platform for Excel file analysis, interactive chart creation, and dashboard building with advanced analytics capabilities.

## 🚀 Features

### 📊 **Data Analysis & Visualization**
- **Excel File Upload**: Drag-and-drop interface for Excel file uploads
- **Multi-Sheet Support**: Handle Excel files with multiple worksheets
- **Interactive Charts**: Create bar, line, pie, scatter, area, and doughnut charts
- **3D Visualizations**: Custom 3D pie charts with interactive controls
- **Real-time Data Processing**: Instant data analysis and chart generation
- **Advanced Analytics**: Statistical analysis, correlation matrices, trend detection

### 🎨 **Chart Building System**
- **Chart Builder**: Intuitive interface for creating custom charts
- **Multiple Chart Types**: 2D and 3D chart support
- **Theme Customization**: Default, Neon, Pastel, and Monochrome themes
- **Interactive Controls**: Zoom, rotation, legend management
- **Export Options**: PNG, PDF, and CSV export capabilities
- **Responsive Design**: Charts adapt to different screen sizes

### 📈 **Dashboard Management**
- **Dashboard Creation**: Build custom dashboards with multiple charts
- **Chart Arrangement**: Drag-and-drop chart positioning
- **Dashboard Templates**: Pre-built templates for quick setup
- **Sharing & Collaboration**: Public and private dashboard settings
- **Real-time Updates**: Live data updates and chart refreshes

### 🔐 **User Management & Security**
- **Role-based Access**: User and Admin roles with different permissions
- **Authentication System**: JWT-based secure authentication
- **Password Management**: Secure password reset via email OTP
- **Session Management**: Automatic session timeout and activity tracking
- **Security Audit**: Comprehensive security monitoring and logging

### 👥 **Admin Features**
- **User Management**: Complete user administration interface
- **System Analytics**: Real-time system metrics and monitoring
- **Security Monitoring**: Access logs and threat detection
- **Performance Tracking**: User activity and system health monitoring

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS 4.1.4** - Utility-first CSS framework
- **Chart.js 4.4.9** - Professional charting library
- **React Router DOM 7.5.1** - Client-side routing
- **Framer Motion 12.9.4** - Animation library
- **Axios 1.8.4** - HTTP client
- **React Toastify 11.0.5** - Notification system

### Backend Integration
- **Node.js** - Server-side runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **JWT** - JSON Web Token authentication
- **Multer** - File upload handling

## 📁 Project Structure

```
excel-analytics-frontend/
├── src/
│   ├── Components/
│   │   ├── Admin/
│   │   │   ├── AdminDashboard.jsx          # Main admin interface
│   │   │   ├── EnhancedUsersManagement.jsx # User administration
│   │   │   ├── SecurityAudit.jsx          # Security monitoring
│   │   │   └── UsersManagement.jsx        # User management
│   │   ├── User/
│   │   │   ├── Dashboard.jsx              # Main user dashboard
│   │   │   ├── ChartBuilder.jsx           # Chart creation interface
│   │   │   ├── AdvancedChartRenderer.jsx  # Advanced chart rendering
│   │   │   ├── DynamicChart.jsx           # Dynamic chart component
│   │   │   ├── FileAnalyzer.jsx           # Data analysis interface
│   │   │   ├── ExcelUploader.jsx          # File upload component
│   │   │   ├── ExcelFileList.jsx          # File management
│   │   │   ├── DashboardList.jsx          # Dashboard overview
│   │   │   ├── DashboardView.jsx          # Dashboard display
│   │   │   ├── ChartManager.jsx           # Chart management
│   │   │   ├── AdvancedAnalytics.jsx      # Advanced analytics
│   │   │   ├── StatisticalAnalysis.jsx    # Statistical analysis
│   │   │   ├── CorrelationMatrix.jsx      # Correlation analysis
│   │   │   ├── ThreeDVisualizer.jsx       # 3D visualization
│   │   │   └── UserProfile.jsx            # User profile management
│   │   ├── Login.jsx                      # Authentication
│   │   ├── Register.jsx                   # User registration
│   │   ├── ForgotPassword.jsx             # Password recovery
│   │   ├── ResetPassword.jsx              # Password reset
│   │   ├── LoadingComponents.jsx          # Loading states
│   │   └── ErrorBoundary.jsx              # Error handling
│   ├── Context/
│   │   └── AuthContext.jsx                # Authentication context
│   ├── services/
│   │   └── chartApi.js                    # API service layer
│   ├── hooks/
│   │   └── useKeyboardShortcuts.jsx       # Keyboard shortcuts
│   ├── endpoint/
│   │   └── baseurl.jsx                    # API endpoint configuration
│   ├── assets/                            # Static assets
│   ├── App.jsx                            # Main application component
│   ├── main.jsx                           # Application entry point
│   └── ProtectedRoute.jsx                 # Route protection
├── public/                                # Public assets
├── package.json                           # Dependencies and scripts
└── vite.config.js                         # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Backend server running (see backend documentation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd excel-analytics-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Update API endpoints in `src/endpoint/baseurl.jsx`
   - Ensure backend server is running

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📖 Usage Guide

### 1. **User Registration & Authentication**
- Register with email and password
- Verify email address
- Login with credentials
- Reset password if needed

### 2. **Excel File Upload**
- Drag and drop Excel files to upload
- Select specific worksheets for analysis
- Preview data before processing
- Manage uploaded files

### 3. **Data Analysis**
- Analyze uploaded Excel files
- View statistical summaries
- Generate correlation matrices
- Identify trends and patterns

### 4. **Chart Creation**
- Select chart type (Bar, Line, Pie, etc.)
- Choose X and Y axis data
- Customize chart appearance
- Add legends and labels
- Preview charts in real-time

### 5. **Dashboard Building**
- Create new dashboards
- Add multiple charts
- Arrange chart layouts
- Save and share dashboards

### 6. **Advanced Features**
- 3D chart visualization
- Interactive chart controls
- Export charts and data
- Keyboard shortcuts for productivity

## 🎯 Key Features in Detail

### **Interactive Chart System**
- **Real-time Preview**: See chart changes instantly
- **Multiple Chart Types**: Support for 7+ chart types
- **3D Rendering**: Custom Canvas-based 3D pie charts
- **Theme System**: Multiple color themes and styles
- **Export Options**: Multiple format export capabilities

### **Data Management**
- **Large File Support**: Handle Excel files with thousands of rows
- **Pagination**: Efficient data loading and display
- **Real-time Processing**: Instant data analysis
- **Multi-sheet Support**: Work with complex Excel files

### **User Experience**
- **Responsive Design**: Works on all device sizes
- **Dark/Light Mode**: User preference support
- **Keyboard Shortcuts**: Productivity enhancements
- **Smooth Animations**: Professional UI transitions
- **Error Handling**: Comprehensive error recovery

### **Security Features**
- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: User and admin permissions
- **Session Management**: Automatic timeout handling
- **Input Validation**: Secure data processing
- **XSS Protection**: Cross-site scripting prevention

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USER_API_BASE_URL=http://localhost:3000/api/user
```

### API Endpoints
Update `src/endpoint/baseurl.jsx` with your backend URLs:

```javascript
export const BaseUrl = "http://localhost:3000/api/";
export const BaseUrluser = "http://localhost:3000/api/user/";
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Run Linting
```bash
npm run lint
```

## 📦 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

### v1.0.0 (Current)
- Complete Excel Analytics Platform
- Interactive chart system
- Dashboard management
- User authentication
- Admin panel
- 3D visualizations
- Advanced analytics
- Security features

## 🙏 Acknowledgments

- Chart.js team for the excellent charting library
- React team for the amazing framework
- Tailwind CSS for the utility-first styling
- All contributors and team members

---

**Built with ❤️ by Team 21**
