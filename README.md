# 📚 Story Nest – A Modern Full-Stack Blogging Platform

**Story Nest** is a modern full-stack blogging platform designed to provide a simple and engaging space for creating, publishing, exploring, and managing blog posts.

It combines a responsive React frontend with a Node.js and Express backend to deliver a smooth blogging experience.

## ✨ Features

- 📝 Create and publish blog posts.
- 📖 Explore and read published stories.
- 🎨 Clean and responsive user interface.
- ⚡ Fast frontend powered by React and Vite.
- 🔗 REST API integration with the backend.
- 🗄️ Backend architecture for managing blog data.
- 📱 Responsive design for different screen sizes.

## 🛠️ Tech Stack

### Frontend
- React.js
- JavaScript
- Vite
- CSS3
- HTML5

### Backend
- Node.js
- Express.js
- REST API
- MongoDB (if configured in the project)

### Development Tools
- Git & GitHub
- Visual Studio Code
- npm

## 📁 Project Structure

```text
Story_Nest/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── Post.js
│   │   ├── routes/
│   │   │   └── posts.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

## 🚀 Getting Started

Follow these steps to run Story Nest locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Krishna18-Kunal/Story_Nest.git
```

### 2. Navigate to the Project

```bash
cd Story_Nest
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Setup Backend

Open another terminal:

```bash
cd Story_Nest/backend
npm install
```

Configure the required environment variables using `.env.example` as a reference.

Start the backend using the script defined in `backend/package.json`, for example:

```bash
npm start
```

## ⚙️ Environment Configuration

Check the `.env.example` files in the frontend and backend directories.

Create the required `.env` files and configure the environment variables according to your local setup.

**Note:** Never commit secret keys, passwords, database credentials, or private environment files to GitHub.

## 🎯 Project Goal

The goal of Story Nest is to build an accessible and user-friendly blogging platform where users can share ideas, publish meaningful content, and explore stories through a modern web experience.

## 🔮 Future Improvements

- User authentication and authorization.
- Blog categories and search functionality.
- Like, comment, and bookmark features.
- User profile management.
- Rich text editor.
- Image uploads and cloud storage.

## 👨‍💻 Author

**Krishna Kunal**

- GitHub: [@Krishna18-Kunal](https://github.com/Krishna18-Kunal)
- LinkedIn: [Krishna Kunal](https://www.linkedin.com/in/krishna-kunal/)

## 📄 License

This project is intended for educational and personal development purposes.

---
