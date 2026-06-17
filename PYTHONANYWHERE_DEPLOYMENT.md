# Bee's Perfumery — PythonAnywhere Deployment Guide

## Architecture (Recommended: Django + Cloudflare Pages)

```
Cloudflare Pages (free)              PythonAnywhere (Hacker $5/mo)
  bees-perfumery.pages.dev             mikedare.pythonanywhere.com
  ┌──────────────────────┐             ┌──────────────────────┐
  │ TanStack Start (SSR) │◀────CORS──▶│ Django REST API      │
  │ React 19 + Tailwind  │             │ Gunicorn + WSGI     │
  │ (Cloudflare Workers) │             │ MySQL / PostgreSQL   │
  └──────────────────────┘             └──────────────────────┘
```

The project already has `wrangler.jsonc` and `@cloudflare/vite-plugin` — Cloudflare deployment requires zero code changes.

---

## Option A: Django on PythonAnywhere + Frontend on Cloudflare Pages ★ Recommended

### Step 1 — Push code to GitHub

```bash
cd C:\Users\miche\OneDrive\Documents\MY WORK\bees
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/bees-perfumery.git
git push -u origin main
```

### Step 2 — Deploy frontend to Cloudflare Pages (3 minutes, free)

Open a terminal **on your local machine** (or use GitHub Actions):

```bash
cd frontend

# Login to Cloudflare (opens browser for auth)
npx wrangler login

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name bees-perfumery
```

Or set up automatic deployment via GitHub:
1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select your repo, set build command to `cd frontend && npm run build`, output dir: `frontend/dist/client`
3. Set environment variable: `VITE_API_URL=https://mikedare.pythonanywhere.com/api/`
4. Set environment variable: `VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxx`

Your frontend will be live at `https://bees-perfumery.pages.dev`

> **Note on SSR on Cloudflare:** TanStack Start + Cloudflare uses SSR on Cloudflare Workers (edge rendering). This means your frontend SSR works fully — route-based code splitting, data loading, dynamic meta tags, everything. The `@cloudflare/vite-plugin` and `wrangler.jsonc` already configure this.

### Step 3 — Open PythonAnywhere Bash Console

Login → **Consoles** tab → Start **Bash**.

### Step 4 — Clone the repo & create virtualenv

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/bees-perfumery.git
cd bees-perfumery

mkvirtualenv --python=/usr/bin/python3.10 bees-perfumery
pip install -r backend/requirements.txt
```

If `psycopg2-binary` fails (we'll use MySQL instead):

```bash
pip install mysqlclient
```

If `mysqlclient` fails, use:

```bash
pip install pymysql
```

Then add this at the top of `backend/core/wsgi.py` later.

### Step 5 — Set up the MySQL database

1. Go to **Databases tab** → Set a database password → Create database
2. Your database name: **`mikedare$bees_perfumery`**
3. Your host: **`mikedare.mysql.pythonanywhere-services.com`**

### Step 6 — Configure Django for PythonAnywhere

Create environment variables via the **Web tab** → **Environment variables** (or use a `.env` file):

| Variable | Value |
|---|---|
| `SECRET_KEY` | `<generate-a-random-secret>` |
| `DB_NAME` | `mikedare$bees_perfumery` |
| `DB_USER` | `mikedare` |
| `DB_PASSWORD` | `<your-mysql-password>` |
| `DB_HOST` | `mikedare.mysql.pythonanywhere-services.com` |
| `DB_PORT` | `3306` |
| `ALLOWED_HOSTS` | `mikedare.pythonanywhere.com` |
| `CORS_ALLOWED_ORIGINS` | `https://bees-perfumery.pages.dev,https://mikedare.pythonanywhere.com` |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_xxxxxxxxxxxx` |
| `PAYSTACK_SECRET_KEY` | `sk_live_xxxxxxxxxxxx` |
| `EMAIL_HOST_USER` | `your-email@gmail.com` |
| `EMAIL_HOST_PASSWORD` | `your-app-password` |
| `GOOGLE_CALLBACK_URL` | `https://bees-perfumery.pages.dev/login/callback` |
| `DEBUG` | `False` |

### Step 7 — Update settings.py to use MySQL

Edit `backend/core/settings.py` and replace the DATABASES section:

```python
import sys

# Detect PythonAnywhere
ON_PYTHONANYWHERE = 'PYTHONANYWHERE_DOMAIN' in os.environ

if ON_PYTHONANYWHERE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DB_NAME'),
            'USER': os.getenv('DB_USER'),
            'PASSWORD': os.getenv('DB_PASSWORD'),
            'HOST': os.getenv('DB_HOST'),
            'PORT': os.getenv('DB_PORT'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME'),
            'USER': os.getenv('DB_USER'),
            'PASSWORD': os.getenv('DB_PASSWORD'),
            'HOST': os.getenv('DB_HOST'),
            'PORT': os.getenv('DB_PORT'),
        }
    }
```

If using `pymysql`, add this at the top of `backend/core/__init__.py`:

```python
import pymysql
pymysql.install_as_MySQLdb()
```

### Step 8 — Set up the WSGI file

Go to **Web tab** → **Code** → click the WSGI file link (e.g., `/var/www/mikedare_pythonanywhere_com_wsgi.py`).

Replace everything with:

