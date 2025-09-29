# PGMCP - PostgreSQL Natural Language Query Tool

🐘 **Transform natural language questions into SQL queries using AI**

Ask your PostgreSQL database questions in plain English and get beautifully formatted results instantly.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

## ✨ Features

- 🤖 **Natural Language to SQL** - Ask questions in plain English
- 🛡️ **Read-Only Safety** - Automatic validation prevents data modification  
- 🚀 **Any PostgreSQL Provider** - Neon, Supabase, AWS RDS, local databases
- 🎨 **Beautiful CLI** - Formatted table output with colors
- ⚡ **Fast & Accurate** - Powered by Google Gemini 2.5 Flash
- 🔍 **Smart Schema Discovery** - Automatically understands your database structure
- 🔒 **Enterprise Ready** - Connection pooling, timeouts, comprehensive error handling

## 🎯 Example Usage

**Question:** *"Show me the top 3 customers by total order amount"*

**Generated SQL:**
SELECT u.name, u.email, SUM(o.amount) as total_amount
FROM app.users u
JOIN app.orders o ON u.id = o.user_id
GROUP BY u.name, u.email
ORDER BY total_amount DESC
LIMIT 3


**CLI Output:**
┌─────────────┬──────────────────┬──────────────┐
│ name │ email │ total_amount │
├─────────────┼──────────────────┼──────────────┤
│ John Doe │ john@example.com │ 2050.98 │
│ Jane Smith │ jane@example.com │ 1420.50 │
│ Bob Wilson │ bob@example.com │ 890.25 │
└─────────────┴──────────────────┴──────────────┘


## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **PostgreSQL database** (any provider)
- **Google Gemini API key** ([Get one free](https://ai.google.dev/))

### Installation
Clone the repository
git clone https://github.com/yourusername/pgmcp-typescript.git
cd pgmcp-typescript

Install dependencies
npm install

Copy environment template
cp .env.example .env

Edit .env with your database URL and API key
nano .env

Build the project
npm run build

Start the server
npm start


### Environment Setup

Edit `.env` file with your configuration:

Your PostgreSQL connection string
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

Your Gemini API key from https://ai.google.dev/
GEMINI_API_KEY=your_actual_api_key_here

Server port (optional)
PORT=8080


## 🎮 Usage

### REST API

**Start the server:**
npm run dev # Development mode
npm start # Production mode

**Ask natural language questions:**
curl -X POST http://localhost:8080/ask
-H "Content-Type: application/json"
-d '{"question": "What are my top selling products this month?"}'


**API Endpoints:**
- `POST /ask` - Natural language queries
- `POST /query` - Direct SQL execution (read-only)
- `GET /schema` - View database schema
- `GET /health` - Health check

### CLI Tool

**Build the CLI:**
npm run build:cli


**Ask questions naturally:**
Execute question and show results
./bin/pgmcp ask "Who are my most valuable customers?"

Generate SQL without executing (dry run)
./bin/pgmcp ask "Show recent orders" --dry-run

More examples
./bin/pgmcp ask "Average order value by month"
./bin/pgmcp ask "Products with low inventory"
./bin/pgmcp ask "Customer retention rate"



## 🏗️ Architecture

┌─────────────────┐ ┌──────────────┐ ┌─────────────┐
│ CLI Client │ │ REST API │ │ PostgreSQL │
│ │ │ │ │ Database │
│ Natural Language│───▶│ Schema │◀──▶│ │
│ Questions │ │ Discovery │ │ Tables │
│ │ │ │ │ Relations │
│ Formatted │◀───│ SQL │ │ Data │
│ Table Output │ │ Generation │ │ │
└─────────────────┘ │ │ └─────────────┘
│ Gemini AI │
│ Integration │ ┌─────────────┐
│ │ │ Google AI │
│ Safety │───▶│ Gemini 2.5 │
│ Validation │ │ Flash │
└──────────────┘ └─────────────┘


## 🛡️ Security & Safety

- **Read-Only Enforcement** - Automatically blocks INSERT, UPDATE, DELETE, DROP operations
- **SQL Injection Prevention** - Parameterized queries and input validation
- **Timeout Protection** - Configurable query timeouts prevent runaway queries
- **Schema Isolation** - Only accesses explicitly allowed schemas
- **Connection Pooling** - Secure, managed database connections
- **Error Handling** - Comprehensive error handling and logging

## 🗃️ Database Support

**Tested with:**
- ✅ **Neon** (Recommended)
- ✅ **Supabase**
- ✅ **AWS RDS PostgreSQL**
- ✅ **Google Cloud SQL**
- ✅ **Azure Database for PostgreSQL**
- ✅ **Local PostgreSQL**
- ✅ **Docker PostgreSQL**

**Connection Examples:**
Neon
DATABASE_URL=postgresql://user:pass@ep-xxx.c-2.us-east-1.aws.neon.tech/db?sslmode=require

Supabase
DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?sslmode=require

Local
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb


## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `GEMINI_API_KEY` | ✅ | - | Google Gemini API key |
| `GEMINI_MODEL` | ❌ | `gemini-2.5-flash` | AI model to use |
| `PORT` | ❌ | `8080` | Server port |
| `NODE_ENV` | ❌ | `development` | Environment mode |
| `QUERY_TIMEOUT` | ❌ | `30000` | Query timeout (ms) |

### Advanced Configuration
// src/utils/config.ts - Customize these settings
export const config = {
server: {
port: process.env.PORT || 8080,
corsOrigin: process.env.CORS_ORIGIN || '*'
},
database: {
max: 20, // Max connections
idleTimeoutMillis: 30000, // Idle timeout
connectionTimeoutMillis: 15000 // Connection timeout
},
query: {
timeout: 30000, // Query timeout
maxPageSize: 1000 // Max results per query
}
};


## 🚀 Deployment

### Docker

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./
EXPOSE 8080
CMD ["node", "server/main.js"]

undefined
Build and run
docker build -t pgmcp .
docker run -p 8080:8080 --env-file .env pgmcp


### Railway (One-Click Deploy)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### Manual Deployment

Build for production
npm run build

Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/server/main.js --name pgmcp

Or start directly
node dist/server/main.js


## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### Development Setup

Install dependencies
npm install

Start development server (auto-reload)
npm run dev

Run tests
npm test

Lint code
npm run lint

Format code
npm run format

## 📊 Roadmap

- [ ] **Multi-Database Support** (MySQL, SQLite, Oracle)
- [ ] **Data Visualization** (Charts and graphs)
- [ ] **Query History** (Save and replay queries)
- [ ] **Team Collaboration** (Shared queries, user management)
- [ ] **Advanced AI Models** (GPT-4, Claude support)
- [ ] **Real-time Updates** (WebSocket streaming)
- [ ] **Mobile App** (iOS/Android companion)

## 🐛 Troubleshooting

### Common Issues

**Connection errors:**
Check if your database URL is correct
npm run cli ask "SELECT 1" --dry-run

text

**API key issues:**
Verify your Gemini API key at https://ai.google.dev/
curl -H "Authorization: Bearer $GEMINI_API_KEY" https://generativelanguage.googleapis.com/v1/models

text

**Permission errors:**
Make CLI executable
chmod +x bin/pgmcp


## 📄 License

**MIT License** - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for powering natural language processing
- [PostgreSQL](https://postgresql.org/) for the amazing database engine
- [Node.js](https://nodejs.org/) and [TypeScript](https://typescriptlang.org/) communities
- All contributors and users who make this project better

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/pgmcp-typescript/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/pgmcp-typescript/discussions)
- 📧 **Email**: your-email@domain.com
- 💬 **Discord**: [Join our community](https://discord.gg/your-invite)

---

**⭐ Star this repository if you find it useful!**

**🔗 Share it with your team and help us grow the community!**
