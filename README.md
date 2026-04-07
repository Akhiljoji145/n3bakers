# N3 BAKERS - Bakery Unified Platform

A comprehensive system for bakery management including multi-branch operations, POS billing, online ordering, and inventory management.

## Project Structure
- `backend/`: Django REST Framework API.
- `frontend/`: React Native (Expo) Universal App (Web + Mobile).

## Setup Instructions

### Backend
1. Navigate to `backend/`.
2. Install dependencies: `pip install -r requirements.txt` (or manually install Django, DRF, etc.).
3. Run migrations: `python manage.py migrate`.
4. Run server: `python manage.py runserver`.

### Frontend
1. Navigate to `frontend/`.
2. Install dependencies: `npm install --legacy-peer-deps`.
3. Run for Web: `npm run web`.
4. Run for Mobile: `npx expo start`.

## Features
- **Admin**: Full control over branches and users.
- **Manager**: POS billing, order management, inventory monitoring.
- **Baker**: Real-time kitchen queue for preparing orders.
- **Customer**: Browse products, place online/bulk orders, track status.
