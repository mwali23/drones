# Drone Community Marketplace

A specialized marketplace platform for the drone community to connect, buy and sell drone-related services. Features a minimal design with ratings and review options for verified purchases - think Yelp for drone services.

## Features

- **User Authentication**: Secure registration and login system
- **Service Listings**: Buy and sell drone-related services
- **Categories**: 
  - Development (Custom software & apps)
  - Parts (Components & replacement parts)
  - Services (Repair, setup & consulting)
  - Merchandise (Apparel & accessories)
- **Rating & Reviews**: Rate and review services with verified purchase badges
- **Search & Filter**: Find services by keyword or category
- **User Profiles**: Manage your services and view your listings
- **Minimal Design**: Clean, straightforward interface focused on usability

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/mwali23/drones.git
cd drones
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` file and update the JWT_SECRET for production use

5. Start the server:
```bash
npm start
```

6. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### For Buyers
1. Browse services on the home page
2. Use the search bar to find specific services
3. Filter by category (Development, Parts, Services, Merchandise)
4. Click on a service to view details and reviews
5. Login to leave reviews and ratings

### For Sellers
1. Register an account or login
2. Navigate to "My Profile"
3. Add new services with title, description, category, and price
4. Manage your service listings
5. View ratings and reviews on your services

### Ratings & Reviews
- Only logged-in users can leave reviews
- Each user can review a service once
- Reviews include a 1-5 star rating and optional comment
- Reviews are marked as "Verified" (simplified for this version)

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: JWT (JSON Web Tokens) and bcrypt
- **Data Storage**: JSON file-based database (simple and portable)
- **Session Management**: express-session

## Project Structure

```
drones/
├── server.js           # Main server file with API routes
├── package.json        # Project dependencies and scripts
├── .env.example        # Environment variables template
├── public/             # Static files
│   ├── css/
│   │   └── styles.css  # Application styles
│   └── js/
│       └── app.js      # Frontend JavaScript
├── views/
│   └── index.html      # Main HTML page
├── data/               # JSON database files (created on first run)
│   ├── users.json
│   ├── services.json
│   └── reviews.json
└── README.md           # This file
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/user` - Get current user info

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get single service with reviews
- `POST /api/services` - Create new service (authenticated)
- `PUT /api/services/:id` - Update service (authenticated)
- `DELETE /api/services/:id` - Delete service (authenticated)

### Reviews
- `GET /api/services/:id/reviews` - Get reviews for a service
- `POST /api/services/:id/reviews` - Add review (authenticated)

### Search
- `GET /api/search?q=query&category=cat` - Search services

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Session management
- Input validation
- Protected API routes for authenticated operations

### Security Considerations for Production

**Important:** This is a development/demonstration version. Before deploying to production, implement:

- **Rate Limiting**: Add rate limiting middleware (e.g., `express-rate-limit`) to prevent DoS attacks on authentication and resource-intensive endpoints
- **HTTPS/SSL**: Enable secure cookies by setting `cookie: { secure: true }` in session configuration and deploy behind HTTPS
- **CSRF Protection**: Implement CSRF token validation using packages like `csurf` to protect against cross-site request forgery
- **Input Sanitization**: Add additional input validation and sanitization for all user inputs
- **Secure Headers**: Use `helmet` middleware to set security-related HTTP headers
- **Environment Variables**: Never commit `.env` file with production secrets

## Future Enhancements

- Payment processing integration
- Real-time messaging between buyers and sellers
- Advanced search with filters (price range, ratings)
- User verification system
- File upload for service images
- Email notifications
- Database migration to PostgreSQL/MongoDB
- Admin panel for moderation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue on the GitHub repository.
