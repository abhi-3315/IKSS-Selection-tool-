
## Prerequisites

- **Windows PC** (required — backend uses Excel COM automation)
- **Python 3.9+** — https://python.org/downloads
  - ✅ Check "Add Python to PATH" during installation
- **Microsoft Excel** (licensed copy) — must be installed on same machine
- **All `.xlsm` files** — place them inside the `backend/` folder

---

## Setup (First Time Only)

1. Open Command Prompt (`cmd`) in the `backend/` folder
2. Run:
   ```
   pip install flask flask-cors pywin32
   ```

---

## How to Run

### Option A — Double Click (Easiest)
Just double-click `start.bat` in the project root folder.
- It installs dependencies automatically
- Starts the server
- Opens your browser to `http://localhost:5000`

### Option B — Manual
```cmd
cd backend
python app.py
```
Then open browser: `http://localhost:5000`

---

## Login Credentials

| Username | Password       |
|----------|----------------|
| admin    | password123    |
| user     | kirloskar2025  |

To add more users, edit `backend/app.py`:
```python
USERS = {
    "admin":    "password123",
    "user":     "kirloskar2025",
    "newuser":  "newpassword"   ← add here
}
```

---

## How It Works

```
Browser (login.html)
    ↓ POST /login
Flask (app.py) validates user
    ↓ 200 OK
Browser (index.html) — user fills form
    ↓ POST /write-excel
Flask writes values to .xlsm → runs Excel macros → reads results
    ↓ JSON response
Browser (results.html) — shows tables + PDF download
```

**Everything runs through one server on port 5000.**
No separate frontend server needed — Flask serves the HTML files directly.

---

## Network Access (Office / LAN)

To let others on the same office network use the tool:

1. Find your PC's IP: open `cmd` → type `ipconfig` → look for `IPv4 Address` (e.g. `192.168.1.100`)
2. Edit `frontend/js/script.js`, change line 3:
   ```js
   const BACKEND_URL = 'http://192.168.1.100:5000';
   ```
   Also update the same line in `frontend/login.html`
3. Allow port 5000 in Windows Firewall
4. Other users open: `http://192.168.1.100:5000`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `pip` not found | Reinstall Python with "Add to PATH" checked |
| `win32com` error | Run `pip install pywin32` then `python -m pywin32_postinstall -install` |
| Excel file not found | Make sure `.xlsm` files are in `backend/` folder |
| Port already in use | Change `port=5000` in `app.py` to `port=5001` |
| Can't connect from another PC | Check Windows Firewall, allow port 5000 |
