# Deployment Guide: tylerlammey.com

This guide explains how to deploy your personal portfolio website (React frontend and FastAPI backend) to a production server, connect your custom domain `tylerlammey.com`, set up environment variables securely, and manage costs.

---

## 1. Readiness Assessment

Is the website ready for deployment? **Yes, the codebase is structurally ready.**
- **No Database Dependency:** The backend uses OpenAI and Pushover notifications to record user submissions rather than a database (e.g., PostgreSQL). This makes deployment significantly easier and cheaper.
- **Environment Variables:** The backend reads keys (`OPENAI_API_KEY`, `PUSHOVER_USER`, `PUSHOVER_TOKEN`) from the environment, and the frontend resolves the backend URL dynamically using `import.meta.env.VITE_API_URL`.
- **CORS Configured:** The FastAPI backend is configured with CORS middleware, which is required when serving frontend and backend from different origins.

---

## 2. Deployment Architecture Options

There are two primary ways to deploy your website. 

### Option A: Separate Hosting (Highly Recommended)
Deploy the React frontend as static files to a specialized CDN, and deploy the Python backend to a cloud application platform.

*   **Frontend Host:** Vercel, Netlify, or Cloudflare Pages.
*   **Backend Host:** Render, Railway, or Fly.io.
*   **How it works:**
    *   Vercel compiles your frontend code into static HTML/CSS/JS and serves it globally with extreme speed.
    *   Render/Railway runs your Python app in a virtual container and exposes a public URL (e.g., `https://backend.onrender.com`).
    *   Your domain `tylerlammey.com` points to the frontend host, and a subdomain like `api.tylerlammey.com` points to the backend host.
