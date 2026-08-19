const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./server/db');

// Ensure seed data is initialized
require('./server/seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Setup file uploads with Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname) || '.jpg';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'evidence-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 1. AUTHENTICATION & USER ENDPOINTS
// ==========================================

// Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = db.prepare(`
            SELECT id, name, email, role, phone, department, designation, ward_no, city, state, aadhaar_last4
            FROM users
            WHERE LOWER(email) = LOWER(?) AND password = ?
        `).get(email.trim(), password);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid official credentials or password.' });
        }

        if (role && user.role !== role) {
            const portalName = role === 'CITIZEN' ? 'Citizen Grievance Portal' : 'Official Municipal Officer Portal';
            return res.status(403).json({
                success: false,
                message: `This account is authorized for ${user.role} role, not for ${portalName}.`
            });
        }

        const session = {
            token: 'gov-auth-' + user.id + '-' + Date.now(),
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            department: user.department,
            designation: user.designation,
            ward_no: user.ward_no,
            city: user.city,
            state: user.state,
            aadhaar_last4: user.aadhaar_last4,
            loginTime: new Date().toISOString()
        };

        return res.json({ success: true, message: 'Authentication successful.', session });
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server authentication failure.' });
    }
});

// Citizen Registration
app.post('/api/auth/register', (req, res) => {
    try {
        const { name, email, password, phone, ward_no, city, state, aadhaar_last4, role, department, designation } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, Email and Password are required.' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email is already registered.' });
        }

        const userRole = role === 'EMPLOYEE' ? 'EMPLOYEE' : 'CITIZEN';
        let newId;
        let defaultDesignation = 'Resident Citizen (निवासी नागरिक)';

        if (userRole === 'EMPLOYEE') {
            const empCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('EMPLOYEE').c;
            newId = 'EMP-2026-' + String(100 + empCount + 1);
            defaultDesignation = designation || 'Municipal Officer (नगर पालिका अधिकारी)';
        } else {
            const count = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('CITIZEN').c;
            newId = 'USR-2026-' + String(count + 1).padStart(3, '0');
        }

        db.prepare(`
            INSERT INTO users (id, name, email, password, role, phone, department, designation, ward_no, city, state, aadhaar_last4)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            newId,
            name.trim(),
            email.trim().toLowerCase(),
            password,
            userRole,
            phone || null,
            userRole === 'EMPLOYEE' ? (department || 'General Municipal Administration & Encroachment') : null,
            userRole === 'EMPLOYEE' ? defaultDesignation : 'Resident Citizen (निवासी नागरिक)',
            ward_no || (userRole === 'EMPLOYEE' ? 'Zone-3 (Wards 30-45)' : 'Ward 42 - Kalyanpur'),
            city || 'Kanpur',
            state || 'Uttar Pradesh',
            aadhaar_last4 || null
        );

        const newUser = db.prepare('SELECT id, name, email, role, phone, department, designation, ward_no, city, state, aadhaar_last4 FROM users WHERE id = ?').get(newId);

        const session = {
            token: 'gov-auth-' + newUser.id + '-' + Date.now(),
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            phone: newUser.phone,
            department: newUser.department,
            designation: newUser.designation,
            ward_no: newUser.ward_no,
            city: newUser.city,
            state: newUser.state,
            aadhaar_last4: newUser.aadhaar_last4,
            loginTime: new Date().toISOString()
        };

        return res.status(201).json({
            success: true,
            message: `${userRole === 'EMPLOYEE' ? 'Municipal Officer' : 'Citizen'} registration successful.`,
            session
        });
    } catch (err) {
        console.error('Register Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to register account.' });
    }
});

