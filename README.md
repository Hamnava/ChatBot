# 🤖 AI Code Assistant

A modern AI-powered code assistant built with **ASP.NET Core 9** and **OpenAI API**. Get instant code suggestions, explanations, and live previews for HTML, CSS, React, Vue, Tailwind, and Bootstrap code.

![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?style=for-the-badge&logo=openai&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 📸 Screenshots

<div align="center">

### Main Interface
![Main Interface](screenshots/main-interface.png)

### Code Response with Syntax Highlighting
![Code Highlighting](screenshots/code-highlighting.png)

### Live Preview Modal
![Preview Modal](screenshots/preview-modal.png)

</div>

---

## ✨ Features

### 🎨 Smart Code Highlighting
- Automatic syntax highlighting using **Prism.js**
- Support for 15+ programming languages
- Beautiful dark theme code blocks
- One-click copy to clipboard

### 🔍 Technology Detection
Automatically detects and displays badges for:
| Frontend | Backend | CSS Frameworks |
|----------|---------|----------------|
| React/JSX | C# / .NET | Tailwind CSS |
| Vue.js | Python | Bootstrap |
| Next.js | Node.js | Custom CSS |
| Angular | SQL | |
| TypeScript | | |

### 👁️ Live Code Preview
- **HTML/CSS**: Direct preview in iframe
- **Tailwind CSS**: Auto-injects Tailwind CDN
- **Bootstrap**: Auto-injects Bootstrap 5 CDN
- **React**: Transpiles JSX using Babel
- **Vue.js**: Uses Vue 3 CDN for preview

### 📝 Markdown Formatting
- Headers (H1-H4)
- **Bold** and *italic* text
- `Inline code` formatting
- Bullet and numbered lists
- Code blocks with language detection

### 🚫 Smart Preview Handling
For non-previewable code (C#, Python, Next.js, etc.), displays helpful suggestions:
- IDE recommendations
- Setup instructions
- Framework-specific guidance

---

## 🛠️ Technologies Used

| Category | Technology |
|----------|------------|
| **Backend** | ASP.NET Core 9, C# |
| **AI Integration** | OpenAI API (GPT-4 / GPT-3.5) |
| **Frontend** | HTML5, CSS3, JavaScript |
| **UI Framework** | Bootstrap 5.3 |
| **Icons** | Bootstrap Icons |
| **Syntax Highlighting** | Prism.js |
| **Code Preview** | Babel (React), Vue 3 CDN |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Visual Studio 2022](https://visualstudio.microsoft.com/) (v17.8+) or [VS Code](https://code.visualstudio.com/)
- [OpenAI API Key](https://platform.openai.com/api-keys)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-code-assistant.git
cd ai-code-assistant
