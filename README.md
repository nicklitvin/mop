### Setup

1. **Install Prerequisites**:
   - Install [Node.js](https://nodejs.org/).

2. **Update Environment Variables**:
   - Before running the setup script, update the following values in the `setup.sh` script:
     - Replace `<your_openai_api_key>` with your OpenAI API key.

3. **Run the Setup Script**:
   - Execute the `setup.sh` script to automate the setup process:
     ```bash
     ./setup.sh
     ```

4. **Start the Server**:
   - Navigate to the `/server` directory and run:
     - On Linux:
       ```bash
       npm start -- -b
       ```
     - On Windows:
       ```bash
       npm start -- -- -b
       ```

5. **Access the Application**:
   - Open your browser and navigate to `http://localhost`.

### Manual Setup (Optional)

If you prefer to set up the project manually, follow these steps:

1. **Install Dependencies**:
   - Navigate to the `/web` directory and run:
     ```bash
     npm install
     ```
   - Navigate to the `/server` directory and run:
     ```bash
     npm install
     ```

2. **Configure Environment Variables**:
   - In the `/server` directory, create a `.env` file with the following content:
     ```
     DATABASE_URL=file:./dev.db?socket_timeout=10
     LISTEN_PORT=3000
     GPT_API_KEY=<your_openai_api_key>
     WEB_IP=http://localhost
     ```
   - In the `/web` directory, create a `.env` file with the following content:
     ```
     VITE_API_URL="http://localhost:80/api"
     ```

3. **Run Database Migrations**:
   - In the `/server` directory, run:
     ```bash
     npm run db
     ```

4. **Build the Web Application**:
   - In the `/web` directory, run:
     ```bash
     npm run build
     ```

5. **Start the Server**:
   - Navigate to the `/server` directory and run:
     - On Linux:
       ```bash
       npm start -- -b
       ```
     - On Windows:
       ```bash
       npm start -- -- -b
       ```

6. **Access the Application**:
   - Open your browser and navigate to `http://localhost`.