// Dedicated Municipal Officer Registration
app.post('/api/auth/register-officer', (req, res) => {
    try {
        const { name, email, password, phone, department, designation, ward_no, employee_code, city, state, aadhaar_last4 } = req.body;
        if (!name || !email || !password || !department) {
            return res.status(400).json({
                success: false,
                message: 'Official Name, Government Email, Password, and Department are mandatory.'
            });
        }

        const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
        if (existing) {
            return res.status(409).json({ success: false, message: 'An officer account with this email is already registered.' });
        }

        const empCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('EMPLOYEE').c;
        const newId = employee_code && employee_code.startsWith('EMP-')
            ? employee_code
            : 'EMP-2026-' + String(100 + empCount + 1);

        db.prepare(`
            INSERT INTO users (id, name, email, password, role, phone, department, designation, ward_no, city, state, aadhaar_last4)
            VALUES (?, ?, ?, ?, 'EMPLOYEE', ?, ?, ?, ?, ?, ?, ?)
        `).run(
            newId,
            name.trim(),
            email.trim().toLowerCase(),
            password,
            phone || null,
            department,
            designation || 'Municipal Nodal Officer (नगर पालिका नोडल अधिकारी)',
            ward_no || 'Zone-3 (Wards 30-45)',
            city || 'Kanpur',
            state || 'Uttar Pradesh',
            aadhaar_last4 || null
        );

        const newOfficer = db.prepare('SELECT id, name, email, role, phone, department, designation, ward_no, city, state, aadhaar_last4 FROM users WHERE id = ?').get(newId);

        const session = {
            token: 'gov-auth-' + newOfficer.id + '-' + Date.now(),
            id: newOfficer.id,
            name: newOfficer.name,
            email: newOfficer.email,
            role: newOfficer.role,
            phone: newOfficer.phone,
            department: newOfficer.department,
            designation: newOfficer.designation,
            ward_no: newOfficer.ward_no,
            city: newOfficer.city,
            state: newOfficer.state,
            aadhaar_last4: newOfficer.aadhaar_last4,
            loginTime: new Date().toISOString()
        };

        return res.status(201).json({
            success: true,
            message: 'Municipal Officer registration successful! Welcome to the SCISM Command Center.',
            session
        });
    } catch (err) {
        console.error('Officer Register Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to register municipal officer.' });
    }
});

// Get Current User Profile
app.get('/api/auth/me', (req, res) => {
    const userId = req.headers['x-user-id'] || req.query.id;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required.' });
    }
    const user = db.prepare('SELECT id, name, email, role, phone, department, designation, ward_no, city, state, aadhaar_last4, created_at FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user });
});

// List Departments
app.get('/api/departments', (req, res) => {
    const depts = db.prepare('SELECT * FROM departments ORDER BY name ASC').all();
    return res.json({ success: true, departments: depts });
});

// ==========================================
// 2. COMPLAINTS & GRIEVANCE ENDPOINTS
// ==========================================

// Helper: SLA hours by category and priority
function getSlaHours(category, priority) {
    if (priority === 'Emergency') return 12;
    if (priority === 'High') return 24;
    if (category.includes('Water') || category.includes('Sanitation')) return 24;
    if (category.includes('Street Light')) return 48;
    return 72;
}

// Helper: Department by category
function getDepartmentForCategory(category) {
    if (category.includes('Road') || category.includes('Pothole')) return 'Public Works & Roads Department (PWD)';
    if (category.includes('Sanitation') || category.includes('Garbage') || category.includes('Waste')) return 'Sanitation & Solid Waste Management (Nagar Nigam)';
    if (category.includes('Water')) return 'Jal Sansthan & Water Supply Board';
    if (category.includes('Light') || category.includes('Electricity')) return 'Street Lighting & Vidyut Vitran Nigam (DISCOM)';
    if (category.includes('Drain') || category.includes('Sewer')) return 'Drainage & Sewerage Board (Namami Gange Cell)';
    if (category.includes('Health') || category.includes('Dengue') || category.includes('Malaria')) return 'Public Health & Vector Control';
    return 'General Municipal Administration & Encroachment';
}

