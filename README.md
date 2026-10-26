# FunnyShop - E-Commerce Application

Full-stack e-commerce application built with Spring Boot (backend), React (frontend), and MySQL (database).

## Tech Stack

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 17+
- **Database**: MySQL 8.0
- **Security**: Spring Security + JWT
- **ORM**: Spring Data JPA
- **AI Integration**: Spring AI (optional)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Web Server**: Nginx

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions

## Project Structure

```
Thuc_Tap_Ki_IV/
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI workflow
├── backend/                         # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/funnyshop/
│   │   │   │   ├── config/          # Security, CORS, JWT Config
│   │   │   │   ├── controller/      # REST API Controllers
│   │   │   │   ├── dto/             # Request / Response DTOs
│   │   │   │   ├── entity/          # JPA Entities
│   │   │   │   ├── exception/       # Global Exception Handler
│   │   │   │   ├── repository/      # Spring Data JPA Repositories
│   │   │   │   ├── service/         # Business Logic Services
│   │   │   │   └── FunnyShopApp.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── application-dev.yml
│   │   └── test/                    # Unit & Integration Tests
│   ├── build.gradle
│   ├── Dockerfile
│   └── .gitignore
├── frontend/                        # React application
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .gitignore
├── database/
│   ├── schema.sql                   # Database schema
│   └── data.sql                     # Sample data
├── docs/
│   ├── SRS.md                       # Software Requirements Specification
│   └── ERD_Diagram.png              # Entity Relationship Diagram
├── .gitignore
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Git

### Running the Application

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Thuc_Tap_Ki_IV
   ```

2. **Start all services using Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8080
   - MySQL: localhost:3306

4. **Stop the services**
   ```bash
   docker-compose down
   ```

5. **View logs**
   ```bash
   docker-compose logs -f
   ```

### Manual Setup (Without Docker)

#### Backend Setup
1. Navigate to backend directory
   ```bash
   cd backend
   ```

2. Configure database in `src/main/resources/application.yml`

3. Build and run
   ```bash
   ./gradlew build
   ./gradlew bootRun
   ```

#### Frontend Setup
1. Navigate to frontend directory
   ```bash
   cd frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start development server
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following main tables:
- **users**: User accounts and authentication
- **categories**: Product categories
- **products**: Product catalog
- **orders**: Customer orders
- **order_items**: Items within orders
- **cart**: Shopping cart functionality

See `database/schema.sql` for complete schema definition.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/{id}` - Update product (admin)
- `DELETE /api/products/{id}` - Delete product (admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/{id}` - Get order details

## Development

### Running Tests
- Backend: `./gradlew test`
- Frontend: `npm test`

### Code Style
- Backend: Follow Java coding conventions
- Frontend: Follow ESLint rules

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
