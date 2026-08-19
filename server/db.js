const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data folder exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'civic_gov.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high performance and concurrent reads
db.pragma('journal_mode = WAL');

// Initialize Tables
function initSchema() {
    db.exec(`
        -- Users Table
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('CITIZEN', 'EMPLOYEE', 'ADMIN')),
            phone TEXT,
            department TEXT,
            designation TEXT,
            ward_no TEXT,
            city TEXT DEFAULT 'Kanpur',
            state TEXT DEFAULT 'Uttar Pradesh',
            aadhaar_last4 TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Departments Table
        CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            name_hi TEXT NOT NULL,
            code TEXT NOT NULL,
            officer_in_charge TEXT,
            email TEXT,
            helpline TEXT
        );

        -- Complaints / Grievances Table
        CREATE TABLE IF NOT EXISTS complaints (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            reported_by TEXT NOT NULL,
            phone TEXT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            category_hi TEXT,
            priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Emergency')),
            status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected')),
            department TEXT NOT NULL,
            ward_no TEXT NOT NULL,
            landmark TEXT NOT NULL,
            city TEXT DEFAULT 'Kanpur',
            state TEXT DEFAULT 'Uttar Pradesh',
            pincode TEXT,
            photo_url TEXT,
            geo_coords TEXT,
            assigned_officer_id TEXT,
            assigned_officer_name TEXT,
            sla_hours INTEGER DEFAULT 72,
            resolution_remarks TEXT,
            resolution_photo_url TEXT,
            citizen_rating INTEGER,
            citizen_feedback TEXT,
            upvotes INTEGER DEFAULT 0,
            upvoted_by TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        -- Complaint Audit / History Timeline Table
        CREATE TABLE IF NOT EXISTS complaint_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id TEXT NOT NULL,
            action TEXT NOT NULL,
            from_status TEXT,
            to_status TEXT,
            remarks TEXT,
            updated_by_name TEXT NOT NULL,
            updated_by_role TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
        );

        -- Announcements / Citizen Advisories Table
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            title_hi TEXT,
            message TEXT NOT NULL,
            message_hi TEXT,
            category TEXT DEFAULT 'General',
            is_urgent INTEGER DEFAULT 0,
            department TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Safe migration: Add upvotes and upvoted_by if upgrading existing database
    try {
        const cols = db.prepare("PRAGMA table_info(complaints)").all();
        const hasUpvotes = cols.some(c => c.name === 'upvotes');
        if (!hasUpvotes) {
            db.exec("ALTER TABLE complaints ADD COLUMN upvotes INTEGER DEFAULT 0");
        }
        const hasUpvotedBy = cols.some(c => c.name === 'upvoted_by');
        if (!hasUpvotedBy) {
            db.exec("ALTER TABLE complaints ADD COLUMN upvoted_by TEXT DEFAULT '[]'");
        }
    } catch (migErr) {
        console.warn('Migration check notice:', migErr.message);
    }
}

initSchema();

module.exports = db;