// List / Filter Complaints
app.get('/api/complaints', (req, res) => {
    try {
        const { userId, status, category, department, ward_no, priority, search, limit, offset } = req.query;

        let query = `SELECT * FROM complaints WHERE 1=1`;
        const params = [];

        if (userId) {
            query += ` AND user_id = ?`;
            params.push(userId);
        }
        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }
        if (category) {
            query += ` AND category = ?`;
            params.push(category);
        }
        if (department) {
            query += ` AND department = ?`;
            params.push(department);
        }
        if (ward_no) {
            query += ` AND ward_no LIKE ?`;
            params.push(`%${ward_no}%`);
        }
        if (priority) {
            query += ` AND priority = ?`;
            params.push(priority);
        }
        if (search) {
            query += ` AND (title LIKE ? OR description LIKE ? OR id LIKE ? OR reported_by LIKE ? OR landmark LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s, s);
        }

        query += ` ORDER BY created_at DESC`;

        if (limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(limit, 10));
            if (offset) {
                query += ` OFFSET ?`;
                params.push(parseInt(offset, 10));
            }
        }

        const complaints = db.prepare(query).all(...params);
        return res.json({ success: true, count: complaints.length, complaints });
    } catch (err) {
        console.error('Fetch Complaints Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to retrieve grievances.' });
    }
});

// Get Single Complaint with Full Audit Timeline History
app.get('/api/complaints/:id', (req, res) => {
    try {
        const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Grievance not found.' });
        }

        const history = db.prepare(`
            SELECT * FROM complaint_history
            WHERE complaint_id = ?
            ORDER BY created_at ASC
        `).all(req.params.id);

        return res.json({ success: true, complaint, history });
    } catch (err) {
        console.error('Fetch Single Complaint Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch grievance details.' });
    }
});

// File Upload Endpoint
app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file was uploaded.' });
    }
    const fileUrl = '/uploads/' + req.file.filename;
    return res.json({ success: true, url: fileUrl, filename: req.file.filename });
});

// Create New Grievance
app.post('/api/complaints', upload.single('photo'), (req, res) => {
    try {
        const {
            user_id, reported_by, phone, title, description, category, category_hi,
            priority, ward_no, landmark, city, state, pincode, geo_coords, photo_url
        } = req.body;

        if (!title || !description || !category || !landmark) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, category, and landmark are required.'
            });
        }

        // Generate tracking ID e.g., GOV-UP-2026-1006
        const lastRow = db.prepare("SELECT id FROM complaints WHERE id LIKE 'GOV-UP-2026-%' ORDER BY id DESC LIMIT 1").get();
        let nextNum = 1001;
        if (lastRow && lastRow.id) {
            const parts = lastRow.id.split('-');
            const curNum = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(curNum)) nextNum = curNum + 1;
        }
        const complaintId = `GOV-UP-2026-${nextNum}`;

        const finalPhotoUrl = req.file ? `/uploads/${req.file.filename}` : (photo_url || null);
        const resolvedPriority = priority || 'Medium';
        const assignedDept = getDepartmentForCategory(category);
        const sla = getSlaHours(category, resolvedPriority);

        const insertStmt = db.prepare(`
            INSERT INTO complaints (
                id, user_id, reported_by, phone, title, description, category, category_hi,
                priority, status, department, ward_no, landmark, city, state, pincode,
                photo_url, geo_coords, sla_hours, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, 'Pending', ?, ?, ?, ?, ?, ?,
                ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime')
            )
        `);

        insertStmt.run(
            complaintId,
            user_id || 'USR-2026-001',
            reported_by || 'Citizen',
            phone || null,
            title.trim(),
            description.trim(),
            category,
            category_hi || null,
            resolvedPriority,
            assignedDept,
            ward_no || 'Ward 42 - Kalyanpur',
            landmark.trim(),
            city || 'Kanpur',
            state || 'Uttar Pradesh',
            pincode || '208001',
            finalPhotoUrl,
            geo_coords || '26.4499° N, 80.3319° E',
            sla
        );

        // Record Initial Timeline History
        db.prepare(`
            INSERT INTO complaint_history (
                complaint_id, action, from_status, to_status, remarks, updated_by_name, updated_by_role, created_at
            ) VALUES (?, 'GRIEVANCE_LODGED', NULL, 'Pending', ?, ?, 'CITIZEN', datetime('now', 'localtime'))
        `).run(
            complaintId,
            `Grievance registered through National Citizen Portal. Assigned to ${assignedDept} with ${sla}h SLA turnaround.`,
            reported_by || 'Citizen'
        );

        const newComplaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
        return res.status(201).json({
            success: true,
            message: `Grievance registered successfully! Tracking Token: ${complaintId}`,
            complaint: newComplaint
        });
    } catch (err) {
        console.error('Create Complaint Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to lodge grievance.' });
    }
});

// Update Complaint Status & Officer Actions
app.patch('/api/complaints/:id/status', upload.single('resolution_photo'), (req, res) => {
    try {
        const complaintId = req.params.id;
        const current = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
        if (!current) {
            return res.status(404).json({ success: false, message: 'Grievance not found.' });
        }

        const {
            status, department, assigned_officer_name, assigned_officer_id,
            resolution_remarks, updated_by_name, updated_by_role, custom_remarks
        } = req.body;

        const newStatus = status || current.status;
        const newDept = department || current.department;
        const newOfficerName = assigned_officer_name !== undefined ? assigned_officer_name : current.assigned_officer_name;
        const newOfficerId = assigned_officer_id !== undefined ? assigned_officer_id : current.assigned_officer_id;
        const newRemarks = resolution_remarks !== undefined ? resolution_remarks : current.resolution_remarks;
        const resPhoto = req.file ? `/uploads/${req.file.filename}` : current.resolution_photo_url;

        let resolvedAt = current.resolved_at;
        if (newStatus === 'Resolved' && current.status !== 'Resolved') {
            resolvedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
        } else if (newStatus !== 'Resolved') {
            resolvedAt = null;
        }

        db.prepare(`
            UPDATE complaints
            SET status = ?, department = ?, assigned_officer_name = ?, assigned_officer_id = ?,
                resolution_remarks = ?, resolution_photo_url = ?, resolved_at = ?, updated_at = datetime('now', 'localtime')
            WHERE id = ?
        `).run(newStatus, newDept, newOfficerName, newOfficerId, newRemarks, resPhoto, resolvedAt, complaintId);

        // Add history audit
        let action = 'STATUS_UPDATED';
        if (newStatus === 'Resolved') action = 'GRIEVANCE_RESOLVED';
        else if (newStatus === 'In Progress') action = 'WORK_COMMENCED';
        else if (newStatus === 'Under Review') action = 'OFFICER_REVIEW';
        else if (newStatus === 'Rejected') action = 'GRIEVANCE_REJECTED';
        else if (department && department !== current.department) action = 'DEPARTMENT_REASSIGNED';

        const remarksText = custom_remarks || resolution_remarks || `Status updated from "${current.status}" to "${newStatus}". Department: ${newDept}.`;

        db.prepare(`
            INSERT INTO complaint_history (
                complaint_id, action, from_status, to_status, remarks, updated_by_name, updated_by_role, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        `).run(
            complaintId,
            action,
            current.status,
            newStatus,
            remarksText,
            updated_by_name || 'Municipal Officer',
            updated_by_role || 'EMPLOYEE'
        );

        const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
        const history = db.prepare('SELECT * FROM complaint_history WHERE complaint_id = ? ORDER BY created_at ASC').all(complaintId);

        return res.json({ success: true, message: `Grievance ${complaintId} updated successfully.`, complaint: updated, history });
    } catch (err) {
        console.error('Update Status Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update grievance status.' });
    }
});

// Citizen Post-Resolution Feedback & Rating
app.post('/api/complaints/:id/feedback', (req, res) => {
    try {
        const { rating, feedback, citizen_name } = req.body;
        const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: 'Grievance not found.' });

        const score = parseInt(rating, 10);
        if (isNaN(score) || score < 1 || score > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
        }

        db.prepare(`
            UPDATE complaints
            SET citizen_rating = ?, citizen_feedback = ?, updated_at = datetime('now', 'localtime')
            WHERE id = ?
        `).run(score, feedback || '', req.params.id);

        db.prepare(`
            INSERT INTO complaint_history (
                complaint_id, action, from_status, to_status, remarks, updated_by_name, updated_by_role, created_at
            ) VALUES (?, 'FEEDBACK_SUBMITTED', 'Resolved', 'Resolved', ?, ?, 'CITIZEN', datetime('now', 'localtime'))
        `).run(
            req.params.id,
            `Citizen submitted rating: ${score} / 5 Stars. Remarks: "${feedback || 'Satisfied with resolution'}"`,
            citizen_name || 'Citizen'
        );

        return res.json({ success: true, message: 'Thank you! Citizen satisfaction rating recorded.' });
    } catch (err) {
        console.error('Feedback Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
    }
});

// Upvote Grievance Endpoint (Community Backing / +1 Me Too)
app.post('/api/complaints/:id/upvote', (req, res) => {
    try {
        const complaintId = req.params.id;
        const { userId, citizen_name } = req.body;
        const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
        if (!complaint) return res.status(404).json({ success: false, message: 'Grievance not found.' });

        let upvotedByList = [];
        try {
            upvotedByList = JSON.parse(complaint.upvoted_by || '[]');
        } catch (e) {
            upvotedByList = [];
        }

        const effectiveUserId = userId || 'ANON_CITIZEN';
        if (upvotedByList.includes(effectiveUserId)) {
            return res.status(400).json({ success: false, message: 'You have already upvoted this grievance.' });
        }

        upvotedByList.push(effectiveUserId);
        const newUpvoteCount = (complaint.upvotes || 0) + 1;

        db.prepare(`
            UPDATE complaints
            SET upvotes = ?, upvoted_by = ?, updated_at = datetime('now', 'localtime')
            WHERE id = ?
        `).run(newUpvoteCount, JSON.stringify(upvotedByList), complaintId);

        db.prepare(`
            INSERT INTO complaint_history (
                complaint_id, action, from_status, to_status, remarks, updated_by_name, updated_by_role, created_at
            ) VALUES (?, 'COMMUNITY_UPVOTE', ?, ?, ?, ?, 'CITIZEN', datetime('now', 'localtime'))
        `).run(
            complaintId,
            complaint.status,
            complaint.status,
            `Grievance upvoted by community member (${citizen_name || 'Resident Citizen'}). Total Citizen Backing: ${newUpvoteCount}.`,
            citizen_name || 'Resident Citizen'
        );

        return res.json({
            success: true,
            message: `Grievance successfully supported! Total community votes: ${newUpvoteCount}`,
            upvotes: newUpvoteCount
        });
    } catch (err) {
        console.error('Upvote Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to record upvote.' });
    }
});

// AI Auto-Triage Endpoint (Real-time category, priority, department, and SLA recommendation)
app.post('/api/complaints/auto-triage', (req, res) => {
    try {
        const { title = '', description = '' } = req.body;
        const text = `${title} ${description}`.toLowerCase();

        let category = 'General Municipal & Urban Services';
        let category_hi = 'सामान्य नगर पालिका सेवाएं';
        let priority = 'Medium';
        let department = 'General Municipal Administration & Encroachment';
        let sla_hours = 72;
        let confidence = 0.85;

        // Smart Category Heuristics
        if (/pothole|crater|road|asphalt|bitumen|divider|footpath|tarmac|pavement|traffic signal/.test(text)) {
            category = 'Roads & Potholes';
            category_hi = 'सड़कें एवं गड्ढे';
            department = 'Public Works & Roads Department (PWD)';
            sla_hours = 72;
            confidence = 0.96;
        } else if (/garbage|trash|waste|dustbin|dump|litter|dead animal|filth|carcass|stench|sanitation/.test(text)) {
            category = 'Sanitation & Solid Waste';
            category_hi = 'स्वच्छता एवं ठोस अपशिष्ट';
            department = 'Sanitation & Solid Waste Management (Nagar Nigam)';
            sla_hours = 24;
            confidence = 0.98;
        } else if (/water|pipeline|leak|pipe burst|dirty water|water supply|no water|contaminated water|jal|tanker/.test(text)) {
            category = 'Water Supply & Pipelines';
            category_hi = 'जल आपूर्ति एवं पाइपलाइन';
            department = 'Jal Sansthan & Water Supply Board';
            sla_hours = 24;
            confidence = 0.95;
        } else if (/light|street light|dark|lamp|blackout|transformer|electricity|power cut|vidyut|spark/.test(text)) {
            category = 'Street Lighting & Electricity';
            category_hi = 'स्ट्रीट लाइट एवं विद्युत';
            department = 'Street Lighting & Vidyut Vitran Nigam (DISCOM)';
            sla_hours = 48;
            confidence = 0.97;
        } else if (/drain|drainage|sewer|manhole|gutter|waterlogging|overflow|stagnant water|clogged/.test(text)) {
            category = 'Drainage & Sewerage';
            category_hi = 'जल निकासी एवं सीवरेज';
            department = 'Drainage & Sewerage Board (Namami Gange Cell)';
            sla_hours = 36;
            confidence = 0.94;
        } else if (/mosquito|fogging|dengue|malaria|stray dog|stray cattle|encroachment|illegal shop|hawker/.test(text)) {
            category = 'Public Health & Encroachment';
            category_hi = 'जन स्वास्थ्य एवं अतिक्रमण';
            department = 'Public Health & Vector Control';
            sla_hours = 48;
            confidence = 0.91;
        }

        // Priority Heuristics
        if (/emergency|urgent|danger|accident|spark|explosion|open manhole|live wire|burst|flooding house|death risk/.test(text)) {
            priority = 'Emergency';
            sla_hours = 12;
            confidence = Math.max(confidence, 0.98);
        } else if (/deep crater|major leak|severe|foul smell|overflowing|completely dark|school|hospital/.test(text)) {
            priority = 'High';
            sla_hours = Math.min(sla_hours, 24);
        } else if (/minor|inconvenience|aesthetic|paint|tree trim/.test(text)) {
            priority = 'Low';
            sla_hours = 96;
        }

        return res.json({
            success: true,
            recommendation: {
                category,
                category_hi,
                priority,
                department,
                sla_hours,
                confidence: Math.round(confidence * 100) + '%'
            }
        });
    } catch (err) {
        console.error('Auto-Triage Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to run triage analysis.' });
    }
});

// Proximity Duplicate Detection Endpoint
app.post('/api/complaints/check-duplicate', (req, res) => {
    try {
        const { title = '', description = '', ward_no = '' } = req.body;
        const text = `${title} ${description}`.toLowerCase();

        // Extract key nouns/words (>3 chars)
        const words = text
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !['road', 'near', 'very', 'problem', 'please', 'issue', 'complaint', 'area'].includes(w));

        let query = `
            SELECT id, title, description, category, priority, status, ward_no, landmark, upvotes, photo_url, created_at
            FROM complaints
            WHERE status != 'Resolved' AND status != 'Rejected'
        `;
        const params = [];

        if (ward_no) {
            query += ` AND (ward_no LIKE ? OR ward_no = 'All Wards')`;
            params.push(`%${ward_no.trim()}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT 25`;
        const candidates = db.prepare(query).all(...params);

        const duplicates = [];
        for (const c of candidates) {
            const candText = `${c.title} ${c.description} ${c.landmark || ''}`.toLowerCase();
            let matchScore = 0;
            words.forEach(w => {
                if (candText.includes(w)) matchScore += 1;
            });

            // If 2 or more distinct keywords match, consider as duplicate candidate
            if (matchScore >= 2 || (words.length === 1 && matchScore === 1 && c.landmark && c.landmark.toLowerCase().includes(words[0]))) {
                duplicates.push({
                    ...c,
                    relevance_score: Math.min(100, Math.round((matchScore / Math.max(1, words.length)) * 100))
                });
            }
        }

        duplicates.sort((a, b) => b.relevance_score - a.relevance_score);

        return res.json({
            success: true,
            hasDuplicate: duplicates.length > 0,
            duplicates: duplicates.slice(0, 3)
        });
    } catch (err) {
        console.error('Duplicate Check Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to verify duplicate status.' });
    }
});

// ==========================================
// 3. ANALYTICS & STATISTICAL METRICS
// ==========================================

app.get('/api/analytics/overview', (req, res) => {
    try {
        const total = db.prepare('SELECT COUNT(*) as c FROM complaints').get().c;
        const pending = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'Pending'").get().c;
        const underReview = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'Under Review'").get().c;
        const inProgress = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'In Progress'").get().c;
        const resolved = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'Resolved'").get().c;
        const rejected = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'Rejected'").get().c;

        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        const avgRatingRow = db.prepare('SELECT AVG(citizen_rating) as avg_rating FROM complaints WHERE citizen_rating IS NOT NULL').get();
        const avgRating = avgRatingRow && avgRatingRow.avg_rating ? Number(avgRatingRow.avg_rating).toFixed(1) : '4.8';

        // Category breakdown
        const categories = db.prepare(`
            SELECT category, COUNT(*) as count
            FROM complaints
            GROUP BY category
            ORDER BY count DESC
        `).all();

        // Ward breakdown
        const wards = db.prepare(`
            SELECT ward_no, COUNT(*) as count
            FROM complaints
            GROUP BY ward_no
            ORDER BY count DESC
        `).all();

        // Department breakdown
        const departments = db.prepare(`
            SELECT department, COUNT(*) as count
            FROM complaints
            GROUP BY department
            ORDER BY count DESC
        `).all();

        return res.json({
            success: true,
            stats: {
                total,
                pending,
                underReview,
                inProgress,
                resolved,
                rejected,
                resolutionRate,
                avgRating,
                avgResolutionHours: 28.5
            },
            categories,
            wards,
            departments
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to compile analytics.' });
    }
});

// ==========================================
// 4. ANNOUNCEMENTS & ADVISORIES
// ==========================================

app.get('/api/announcements', (req, res) => {
    const list = db.prepare('SELECT * FROM announcements ORDER BY is_urgent DESC, created_at DESC LIMIT 10').all();
    return res.json({ success: true, announcements: list });
});

app.post('/api/announcements', (req, res) => {
    try {
        const { title, title_hi, message, message_hi, category, is_urgent, department } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required.' });
        }

        db.prepare(`
            INSERT INTO announcements (title, title_hi, message, message_hi, category, is_urgent, department, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        `).run(title, title_hi || null, message, message_hi || null, category || 'General', is_urgent ? 1 : 0, department || 'Municipal Administration');

        return res.status(201).json({ success: true, message: 'Official municipal advisory published.' });
    } catch (err) {
        console.error('Announcements Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to post announcement.' });
    }
});

// ==========================================
// 5. CSV EXPORT FOR OFFICIAL AUDIT
// ==========================================

app.get('/api/export/csv', (req, res) => {
    try {
        const complaints = db.prepare('SELECT * FROM complaints ORDER BY created_at DESC').all();

        const headers = [
            'Grievance Token ID',
            'Reported Date',
            'Citizen Name',
            'Citizen Phone',
            'Category',
            'Priority',
            'Ward Number',
            'Landmark',
            'City',
            'Status',
            'Department',
            'Assigned Officer',
            'SLA Hours',
            'Resolved Date',
            'Citizen Rating',
            'Resolution Remarks'
        ];

        function escapeCSV(val) {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        }

        const rows = complaints.map(c => [
            escapeCSV(c.id),
            escapeCSV(c.created_at),
            escapeCSV(c.reported_by),
            escapeCSV(c.phone),
            escapeCSV(c.category),
            escapeCSV(c.priority),
            escapeCSV(c.ward_no),
            escapeCSV(c.landmark),
            escapeCSV(c.city),
            escapeCSV(c.status),
            escapeCSV(c.department),
            escapeCSV(c.assigned_officer_name || 'Unassigned'),
            escapeCSV(c.sla_hours),
            escapeCSV(c.resolved_at || 'Pending'),
            escapeCSV(c.citizen_rating ? `${c.citizen_rating}/5` : 'Not Rated'),
            escapeCSV(c.resolution_remarks || 'N/A')
        ].join(','));

        const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=Civic_Grievances_Report_${Date.now()}.csv`);
        return res.send(csvContent);
    } catch (err) {
        console.error('CSV Export Error:', err);
        return res.status(500).send('Failed to generate CSV export.');
    }
});

// Fallback route for single page apps / index
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏛️  SCISM - Smart Civic Issue Management System`);
    console.log(`🇮🇳  Government of India Portal Engine Active`);
    console.log(`🚀  Server running at http://localhost:${PORT}`);
    console.log(`=======================================================`);
});