*   **Pros:** Very easy to configure, automatic Git-based deploys (pushes to `main` deploy instantly), high performance, and generous free/low-cost tiers.
*   **Cons:** Backend "free" tiers (like Render's Free Web Service) will "sleep" after 15 minutes of inactivity. The first user to visit the site after a sleep will experience a 50-second delay for the AI assistant to respond ("cold start").

### Option B: Single Virtual Private Server (VPS)
Deploy both the frontend and backend on a single virtual server (e.g., a DigitalOcean Droplet, Linode, or Hetzner VPS).

*   **Host:** DigitalOcean, Linode, Hetzner, or AWS LightSail.
*   **How it works:**
    *   You rent a basic Linux server (Ubuntu).
    *   You configure **Nginx** (a web server) to run on the VPS.
    *   Nginx is configured to serve your React frontend files directly when someone visits `tylerlammey.com`.
    *   Nginx is also configured as a "reverse proxy" to forward any request to `tylerlammey.com/api` directly to your FastAPI backend running in the background on port `8000`.
*   **Pros:**
    *   No backend "cold starts" (always active).
    *   Single domain setup (`tylerlammey.com` hosts everything, eliminating cross-origin CORS concerns).
    *   Very cheap and predictable pricing (flat monthly fee).
*   **Cons:** Requires manual Linux administration (setting up Git, installing Python/Node, configuring systemd services to keep processes running, setting up SSL certificates via Certbot, and securing the server).

---

## 3. Cost Breakdown

| Component | Host / Provider | Option A (Separate) Cost | Option B (Single VPS) Cost |
| :--- | :--- | :--- | :--- |
| **Domain Registration** | Namecheap, Porkbun, Cloudflare | **~$10 - $14 / year** | **~$10 - $14 / year** |
| **Frontend Hosting** | Vercel or Netlify | **$0 / month** (Free tier) | Included in VPS |
| **Backend Hosting** | Render or Railway | **$0 / month** (Free, with cold starts)<br>**$7 / month** (Hobby, no sleep) | **$4 - $6 / month** (DigitalOcean / Hetzner) |
| **SSL/HTTPS Certificate** | Let's Encrypt | **$0** (Automatic) | **$0** (Configured via Certbot) |
| **Total Estimated Cost** | — | **~$12/year** (Strictly free hosts)<br>or **~$12/year + $7/month** | **~$12/year + $4-$6/month** (~$72/year total) |

---

## 4. Step-by-Step Deployment Instructions

### Phase 1: Purchase the Domain
1. Go to a domain registrar (recommendations: **Porkbun**, **Cloudflare Registrar**, or **Namecheap**).
2. Search for and buy `tylerlammey.com`.

---

### Phase 2: Deploying via Option A (Separate Hosting - Recommended)

#### Step 1: Deploy the Backend (e.g., Render)
1. Create a free account on [Render](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   * **Name:** `tylerlammey-backend`
   * **Region:** Choose the one closest to you (e.g., US East).
   * **Branch:** `main`
   * **Root Directory:** `backend`
   * **Runtime:** `Python`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
   * **Instance Type:** `Free` (or `Hobby` at $7/month to prevent sleep)
5. Add your Environment Variables in the **Environment** tab:
   * `OPENAI_API_KEY` = *[Your OpenAI Key]*
   * `PUSHOVER_USER` = *[Your Pushover User Key]*
   * `PUSHOVER_TOKEN` = *[Your Pushover App Token]*
6. Click **Deploy Web Service**.
7. Once successfully deployed, Render will give you a public URL like `https://tylerlammey-backend.onrender.com`. Copy this URL.

#### Step 2: Deploy the Frontend (e.g., Vercel)
1. Create a free account on [Vercel](https://vercel.com).
2. Click **Add New** > **Project** and import your GitHub repository.
3. Configure the Project settings:
   * **Framework Preset:** `Vite` (should be auto-detected)
   * **Root Directory:** `frontend`
4. Expand **Environment Variables** and add:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://tylerlammey-backend.onrender.com` (Use the backend URL you copied from Step 1, with *no* trailing slash)
5. Click **Deploy**. Vercel will build and host your site, giving you a temporary Vercel subdomain.

#### Step 3: Link Your Custom Domain
1. In Vercel, go to your project **Settings** > **Domains**.
2. Enter `tylerlammey.com` and click **Add**.
3. Vercel will show you the DNS records you need to add to your Domain Registrar.
4. Log into your Domain Registrar (Porkbun/Namecheap) and go to DNS settings. Add:
   * An **A record** pointing `@` to Vercel's IP address.
   * A CNAME record pointing `www` to `cname.vercel-dns.com`.
5. Pointing your backend subdomain: If you want your backend on `api.tylerlammey.com`:
   * Go to Render > your web service > **Settings** > **Custom Domains**.
   * Add `api.tylerlammey.com`.
   * Add a **CNAME record** in your registrar pointing `api` to `tylerlammey-backend.onrender.com`.

---

### Phase 3: Deploying via Option B (Single VPS Hosting)

If you prefer to run both on a single Linux server ($4-$6/mo) to avoid cold starts and keep everything under a single domain:

#### Step 1: Create a VPS
1. Sign up for a cloud provider (e.g., DigitalOcean, Hetzner, or Vultr).
2. Create a virtual machine (often called a "Droplet" or "Instance").
   * Choose **Ubuntu (latest LTS version)**.
   * Choose the cheapest plan (e.g., 1GB RAM, 1 vCPU - approx. $4 - $6/month).
3. Connect your domain: In your registrar's DNS settings, point an **A record** for `@` and `www` to your VPS's public IP address.

#### Step 2: Server Configuration (via SSH Terminal)
Connect to your server: `ssh root@your_vps_ip`.

1. **Update packages and install dependencies:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install git python3-pip python3-venv nginx -y
   ```

2. **Clone the repository:**
   ```bash
   cd /var/www
   sudo git clone https://github.com/tylerlammey/personal-website.git
   sudo chown -R $USER:$USER /var/www/personal-website
   ```

3. **Set up the backend:**
   ```bash
   cd /var/www/personal-website/backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
   Create your production environment file: `nano .env` and insert your API keys:
   ```env
   OPENAI_API_KEY=your_key_here
   PUSHOVER_USER=your_user_here
   PUSHOVER_TOKEN=your_token_here
   ```

4. **Run the backend as a background service (Systemd):**
   Create a service file:
   ```bash
   sudo nano /etc/systemd/system/portfolio-backend.service
   ```
   Paste the following:
   ```ini
   [Unit]
   Description=FastAPI Portfolio Backend
   After=network.target

   [Service]
   User=root
   WorkingDirectory=/var/www/personal-website/backend
   ExecStart=/var/www/personal-website/backend/.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   Enable and start the backend service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable portfolio-backend
   sudo systemctl start portfolio-backend
   ```

5. **Build the frontend:**
   Ensure Node.js is installed on the VPS, or build it locally and upload it. To build on the server:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   cd /var/www/personal-website/frontend
   # Create frontend production env pointing to local reverse proxy path
   echo "VITE_API_URL=/api" > .env.production
   npm install
   npm run build
   ```
   This generates the static production build files inside `/var/www/personal-website/frontend/dist`.

6. **Configure Nginx:**
   Create an Nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/tylerlammey.com
   ```
   Paste the following configuration:
   ```nginx
   server {
       listen 80;
       server_name tylerlammey.com www.tylerlammey.com;

       # Frontend - Serve static build files
       location / {
           root /var/www/personal-website/frontend/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # Backend - Reverse proxy /api requests to FastAPI running on port 8000
       location /api {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   Link the configuration and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/tylerlammey.com /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default  # remove default config
   sudo nginx -t                             # test config syntax
   sudo systemctl restart nginx
   ```

7. **Set up HTTPS/SSL (Crucial for Security):**
   Use Certbot to get a free SSL certificate from Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d tylerlammey.com -d www.tylerlammey.com
   ```
   Follow the prompts. Certbot will automatically rewrite the Nginx configuration to support HTTPS and handle automatic renewals.

---

## 5. Security & Best Practices

1. **Never Commit Secrets:** Do not push `.env` files to GitHub. In GitHub settings, keep your repository **private** if possible (to protect your portfolio assets/context files), and configure secrets through your hosting provider's GUI or local `.env` files on the VPS.
2. **CORS Restrictions:** In `backend/app.py` around line 202, once your frontend domain is established, replace:
   ```python
   allow_origins=["*"],
   ```
   with:
   ```python
   allow_origins=["https://tylerlammey.com", "https://www.tylerlammey.com"],
   ```
   This prevents other websites from making API requests to your OpenAI backend on your dime.
3. **OpenAI Budget Limits:** In the OpenAI API developer dashboard, set a hard **monthly usage limit** (e.g., $10 or $20) to ensure that if your site receives unexpected traffic (or a scraping bot), you don't receive an unexpectedly large bill.
