# RazorSense: Agentic AI Customer Support Engine 🚀

RazorSense is a next-generation, real-time Customer Support AI designed to dynamically handle complex payment issues, refunds, and logistics using a sophisticated Agentic Architecture.

## 🧠 The Architecture (How it Works)
Unlike traditional chatbots that rely on rigid decision trees, RazorSense is powered by an **Agentic AI Brain** (Google Gemini Flash) that has access to real-time backend tools.
1. **Dynamic Widgets:** The AI does not just output text. It triggers interactive React widgets (like Order Selectors, Ticket Details, and Advanced Search Panels) by injecting secure tags into its payload.
2. **Vector Database Policy Engine:** We integrated **ChromaDB** to handle hundreds of complex edge cases (e.g., "Melted Perishable Goods", "VIP Return Exceptions"). The AI queries this Vector DB mathematically to find the exact company policy *before* it replies, achieving 100% hallucination-free support.
3. **Computer Vision Fraud Detection:** The AI natively analyzes uploaded photos of "damaged goods" to verify if the damage is real, if it matches the SKU, and if it qualifies for a refund.

## 🔄 The Journey: Pivots & Experiments

Building an autonomous enterprise agent from scratch required several major pivots and intense experimentation:

### Pivot 1: Static Tables vs. Dynamic UI
Originally, the AI displayed orders and tickets using standard Markdown tables. We quickly realized this felt exactly like a legacy "bot". We pivoted the architecture entirely so the AI now injects invisible tags (e.g., `[ORDER_WIDGET: 123]`). The React frontend intercepts these tags and renders beautiful, interactive dashboard components seamlessly in the chat.

### Pivot 2: Escaping the "Hallucination" Trap
When testing highly specific scenarios (e.g., a user reporting a UPI Payment Failure without having an Order ID), the AI would occasionally jump the gun and invent non-existent policies or hallucinate dummy ticket numbers. We fixed this by:
- Writing a strict **Numbered SOP (Standard Operating Procedure)** into the system prompt to force the AI to interview the user for their UPI details step-by-step.
- Offloading 34+ heavy policies out of the system prompt and into a semantic **Vector Database**. Now the AI grounds its logic in the exact retrieved document.

### Pivot 3: The "Empty Database" Portfolio Problem
When preparing this repository for public release, we realized that anyone cloning it wouldn't have any database records. When they tested the app, the AI would fail its lookups and the demo would look broken. We engineered an **Auto-Seeding Demo Mode** inside `enterprise_api.py`. When the server boots, if the database is empty, it automatically generates the schema and injects a hyper-realistic dataset of dummy Swiggy, Amazon, and Flipkart orders!

## ⚠️ Errors We Faced & Overcame

- **The Free-Tier API Bottleneck (503 & 429 Errors):**
  While running on the Google Gemini Free Tier for development, we frequently hit `429 Quota Exceeded` limits (max 20 requests/day on the heavy models) and `503 High Demand` spikes, causing the app to hang for 30 seconds.
  **The Fix:** We engineered an intelligent **Waterfall Fallback Architecture**. The engine attempts to use the heavy `gemini-3.6-flash`. If it detects a Google server overload, it instantly falls back to `gemini-3.5-flash`, and finally to `gemini-3.5-flash-lite`. This guarantees that the UI *never* crashes for the end user, prioritizing uptime over sheer cognitive depth during outages.
- **Git Pollution:**
  Accidentally tracking hidden SQLite databases and `__pycache__` files. Solved by writing strict `.gitignore` rules and permanently purging the cache from the Git history to keep the repo enterprise-clean.

## 🔒 Security & Deployment
- **API Keys are strictly excluded** from this repository. The `.env` file containing the Gemini keys has been strictly added to `.gitignore`.
- Production deployment is designed for **Google Cloud Vertex AI** (to utilize provisioned, dedicated GPU throughput, which allows us to safely remove the Waterfall Fallback logic).
