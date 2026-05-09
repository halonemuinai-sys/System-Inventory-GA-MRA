@echo off
REM =================================================================
REM  System Inventory MRA - One-click DB Setup + Excel Import
REM  Requires: Laragon with PostgreSQL + Python 3
REM =================================================================
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo =============================================
echo   System Inventory MRA - Auto Installer
echo =============================================
echo.

REM --- Detect Laragon PostgreSQL ---
set "PG_BIN="
for /d %%D in ("C:\laragon\bin\postgresql\*") do set "PG_BIN=%%D\bin"
for /d %%D in ("D:\laragon\bin\postgresql\*") do set "PG_BIN=%%D\bin"
if "%PG_BIN%"=="" (
  set /p PG_BIN=PostgreSQL bin folder not auto-detected. Enter full path: 
)
echo Using PostgreSQL: %PG_BIN%
echo.

REM --- Ask password (hidden input via PowerShell) ---
for /f "delims=" %%P in ('powershell -NoProfile -Command "$p=Read-Host 'Enter postgres password' -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p))"') do set "PGPASSWORD=%%P"

set "PGUSER=postgres"
set "PGHOST=127.0.0.1"
set "PGPORT=5432"
set "DBNAME=ga_mra"

REM --- Step 1: Create database ---
echo [1/4] Creating database %DBNAME%...
"%PG_BIN%\psql" -U %PGUSER% -h %PGHOST% -p %PGPORT% -d postgres -c "CREATE DATABASE %DBNAME%;" 2>nul
if errorlevel 1 echo   (database may already exist - continuing)

REM --- Step 2: Run DDL ---
echo [2/4] Running schema.sql...
"%PG_BIN%\psql" -U %PGUSER% -h %PGHOST% -p %PGPORT% -d %DBNAME% -f "schema.sql"
if errorlevel 1 ( echo SCHEMA FAILED & pause & exit /b 1 )

REM --- Step 3: Install Python deps ---
echo [3/4] Installing Python dependencies...
py -m pip install --quiet --upgrade pip
py -m pip install --quiet pandas openpyxl psycopg2-binary sqlalchemy python-dateutil
if errorlevel 1 ( echo PIP FAILED & pause & exit /b 1 )

REM --- Step 4: Run ETL ---
echo [4/4] Importing Excel data...
set "DB_URL=postgresql://%PGUSER%:%PGPASSWORD%@%PGHOST%:%PGPORT%/%DBNAME%"
set "EXCEL_FILE=D:\System Inventory MRA\GA MRA Group.xlsx"
py "etl\etl_ga_mra.py"
if errorlevel 1 ( echo ETL FAILED & pause & exit /b 1 )

echo.
echo =============================================
echo   DONE! Database ga_mra is ready.
echo =============================================
echo.
echo Verify with:
echo   psql -U postgres -d ga_mra -c "SELECT COUNT(*) FROM ga.assets;"
echo.
set "PGPASSWORD="
pause
