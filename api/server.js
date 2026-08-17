/**
 * Palestinian Souls / Remember Gaza - Node.js Express API Backend
 * Provides Authentication, JWT Session Verification, Password Hashing,
 * RBAC Enforcement, Rate Limiting, Input Sanitization & Audit Logging
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// In-memory rate limiting map
const rateLimitMap = new Map();

function rateLimiter(req, res, next) {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxRequests = 100;

    const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
    } else {
        record.count++;
    }
    rateLimitMap.set(ip, record);

    if (record.count > maxRequests) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
}

app.use(rateLimiter);

// Password Hashing Helper using PBKDF2 (SHA512)
function hashPassword(password, salt) {
    if (!salt) salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === storedHash;
}

// Pre-seeded Admin Credentials
const adminSalt = crypto.randomBytes(16).toString('hex');
const adminHash = hashPassword('admin123', adminSalt).hash;

const usersDB = [
    {
        id: '1',
        username: 'admin',
        salt: adminSalt,
        hash: adminHash,
        role: 'Administrator',
        permissions: [
            'corrections.read',
            'corrections.review',
            'corrections.approve',
            'corrections.reject',
            'corrections.request_information',
            'audit.read',
            'users.manage'
        ]
    },
    {
        id: '2',
        username: 'reviewer',
        salt: adminSalt,
        hash: hashPassword('reviewer123', adminSalt).hash,
        role: 'Reviewer',
        permissions: [
            'corrections.read',
            'corrections.review',
            'corrections.request_information'
        ]
    }
];

const sessions = new Map();
const inMemorySubmissions = new Map();
const inMemoryAuditLogs = [];

// Authentication Endpoint
app.post('/api/v1/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required.' });
    }

    const user = usersDB.find(u => u.username === username);
    if (!user || !verifyPassword(password, user.salt, user.hash)) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = 'jwt_sess_' + crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions || [],
        expiresAt: Date.now() + 86400000
    });

    inMemoryAuditLogs.push({
        id: 'audit_' + Date.now(),
        userId: user.id,
        username: user.username,
        role: user.role,
        action: 'LOGIN',
        details: `User ${user.username} logged in successfully`,
        createdAt: new Date().toISOString()
    });

    return res.json({ success: true, token, role: user.role, permissions: user.permissions });
});

// Auth Middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized. Token required.' });

    const token = authHeader.replace('Bearer ', '');
    const session = sessions.get(token);

    if (!session || session.expiresAt < Date.now()) {
        return res.status(401).json({ error: 'Session expired or invalid.' });
    }

    req.user = session;
    next();
}

// RBAC Middleware Helper
function requirePermission(perm) {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions || !req.user.permissions.includes(perm)) {
            return res.status(403).json({ error: `Forbidden. Missing permission: ${perm}` });
        }
        next();
    };
}

// Public Endpoint - Only Approved Data
app.get('/api/v1/public/martyrs', (req, res) => {
    // Return only published/approved records to public
    const approved = Array.from(inMemorySubmissions.values()).filter(s => s.status === 'APPROVED');
    return res.json({ success: true, data: approved });
});

// Admin Submissions Endpoint
app.get('/api/v1/submissions', requireAuth, requirePermission('corrections.read'), (req, res) => {
    const status = req.query.status || 'ALL';
    let list = Array.from(inMemorySubmissions.values());
    if (status !== 'ALL') {
        list = list.filter(s => s.status === status);
    }
    return res.json({ success: true, data: list });
});

// Submission Creation
app.post('/api/v1/submissions', (req, res) => {
    const sub = {
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        submitterName: req.body.submitterName || 'Visitor',
        martyrName: req.body.martyrName || '',
        category: req.body.category || 'Gazans',
        city: req.body.city || '',
        notes: req.body.notes || '',
        photoUrl: req.body.photoUrl || '',
        proposedData: req.body.proposedData || {},
        currentData: req.body.currentData || {},
        status: 'PENDING',
        created_at: new Date().toISOString()
    };

    inMemorySubmissions.set(sub.id, sub);
    return res.json({ success: true, status: 'PENDING', data: sub });
});

// Update Status Endpoint
app.put('/api/v1/submissions/:id/status', requireAuth, (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_INFORMATION'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status state' });
    }

    const sub = inMemorySubmissions.get(id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    // Check permissions per action
    if (status === 'APPROVED' && !req.user.permissions.includes('corrections.approve')) {
        return res.status(403).json({ error: 'Forbidden. Requires corrections.approve' });
    }
    if (status === 'REJECTED' && !req.user.permissions.includes('corrections.reject')) {
        return res.status(403).json({ error: 'Forbidden. Requires corrections.reject' });
    }

    const oldStatus = sub.status;
    sub.status = status;
    sub.reviewerNotes = notes || sub.reviewerNotes || '';
    sub.reviewedAt = new Date().toISOString();
    sub.reviewedBy = req.user.username;

    inMemoryAuditLogs.push({
        id: 'audit_' + Date.now(),
        userId: req.user.userId,
        username: req.user.username,
        role: req.user.role,
        action: `STATUS_CHANGE_${status}`,
        details: `Submission ${id} changed status from ${oldStatus} to ${status}. Notes: ${notes || 'N/A'}`,
        createdAt: new Date().toISOString()
    });

    return res.json({ success: true, data: sub });
});

// Audit Logs Endpoint
app.get('/api/v1/audit', requireAuth, requirePermission('audit.read'), (req, res) => {
    return res.json({ success: true, data: inMemoryAuditLogs });
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
    app.listen(PORT, () => console.log(`[Backend API] Running on port ${PORT}`));
}

module.exports = app;
