# AvatarLab - AI Avatar Platform

A comprehensive platform for creating, training, and deploying AI avatars with personality, memory, and knowledge capabilities.

## 🚀 Quick Start

**New to AvatarLab?** Start here: [QUICK_START.md](./QUICK_START.md)

## 📚 Documentation Index

### Setup & Deployment
- **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 10 minutes ⭐
- **[Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)** - Complete deployment guide
- **[Database Design](./docs/database-design.md)** - Schema architecture and design

### Chatbot & Training
- **[Fine-Tuning Setup Guide](./docs/FINE_TUNING_SETUP_GUIDE.md)** - Complete guide to fine-tuning your AI models
- **[Fine-Tuning Explained](./docs/FINE_TUNING_EXPLAINED.md)** - Understanding fine-tuning concepts
- **[Setup Fine-Tuning](./docs/SETUP_FINE_TUNING.md)** - Quick setup instructions
- **[Enhancing Fine-Tuned Models](./docs/ENHANCING_FINE_TUNED_MODELS.md)** - Tips for improving model performance
- **[Unified Training README](./docs/UNIFIED_TRAINING_README.md)** - Complete training system overview
- **[Get Avatar Prompt Guide](./docs/GET_AVATAR_PROMPT_GUIDE.md)** - Working with avatar prompts

### Integration & APIs
- **[API Keys Complete Guide](./docs/API_KEYS_COMPLETE.md)** - API key setup and management
- **[N8N Setup Complete Guide](./docs/N8N_SETUP_COMPLETE_GUIDE.md)** - Integrate with N8N workflows
- **[API Integration Guide](./docs/API_INTEGRATION_GUIDE.md)** - External API integration
- **[Complete N8N Integration Guide](./docs/COMPLETE_N8N_INTEGRATION_GUIDE.md)** - Comprehensive N8N setup

### Features & Capabilities
- **[AI Images Quick Start](./docs/AI_IMAGES_QUICK_START.md)** - AI image generation setup
- **[AI Images Setup Instructions](./docs/AI_IMAGES_SETUP_INSTRUCTIONS.md)** - Detailed image generation guide
- **[RAG Setup Guide](./docs/RAG_SETUP_GUIDE.md)** - Retrieval-Augmented Generation
- **[Voice Cloning Setup](./docs/VOICE_CLONING_SETUP.md)** - Voice cloning integration
- **[Nano Banana Setup](./docs/NANO_BANANA_SETUP.md)** - Nano Banana integration

### Advanced Topics
- **[Gallery Performance Optimization](./docs/GALLERY_PERFORMANCE_OPTIMIZATION.md)** - Optimize image galleries
- **[Chatbot Fine-Tuning Implementation](./docs/CHATBOT_FINE_TUNING_IMPLEMENTATION.md)** - Advanced fine-tuning
- **[Version Control Guide](./docs/VERSION_CONTROL_GUIDE.md)** - Git workflow and best practices

### Reference & Troubleshooting
- **[How It Works (Simple)](./docs/HOW_IT_WORKS_SIMPLE.md)** - System architecture overview
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Cost Warning](./docs/COST_WARNING.md)** - Important cost considerations

## 🗂️ Project Structure

```
AvatarLab/
├── src/                          # Source code
│   ├── components/              # React components
│   ├── services/                # Business logic & API services
│   └── lib/                     # Utilities and helpers
├── supabase/                    # Supabase configuration
│   ├── functions/               # Edge Functions
│   └── migrations/              # Database migrations
├── scripts/                     # SQL scripts and utilities
│   ├── *.sql                    # Database setup scripts
│   ├── install_supabase_cli.ps1
│   └── test-edge-function.html
├── docs/                        # Comprehensive documentation
│   ├── Setup & Deployment guides
│   ├── Fine-tuning documentation
│   ├── Integration guides (N8N, API)
│   ├── Feature guides (AI Images, RAG, Voice)
│   └── n8n-workflow-template.json
├── training_samples/            # Training data samples
├── public/                      # Static assets
├── QUICK_START.md              # Start here! ⭐
└── README.md                    # This file
```

## 📋 Setup SQL Scripts

Essential SQL files in `scripts/` folder:

- **[scripts/PASTE_THIS_IN_SUPABASE.sql](./scripts/PASTE_THIS_IN_SUPABASE.sql)** - Main database setup
- **[scripts/supabase_schema.sql](./scripts/supabase_schema.sql)** - Complete schema reference
- **[scripts/setup_storage_bucket.sql](./scripts/setup_storage_bucket.sql)** - Image storage setup
- **[scripts/setup_voice_storage_bucket.sql](./scripts/setup_voice_storage_bucket.sql)** - Voice storage setup

## 🛠️ Tech Stack

This project is built with:

- **Frontend:** React + TypeScript + Vite
- **UI:** shadcn-ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **AI:** OpenAI GPT-4o (with fine-tuning support)
- **Integrations:** N8N, WhatsApp, Voice Cloning

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key
- (Optional) N8N account for integrations

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd AvatarLab

# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Setup

1. Create a Supabase project
2. Run the SQL in [scripts/PASTE_THIS_IN_SUPABASE.sql](./scripts/PASTE_THIS_IN_SUPABASE.sql)
3. Configure environment variables in `.env`

See [QUICK_START.md](./QUICK_START.md) for detailed instructions.

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📖 Key Features

### 🤖 AI Avatars
Create AI avatars with unique personalities, knowledge bases, and conversation styles

### 🧠 Memory System
Avatars remember conversations and learn from interactions

### 📚 Knowledge Base (RAG)
Upload documents for avatars to reference in conversations

### 🎨 AI Image Generation
Generate and manage AI-generated images within conversations

### 🎯 Fine-Tuning
Train avatars on your specific conversation style and patterns

### 🔗 Integrations
Connect to WhatsApp, Telegram, Discord, and more via N8N

## 🤝 Contributing

This is a Lovable project. Changes can be made via:

1. **Lovable IDE:** [Project Link](https://lovable.dev/projects/b32f7ebb-1d6c-4626-a086-6b67cbc1ca02)
2. **Local Development:** Clone and push changes
3. **GitHub:** Edit files directly or use Codespaces

## 📝 License

See LICENSE file for details.

## 💬 Support

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review relevant documentation in this README
- Create an issue on GitHub

## 🎉 Acknowledgments

Built with [Lovable](https://lovable.dev) - The AI-powered web development platform

---

**Ready to build your AI avatar?** Start with the [Quick Start Guide](./QUICK_START.md)! 🚀