```python
import os
import sys

path = '/home/mikedare/bees-perfumery/backend'
if path not in sys.path:
    sys.path.insert(0, path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### Step 9 — Set virtualenv & working directory

On the **Web tab**:

| Field | Value |
|---|---|
| **Virtualenv** | `/home/mikedare/.virtualenvs/bees-perfumery` |
| **Source code** | `/home/mikedare/bees-perfumery/backend` |
| **Working directory** | `/home/mikedare/bees-perfumery/backend` |

### Step 10 — Configure static & media files

On the **Web tab** → **Static files**:

| URL | Directory |
|---|---|
| `/static/` | `/home/mikedare/bees-perfumery/backend/staticfiles` |
| `/media/` | `/home/mikedare/bees-perfumery/backend/media` |

### Step 11 — Run migrations & collectstatic

Back in the **Bash console**:

```bash
cd ~/bees-perfumery/backend
workon bees-perfumery
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### Step 12 — Reload the web app

Go to **Web tab** → click the green **Reload** button.

### Step 13 — Test

- Django admin: `https://mikedare.pythonanywhere.com/admin/`
- API: `https://mikedare.pythonanywhere.com/api/categories/`
- Frontend: `https://bees-perfumery.pages.dev`

Both will now communicate via CORS.

---

## Option B: All-in-One on PythonAnywhere (Django + Static Frontend)

Use this if you want everything on PythonAnywhere without Cloudflare.

### Step B1 — Build the frontend locally

On your **local machine**:

```bash
cd frontend
bun install
bun run build
```

This creates `frontend/dist/client/assets/` — the compiled JS and CSS.

### Step B2 — Create a frontend template for Django

Create `backend/core/templates/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bee's Perfumery</title>
  <link rel="stylesheet" href="/static/assets/styles-BEHyCSwz.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/static/assets/index-BVB_cSp6.js"></script>
</body>
</html>
```

> **Important:** The exact filenames (`styles-BEHyCSwz.css`, `index-BVB_cSp6.js`) change with every build because Vite hashes them. You must check the actual filenames in `dist/client/assets/` after each build and update this template.

### Step B3 — Copy frontend assets to Django

```bash
# Copy the built assets to Django's static directory
cp -r frontend/dist/client/assets backend/staticfiles/
```

### Step B4 — Add a catch-all URL in Django

Add to `backend/core/urls.py`:

```python
from django.views.generic import TemplateView

urlpatterns += [
    # SPA catch-all (must be LAST — after api/ and admin/)
    re_path(r'^(?!api/|admin/|auth/|static/|media/).*$', 
            TemplateView.as_view(template_name='index.html')),
]
```

Add `from django.urls import re_path` at the top.

Create `backend/core/templates/` directory and put `index.html` there.

Also add to `settings.py`:

```python
import os
TEMPLATES[0]['DIRS'] = [os.path.join(BASE_DIR, 'core', 'templates')]
```

### Step B5 — Build & copy after every frontend change

After making frontend changes:

```bash
cd frontend
bun run build

# Copy assets to Django
cp dist/client/assets/*.js ../backend/staticfiles/assets/
cp dist/client/assets/*.css ../backend/staticfiles/assets/
```

Then redeploy:

```bash
cd ~/bees-perfumery
git add .
git commit -m "Update frontend build"
git push
```

On PythonAnywhere, `git pull` and reload.

---

## Part C: Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials** → **Create OAuth 2.0 Client ID**
3. Set **Authorized redirect URIs**:
   - If Cloudflare: `https://bees-perfumery.pages.dev/login/callback`
   - If PythonAnywhere only: `https://mikedare.pythonanywhere.com/login/callback`

---

## Part D: Paystack Webhook

Set your Paystack webhook URL to:
```
https://mikedare.pythonanywhere.com/api/webhooks/paystack/
```

---

## Part E: Custom Domain (PythonAnywhere Paid Plan)

On the **Web tab**:

1. Enter your domain in the **Custom domain** field
2. Add a CNAME record at your DNS provider pointing to `pythonanywhere.com`
3. Wait for the SSL certificate to provision

Then update:
- `ALLOWED_HOSTS` → `yourdomain.com,www.yourdomain.com`
- `CORS_ALLOWED_ORIGINS` → `https://yourdomain.com,https://www.yourdomain.com`

---

## Part F: Troubleshooting

| Problem | Fix |
|---|---|
| **ModuleNotFoundError: MySQLdb** | Install `pymysql` and add `pymysql.install_as_MySQLdb()` to `core/__init__.py` |
| **500 error on reload** | Check **Web tab** → **Error log** |
| **Static files 404** | Verify Static Files paths in Web tab match your `STATIC_ROOT` |
| **CORS error in browser** | Check `CORS_ALLOWED_ORIGINS` matches your frontend domain EXACTLY |
| **Media uploads not showing** | Verify `MEDIA_ROOT` and PythonAnywhere static files mapping |
| **Blank frontend page** | Check browser console for JS errors; verify `VITE_API_URL` is correct |
| **PythonAnywhere "violated resource limits"** | Upgrade to Hacker or Web Developer plan ($5-$12/mo) |

---

## Files Modified/Created for PythonAnywhere

| File | What it does |
|---|---|
| `backend/core/settings.py` | Add MySQL detection + CORS update |
| `backend/core/urls.py` | Add SPA catch-all route (if Option B) |
| `backend/core/__init__.py` | Add `pymysql.install_as_MySQLdb()` (if using pymysql) |
| `backend/core/templates/index.html` | Django template loading the frontend (if Option B) |
| `PYTHONANYWHERE_DEPLOYMENT.md` | This guide |

---

## Summary

**Recommended path:**
1. Deploy frontend to **Cloudflare Pages** (free, already configured, SSR works)
2. Deploy Django backend to **PythonAnywhere** (Hacker plan $5/mo)
3. Connect them via CORS

This gives you full SSR, automatic deployments, no Node.js hosting hassle on PythonAnywhere, and both platforms have generous free/cheap tiers.
