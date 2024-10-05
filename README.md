# Invoice Earnings Calculator XX

## Description
This project is an Invoice Earnings Calculator designed to help manage and track invoices, calculate referral bonuses, and provide quarterly summaries. It's built with a Node.js backend using Express and SQLite, and a frontend using HTML, CSS, and JavaScript.

## Features
- User authentication system
- Invoice management (create, read, update, delete)
- Automatic calculation of referral bonuses
- Quarterly summary reports
- Password change functionality

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/invoice-earnings-calculator.git
   ```
2. Navigate to the project directory:
   ```
   cd invoice-earnings-calculator
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
1. Start the server:
   ```
   node server.js
   ```
2. Open a web browser and navigate to `http://localhost:3000`
3. Log in with one of the default user accounts:
   - Username: AdvokatiCHZ, MKMs, or Contax
   - Initial password: default123

## Development
- The `server.js` file contains the backend logic and API endpoints.
- The `app.js` file contains the frontend JavaScript code.
- The `login.html` and `index.html` files contain the HTML structure.
- The `styles.css` file contains the CSS styles.

## Automated Releases
This project uses a custom release script (`release.sh`) to automate the release process. The script:
- Automatically increments the version number
- Generates a changelog
- Creates a new Git tag
- Pushes changes to GitHub

To create a new release, run:
```
./release.sh
```

## Contributing
1. Fork the repository
2. Create a new branch: `git checkout -b feature-branch-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-branch-name`
5. Create a pull request

## License
This project is licensed under the MIT License.
