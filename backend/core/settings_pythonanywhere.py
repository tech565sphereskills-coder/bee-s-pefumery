from .settings import *

DEBUG = False

ALLOWED_HOSTS = ['mikedare.pythonanywhere.com', 'www.yourdomain.com']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'mikedare$bees_perfumery',
        'USER': 'mikedare',
        'PASSWORD': '<your-mysql-password>',
        'HOST': 'mikedare.mysql.pythonanywhere-services.com',
        'PORT': '3306',
    }
}

# Remove PostgreSQL-only apps if any
# No changes needed here unless you added PostgreSQL-specific features

CSRF_TRUSTED_ORIGINS = ['https://mikedare.pythonanywhere.com']

# If deploying frontend on Cloudflare Pages, use your Cloudflare domain
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'https://bees-perfumery.pages.dev,https://mikedare.pythonanywhere.com').split(',')

# Security settings for PythonAnywhere
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Frontend dist path (if serving static build from Django)
import os
FRONTEND_DIST_DIR = os.path.join(BASE_DIR, 'frontend_dist')
TEMPLATES[0]['DIRS'] = [FRONTEND_DIST_DIR]
STATICFILES_DIRS = [os.path.join(FRONTEND_DIST_DIR, 'assets')]
