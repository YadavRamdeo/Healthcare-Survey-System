# Healthcare Survey System

A comprehensive healthcare survey management platform built with Django REST Framework and React. This system enables healthcare providers to create, distribute, and analyze patient surveys with advanced analytics and role-based access control.

## Features

### Core Functionality
- **User Management**: Role-based access (Admin, Healthcare Provider, Patient, Researcher)
- **Survey Builder**: Drag-and-drop survey creation with multiple question types
- **Response Collection**: Secure and anonymous response collection
- **Analytics Dashboard**: Real-time analytics and reporting
- **Data Export**: Export responses in multiple formats

### Question Types Supported
- Text Input (short and long)
- Single Choice (Radio buttons)
- Multiple Choice (Checkboxes)
- Dropdown selections
- Rating scales
- Date inputs
- Number inputs
- Yes/No questions

### Advanced Features
- Conditional logic for questions
- Survey templates and duplication
- Response validation
- Real-time analytics
- Mobile-responsive design
- HIPAA-compliant data handling

## Technology Stack

### Backend
- **Django 4.2**: Web framework
- **Django REST Framework**: API development
- **SQLite/PostgreSQL**: Database
- **Django CORS Headers**: Cross-origin requests
- **Token Authentication**: Secure API access

### Frontend
- **React 18**: User interface
- **React Router**: Navigation
- **Axios**: HTTP client
- **Chart.js**: Data visualization
- **React Hook Form**: Form management
- **Lucide React**: Icons

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Database setup**
   ```bash
   python manage.py makemigrations users
   python manage.py makemigrations surveys
   python manage.py migrate
   ```

4. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

5. **Run development server**
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000/`

## API Documentation

### Authentication Endpoints
```
POST /api/users/login/          # User login
POST /api/users/register/       # User registration
POST /api/users/logout/         # User logout
GET  /api/users/profile/        # Get user profile
PUT  /api/users/profile/update/ # Update user profile
```

### Survey Management
```
GET    /api/surveys/              # List surveys
POST   /api/surveys/              # Create survey
GET    /api/surveys/{id}/         # Get survey details
PUT    /api/surveys/{id}/         # Update survey
DELETE /api/surveys/{id}/         # Delete survey
POST   /api/surveys/{id}/duplicate/ # Duplicate survey
```

### Question Management
```
GET    /api/surveys/{id}/questions/      # List questions
POST   /api/surveys/{id}/questions/      # Create question
POST   /api/surveys/{id}/questions/bulk/ # Bulk create questions
PUT    /api/surveys/questions/{id}/      # Update question
DELETE /api/surveys/questions/{id}/      # Delete question
```

### Response Management
```
GET  /api/surveys/responses/           # List responses
POST /api/surveys/responses/           # Create response
GET  /api/surveys/{id}/responses/      # List survey responses
GET  /api/surveys/responses/{id}/      # Get response details
```

### Analytics
```
GET /api/surveys/{id}/analytics/  # Get survey analytics
GET /api/surveys/dashboard/stats/ # Get dashboard statistics
```

## User Roles

### Administrator
- Full system access
- User management
- System configuration
- All survey operations

### Healthcare Provider
- Create and manage surveys
- View assigned patient responses
- Access analytics for their surveys
- Manage their department's surveys

### Researcher
- Create research surveys
- Access aggregated analytics
- Export anonymized data
- Collaborate with healthcare providers

### Patient
- Complete assigned surveys
- View their response history
- Access survey results (if permitted)
- Update profile information

## Database Schema

### Key Models

**User Model**
- Extended Django User with healthcare-specific fields
- Role-based permissions
- Department and specialization tracking

**Survey Model**
- Survey metadata and configuration
- Targeting rules and permissions
- Status management (draft, active, archived)

**Question Model**
- Flexible question types
- Conditional logic support
- Validation rules

**Response Models**
- Survey responses and individual answers
- Metadata tracking (completion time, IP, etc.)
- Anonymous response support

## Security Features

- **Authentication**: Token-based authentication
- **Authorization**: Role-based access control
- **Data Protection**: HIPAA-compliant data handling
- **CORS**: Configured for secure cross-origin requests
- **Input Validation**: Comprehensive form validation
- **SQL Injection Protection**: Django ORM protection

## Deployment

### Production Configuration

1. **Environment Variables**
   ```bash
   # Backend (.env)
   SECRET_KEY=your-secret-key
   DEBUG=False
   DATABASE_URL=postgresql://user:pass@localhost/dbname
   ALLOWED_HOSTS=yourdomain.com
   
   # Frontend (.env)
   REACT_APP_API_URL=https://api.yourdomain.com
   ```

2. **Database Migration**
   ```bash
   python manage.py migrate
   python manage.py collectstatic
   ```

3. **Build Frontend**
   ```bash
   npm run build
   ```

### Docker Deployment

```dockerfile
# Backend Dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "healthcare_survey.wsgi"]

# Frontend Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
```

## Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

## Roadmap

### Upcoming Features
- [ ] Email notifications and reminders
- [ ] Advanced survey templates
- [ ] Integration with EHR systems
- [ ] Mobile app development
- [ ] Advanced analytics and ML insights
- [ ] Multi-language support
- [ ] Offline survey completion

### Version History
- **v1.0.0**: Initial release with core features
- **v1.1.0**: Enhanced analytics and reporting
- **v1.2.0**: Mobile responsiveness improvements
- **v2.0.0**: Advanced question types and conditional logic
