# LACVAY 
**AI-Powered Transit & Tourism Guide for Batangas City**

LACVAY is a modern, premium mobile-first web application designed to solve the chaotic local transit experience in Batangas City. It combines mathematical graph-routing algorithms with Large Language Models (LLMs) to generate highly accurate, human-readable commute itineraries using local jeepney and tricycle networks.

##  Core Features
* **Hybrid Routing Engine:** Uses strict pathfinding algorithms (`itineraryPlanner.ts`) to calculate exact distances, fares, and transfers, then passes the structured data to an LLM (Groq/OpenAI) to generate conversational, easy-to-read directions.
* **Dual-Option Transportation:** Automatically detects medium-distance gaps and offers users "Walk or App" choices, seamlessly integrating with 3rd-party ride-hailing apps (Grab, Angkas, iDOL Taxi).
* **B2B Monetization Engine:** A built-in, secure Admin panel allowing local businesses to subscribe and publish edge-to-edge promotional ads directly into the traveler's homepage feed.
* **Interactive Map Explorer:** Built with React-Leaflet, featuring custom UI pins, auto-zooming autocomplete search, and dynamic Route Fare Matrix cards that appear when transit lines are clicked.
* **Supabase Powered:** Secure Authentication, Row-Level Security (RLS) for admin actions, and PostgreSQL geospatial database integration.

##  Tech Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS, React-Leaflet, Radix/Lucide Icons.
* **Backend:** Node.js, Express, Groq API (LLM generation).
* **Database & Auth:** Supabase (PostgreSQL), Row-Level Security (RLS).
* **Routing:** Custom Haversine/OSRM coordinate algorithms.

##  Quick Start (Portable Environment)
LACVAY is configured with a portable Node.js environment, allowing it to run on restricted PCs without requiring administrator privileges.

1. Clone the repository.
2. Run `lacvay-dev.bat`.
3. The script will automatically download a portable instance of Node.js, install dependencies, and start both the Vite Frontend (`http://localhost:5173`) and Express API (`http://localhost:3001`).

##  Security & Architecture Notes
* **Strict Source of Truth:** All data interactions strictly utilize Supabase PostgreSQL.
* **File Upload Sanitization:** All admin-uploaded media files are stripped of original metadata and assigned secure UUIDs before entering Supabase Storage.
* **Rate Limiting:** The backend implements queueing and failovers across multiple Groq models (Llama 3, Mixtral) to ensure high availability during peak LLM usage.

---
*Built for the commuters and travelers of Batangas City.*
