/* =====================================================
   CIVIC CONNECT (SCISM) - Shared Gov Client Library
   Government of India / National Citizen Grievance Portal
===================================================== */

const API_BASE = window.location.origin.includes("http") ? "" : "http://localhost:3000";

// Bilingual Dictionary for English & Hindi
const I18N_DICT = {
    en: {
        portal_name: "Smart Civic Issue Management System",
        gov_title: "Government of India",
        ministry_title: "Ministry of Housing and Urban Affairs",
        citizen_portal: "Citizen Grievance Portal",
        officer_portal: "Municipal Officer Portal",
        dashboard: "Dashboard",
        my_complaints: "My Grievances",
        all_complaints: "All Grievances",
        profile: "Profile",
        logout: "Sign Out",
        new_complaint: "Lodge Grievance",
        track_token: "Track by Token ID",
        search_placeholder: "Search by Token, Category, Ward or Landmark...",
        total_grievances: "Total Grievances",
        pending: "Pending",
        under_review: "Under Review",
        in_progress: "In Progress",
        resolved: "Resolved",
        rejected: "Rejected",
        urgent: "Urgent",
        emergency: "Emergency",
        print_receipt: "Print Acknowledgment Slip",
        rate_service: "Rate Resolution Service",
        submit_feedback: "Submit Feedback",
        status: "Status",
        category: "Category",
        ward: "Ward / Zone",
        date: "Date Lodged",
        priority: "Priority",
        sla: "SLA Timeframe",
        assigned_to: "Assigned Nodal Officer",
        helpline_banner: "National Civic Helplines: 1913 (Nagar Nigam Toll-Free) | 112 (National Emergency) | 1076 (CM Helpline) | 1912 (Power DISCOM)",
        officer_registration: "Municipal Officer Registration",
        department_label: "Municipal Department",
        designation_label: "Official Designation",
        badge_label: "Employee Badge Code"
    },
    hi: {
        portal_name: "स्मार्ट नागरिक शिकायत निवारण प्रणाली",
        gov_title: "भारत सरकार",
        ministry_title: "आवासन और शहरी कार्य मंत्रालय",
        citizen_portal: "नागरिक शिकायत पोर्टल",
        officer_portal: "नगर पालिका अधिकारी पोर्टल",
        dashboard: "डैशबोर्ड",
        my_complaints: "मेरी शिकायतें",
        all_complaints: "समस्त शिकायतें",
        profile: "प्रोफ़ाइल",
        logout: "लॉग आउट",
        new_complaint: "शिकायत दर्ज करें",
        track_token: "टोकन संख्या से खोजें",
        search_placeholder: "टोकन, श्रेणी, वार्ड या स्थान द्वारा खोजें...",
        total_grievances: "कुल शिकायतें",
        pending: "लंबित",
        under_review: "समीक्षाधीन",
        in_progress: "प्रगति पर",
        resolved: "निस्तारित",
        rejected: "अस्वीकृत",
        urgent: "अति आवश्यक",
        emergency: "आपातकालीन",
        print_receipt: "पावती रसीद प्रिंट करें",
        rate_service: "सेवा का मूल्यांकन करें",
        submit_feedback: "प्रतिक्रिया भेजें",
        status: "स्थिति",
        category: "श्रेणी",
        ward: "वार्ड / जोन",
        date: "दर्ज तिथि",
        priority: "प्राथमिकता",
        sla: "समय-सीमा (SLA)",
        assigned_to: "नामित नोडल अधिकारी",
        helpline_banner: "राष्ट्रीय नागरिक हेल्पलाइन: 1913 (नगर निगम टोल-फ्री) | 112 (राष्ट्रीय आपातकाल) | 1076 (सीएम हेल्पलाइन) | 1912 (विद्युत निगम)",
        officer_registration: "नगर पालिका अधिकारी पंजीकरण",
        department_label: "नगर पालिका विभाग",
        designation_label: "आधिकारिक पदनाम",
        badge_label: "कर्मचारी कोड / बैज"
    }
};

const STORAGE_KEYS = {
    session: "civic_gov_session",
    complaints: "civic_gov_complaints",
    language: "civic_gov_lang",
    fontSize: "civic_gov_font_size",
    contrast: "civic_gov_contrast"
};

// Default Demo Users for Offline / Instant Fallback
const DEMO_USERS = {
    citizen: {
        email: "citizen@demo.com",
        password: "citizen123",
        role: "CITIZEN",
        name: "Gaurav Yadav",
        id: "USR-2026-001",
        phone: "+91 98765 43210",
        ward_no: "Ward 42 - Kalyanpur",
        city: "Kanpur",
        state: "Uttar Pradesh",
        aadhaar_last4: "8842"
    },
    employee: {
        email: "employee@demo.com",
        password: "employee123",
        role: "EMPLOYEE",
        name: "Priya Sharma",
        id: "EMP-2026-101",
        phone: "+91 91234 56789",
        department: "Sanitation & Solid Waste Management (Nagar Nigam)",
        designation: "Senior Zonal Officer (वरिष्ठ जोनल अधिकारी)",
        ward_no: "Zone-3 (Wards 30-45)",
        city: "Kanpur",
        state: "Uttar Pradesh",
        aadhaar_last4: "1092"
    },
    officer_pwd: {
        email: "officer@demo.com",
        password: "officer123",
        role: "EMPLOYEE",
        name: "Er. Rajesh Verma",
        id: "EMP-2026-102",
        phone: "+91 98390 11223",
        department: "Public Works & Roads Department (PWD)",
        designation: "Executive Engineer (अधिशासी अभियंता)",
        ward_no: "All Wards (Central PWD)",
        city: "Kanpur",
        state: "Uttar Pradesh",
        aadhaar_last4: "7721"
    }
};

// Fallback Initial Complaints
const DEFAULT_FALLBACK_COMPLAINTS = [
    {
        id: "GOV-UP-2026-1001",
        user_id: "USR-2026-001",
        reported_by: "Gaurav Yadav",
        phone: "+91 98765 43210",
        title: "Dangerous deep crater pothole causing vehicle accidents near GT Road crossing",
        description: "A deep pothole of approx 2.5 ft diameter and 8 inches depth has formed right before the Panki railway crossing. Two motorcyclists skid yesterday night. Immediate bituminous patching required.",
        category: "Roads & Potholes",
        category_hi: "सड़कें एवं गड्ढे",
        priority: "High",
        status: "Under Review",
        department: "Public Works & Roads Department (PWD)",
        ward_no: "Ward 42 - Kalyanpur",
        landmark: "Near Panki Power House Crossing, GT Road",
        city: "Kanpur",
        state: "Uttar Pradesh",
        pincode: "208017",
        photo_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
        geo_coords: "26.4952° N, 80.2829° E",
        assigned_officer_name: "Er. Rajesh Verma (Executive Engineer)",
        sla_hours: 48,
        resolution_remarks: null,
        resolution_photo_url: null,
        citizen_rating: null,
        citizen_feedback: null,
        created_at: "2026-08-18 10:30:00",
        updated_at: "2026-08-18 14:15:00"
    },
    {
        id: "GOV-UP-2026-1002",
        user_id: "USR-2026-001",
        reported_by: "Gaurav Yadav",
        phone: "+91 98765 43210",
        title: "Solid waste community bin overflowing onto main vegetable market lane",
        description: "Municipal garbage compactor has not visited Swaroop Nagar block 4 for 3 consecutive days. Waste is spilling across the pedestrian pathway creating severe foul odor and stray cattle hazard.",
        category: "Sanitation & Solid Waste",
        category_hi: "स्वच्छता एवं ठोस अपशिष्ट",
        priority: "High",
        status: "In Progress",
        department: "Sanitation & Solid Waste Management (Nagar Nigam)",
        ward_no: "Ward 34 - Swaroop Nagar",
        landmark: "Opposite Community Center, Block 4",
        city: "Kanpur",
        state: "Uttar Pradesh",
        pincode: "208002",
        photo_url: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600&auto=format&fit=crop&q=80",
        geo_coords: "26.4782° N, 80.3241° E",
        assigned_officer_name: "Priya Sharma (Senior Zonal Officer)",
        sla_hours: 24,
        resolution_remarks: "Sanitary Inspector Shri Arvind Kumar dispatched with 1 compactor truck and 4 safai karmcharis. Clearance ongoing.",
        resolution_photo_url: null,
        citizen_rating: null,
        citizen_feedback: null,
        created_at: "2026-08-17 08:45:00",
        updated_at: "2026-08-19 11:20:00"
    },
    {
        id: "GOV-UP-2026-1003",
        user_id: "USR-2026-001",
        reported_by: "Gaurav Yadav",
        phone: "+91 98765 43210",
        title: "Four high-mast LED street lights defective in residential lane",
        description: "Street lights on Pole No. KL-42/10 to KL-42/13 are not glowing since Friday. Complete dark spot causing safety concerns for women and evening walkers.",
        category: "Street Lighting",
        category_hi: "मार्ग प्रकाश (स्ट्रीट लाइट)",
        priority: "Medium",
        status: "Resolved",
        department: "Street Lighting & Vidyut Vitran Nigam (DISCOM)",
        ward_no: "Ward 42 - Kalyanpur",
        landmark: "Lane 4, Near Shiv Mandir, Kalyanpur Avas Vikas",
        city: "Kanpur",
        state: "Uttar Pradesh",
        pincode: "208017",
        photo_url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80",
        geo_coords: "26.4910° N, 80.2790° E",
        assigned_officer_name: "Er. Sunita Mishra (Assistant Engineer)",
        sla_hours: 48,
        resolution_remarks: "Defective LED drivers and burnt fuse on transformer junction box replaced by DISCOM maintenance squad on 18th August. All 4 luminaires tested and operational.",
        resolution_photo_url: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&auto=format&fit=crop&q=80",
        citizen_rating: 5,
        citizen_feedback: "Prompt action taken within 24 hours by the electrical crew. Excellent service by Nagar Nigam!",
        created_at: "2026-08-16 19:20:00",
        updated_at: "2026-08-18 16:30:00",
        resolved_at: "2026-08-18 16:30:00"
    }
];

// Ward Centroids for Kanpur Municipal Corporation & Surrounding Wards
const WARD_CENTROIDS = {
    "Ward 42 - Kalyanpur": [26.4952, 80.2829],
    "Ward 34 - Swaroop Nagar": [26.4782, 80.3241],
    "Ward 12 - Civil Lines": [26.4715, 80.3520],
    "Ward 25 - Kakadeo": [26.4820, 80.3015],
    "Ward 08 - Hazratganj": [26.8500, 80.9499],
    "Ward 15 - Gomti Nagar": [26.8520, 81.0010],
    "Ward 20 - Aliganj": [26.8900, 80.9400],
    "Ward 50 - Barra": [26.4350, 80.3120],
    "Default": [26.4499, 80.3319]
};

// Robust Coordinate Parser
function parseGeoCoords(geoCoordsStr, wardName) {
    if (geoCoordsStr && typeof geoCoordsStr === "object" && geoCoordsStr.lat !== undefined && geoCoordsStr.lng !== undefined) {
        return [parseFloat(geoCoordsStr.lat), parseFloat(geoCoordsStr.lng)];
    }
    if (Array.isArray(geoCoordsStr) && geoCoordsStr.length >= 2) {
        return [parseFloat(geoCoordsStr[0]), parseFloat(geoCoordsStr[1])];
    }
    if (typeof geoCoordsStr === "string" && geoCoordsStr.trim().length > 0) {
        const matches = geoCoordsStr.match(/[-+]?\d+(\.\d+)?/g);
        if (matches && matches.length >= 2) {
            let lat = parseFloat(matches[0]);
            let lng = parseFloat(matches[1]);
            if (/s/i.test(geoCoordsStr) && !geoCoordsStr.toLowerCase().startsWith("-")) lat = -Math.abs(lat);
            if (/w/i.test(geoCoordsStr) && !geoCoordsStr.toLowerCase().includes(", -")) lng = -Math.abs(lng);
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return [lat, lng];
            }
        }
    }
    // Fallback to ward centroid or default Kanpur coordinates
    if (wardName) {
        for (const [key, coords] of Object.entries(WARD_CENTROIDS)) {
            if (wardName.toLowerCase().includes(key.toLowerCase().split(" - ")[1] || key.toLowerCase())) {
                // Add slight jitter so overlapping ward items don't hide each other exactly
                const jitterLat = (Math.random() - 0.5) * 0.004;
                const jitterLng = (Math.random() - 0.5) * 0.004;
                return [coords[0] + jitterLat, coords[1] + jitterLng];
            }
        }
    }
    return [WARD_CENTROIDS.Default[0] + (Math.random() - 0.5) * 0.01, WARD_CENTROIDS.Default[1] + (Math.random() - 0.5) * 0.01];
}

// Format coordinates to official standard format
function formatGeoCoords(lat, lng) {
    const latCard = lat >= 0 ? "N" : "S";
    const lngCard = lng >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(4)}° ${latCard}, ${Math.abs(lng).toFixed(4)}° ${lngCard}`;
}

// Initialize Local Store Fallback
function initLocalStore() {
    if (!localStorage.getItem(STORAGE_KEYS.complaints)) {
        localStorage.setItem(STORAGE_KEYS.complaints, JSON.stringify(DEFAULT_FALLBACK_COMPLAINTS));
    }
}
initLocalStore();

// ==========================================
// ACCESSIBILITY & I18N CONTROLLER
// ==========================================

function getLanguage() {
    return localStorage.getItem(STORAGE_KEYS.language) || "en";
}

function setLanguage(lang) {
    localStorage.setItem(STORAGE_KEYS.language, lang);
    document.documentElement.lang = lang;
    applyTranslations();
}

function t(key) {
    const lang = getLanguage();
    return (I18N_DICT[lang] && I18N_DICT[lang][key]) || (I18N_DICT.en && I18N_DICT.en[key]) || key;
}

function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        const val = t(key);
        if (val) {
            if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                el.placeholder = val;
            } else {
                el.textContent = val;
            }
        }
    });

    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
        langBtn.textContent = getLanguage() === "en" ? "हिन्दी (Hindi)" : "English";
    }
}

function adjustFontSize(action) {
    let current = parseInt(localStorage.getItem(STORAGE_KEYS.fontSize) || "100", 10);
    if (action === "increase" && current < 125) current += 10;
    else if (action === "decrease" && current > 85) current -= 10;
    else if (action === "reset") current = 100;

    localStorage.setItem(STORAGE_KEYS.fontSize, current.toString());
    document.documentElement.style.fontSize = current + "%";
}

function toggleHighContrast() {
    const isDark = document.body.classList.toggle("gov-high-contrast");
    localStorage.setItem(STORAGE_KEYS.contrast, isDark ? "1" : "0");
}

function initAccessibility() {
    const savedFont = localStorage.getItem(STORAGE_KEYS.fontSize);
    if (savedFont) document.documentElement.style.fontSize = savedFont + "%";

    if (localStorage.getItem(STORAGE_KEYS.contrast) === "1") {
        document.body.classList.add("gov-high-contrast");
    }

    // Live IST Clock
    function updateClock() {
        const clockEl = document.getElementById("liveGovClock");
        if (clockEl) {
            const now = new Date();
            const dateStr = now.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
            const timeStr = now.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            });
            clockEl.textContent = `${dateStr} | ${timeStr} IST`;
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// ==========================================
// SESSION & AUTH UTILS
// ==========================================

function getSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function setSession(session) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.session);
    window.location.href = "../auth/login.html";
}

function requireAuth(expectedRole) {
    const session = getSession();
    if (!session) {
        window.location.href = "../auth/login.html";
        return null;
    }
    if (expectedRole && session.role !== expectedRole) {
        if (session.role === "CITIZEN") {
            window.location.href = "../user_portal/index.html";
        } else {
            window.location.href = "../employee_portal/index.html";
        }
        return null;
    }
    return session;
}

// Client Login API Call (with offline demo fallback)
async function apiLogin(email, password, role) {
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role })
        });
        const data = await res.json();
        if (data.success && data.session) {
            setSession(data.session);
            return data;
        }
        return data;
    } catch (err) {
        // Fallback to demo credentials
        console.warn("Backend server not reachable, using local authentication:", err);
        const user = Object.values(DEMO_USERS).find(u =>
            u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!user) return { success: false, message: "Invalid email or password." };
        if (role && user.role !== role) {
            return { success: false, message: `Unauthorized for this portal. Role required: ${role}` };
        }
        const session = {
            token: "demo-token-" + user.id,
            ...user,
            loginTime: new Date().toISOString()
        };
        setSession(session);
        return { success: true, session };
    }
}

// Client Citizen Register API Call
async function apiRegister(userData) {
    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...userData, role: "CITIZEN" })
        });
        const data = await res.json();
        if (data.success && data.session) {
            setSession(data.session);
        }
        return data;
    } catch (err) {
        console.warn("Backend register unreachable, registering locally:", err);
        const newId = "USR-2026-" + Math.floor(100 + Math.random() * 900);
        const session = {
            token: "local-token-" + newId,
            id: newId,
            name: userData.name,
            email: userData.email,
            role: "CITIZEN",
            phone: userData.phone,
            ward_no: userData.ward_no || "Ward 42 - Kalyanpur",
            city: userData.city || "Kanpur",
            state: "Uttar Pradesh",
            aadhaar_last4: userData.aadhaar_last4 || "0000",
            loginTime: new Date().toISOString()
        };
        setSession(session);
        return { success: true, message: "Registered locally.", session };
    }
}

// Client Municipal Officer Register API Call
async function apiRegisterOfficer(officerData) {
    try {
        const res = await fetch(`${API_BASE}/api/auth/register-officer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(officerData)
        });
        const data = await res.json();
        if (data.success && data.session) {
            setSession(data.session);
        }
        return data;
    } catch (err) {
        console.warn("Backend officer register unreachable, registering locally:", err);
        const newId = officerData.employee_code || ("EMP-2026-" + Math.floor(100 + Math.random() * 900));
        const session = {
            token: "local-officer-token-" + newId,
            id: newId,
            name: officerData.name,
            email: officerData.email,
            role: "EMPLOYEE",
            phone: officerData.phone || "+91 98765 00000",
            department: officerData.department || "Public Works & Roads Department (PWD)",
            designation: officerData.designation || "Municipal Nodal Officer (नगर पालिका नोडल अधिकारी)",
            ward_no: officerData.ward_no || "Zone-3 (Wards 30-45)",
            city: officerData.city || "Kanpur",
            state: "Uttar Pradesh",
            aadhaar_last4: officerData.aadhaar_last4 || "9999",
            loginTime: new Date().toISOString()
        };
        setSession(session);
        return { success: true, message: "Officer registered locally.", session };
    }
}

// ==========================================
// COMPLAINTS API CALLS (WITH SYNC & FALLBACK)
// ==========================================

async function apiFetchComplaints(params = {}) {
    try {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE}/api/complaints?${query}`);
        const data = await res.json();
        if (data.success && data.complaints) {
            localStorage.setItem(STORAGE_KEYS.complaints, JSON.stringify(data.complaints));
            return data.complaints;
        }
    } catch (e) {
        console.warn("Using local complaints cache:", e);
    }
    // Fallback
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.complaints)) || DEFAULT_FALLBACK_COMPLAINTS;
    return local.filter(c => {
        if (params.userId && c.user_id !== params.userId && c.userId !== params.userId) return false;
        if (params.status && c.status !== params.status) return false;
        if (params.category && c.category !== params.category) return false;
        return true;
    });
}

async function apiFetchComplaintDetail(id) {
    try {
        const res = await fetch(`${API_BASE}/api/complaints/${id}`);
        const data = await res.json();
        if (data.success) return data;
    } catch (e) {
        console.warn("Using local complaint detail:", e);
    }
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.complaints)) || DEFAULT_FALLBACK_COMPLAINTS;
    const c = all.find(x => x.id === id);
    return {
        success: !!c,
        complaint: c,
        history: [
            {
                action: "GRIEVANCE_LODGED",
                created_at: c ? c.created_at : "",
                remarks: "Grievance registered in system.",
                updated_by_name: c ? c.reported_by : "Citizen"
            }
        ]
    };
}

async function apiCreateComplaint(formData) {
    try {
        const res = await fetch(`${API_BASE}/api/complaints`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        if (data.success) return data;
    } catch (e) {
        console.warn("Backend unavailable, saving complaint locally:", e);
    }
    // Fallback save to local storage
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.complaints)) || DEFAULT_FALLBACK_COMPLAINTS;
    const nextNum = 1000 + all.length + 1;
    const newComplaint = {
        id: `GOV-UP-2026-${nextNum}`,
        user_id: formData.get("user_id") || "USR-2026-001",
        reported_by: formData.get("reported_by") || "Citizen",
        phone: formData.get("phone") || "+91 98765 43210",
        title: formData.get("title"),
        description: formData.get("description"),
        category: formData.get("category"),
        priority: formData.get("priority") || "Medium",
        status: "Pending",
        department: formData.get("category")?.includes("Road") ? "Public Works & Roads Department (PWD)" : "Sanitation & Solid Waste Management (Nagar Nigam)",
        ward_no: formData.get("ward_no") || "Ward 42 - Kalyanpur",
        landmark: formData.get("landmark"),
        city: "Kanpur",
        state: "Uttar Pradesh",
        pincode: "208001",
        photo_url: null,
        geo_coords: "26.4499° N, 80.3319° E",
        sla_hours: 48,
        created_at: new Date().toISOString().replace("T", " ").slice(0, 19),
        updated_at: new Date().toISOString().replace("T", " ").slice(0, 19)
    };
    all.unshift(newComplaint);
    localStorage.setItem(STORAGE_KEYS.complaints, JSON.stringify(all));
    return { success: true, message: `Grievance registered! Token: ${newComplaint.id}`, complaint: newComplaint };
}

async function apiUpdateComplaintStatus(id, updateData, photoFile) {
    try {
        let body;
        let headers = {};
        if (photoFile) {
            body = new FormData();
            Object.keys(updateData).forEach(k => body.append(k, updateData[k]));
            body.append("resolution_photo", photoFile);
        } else {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(updateData);
        }

        const res = await fetch(`${API_BASE}/api/complaints/${id}/status`, {
            method: "PATCH",
            headers,
            body
        });
        const data = await res.json();
        if (data.success) return data;
    } catch (e) {
        console.warn("Backend update error, applying locally:", e);
    }
    // Local fallback
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.complaints)) || DEFAULT_FALLBACK_COMPLAINTS;
    const idx = all.findIndex(x => x.id === id);
    if (idx !== -1) {
        Object.assign(all[idx], updateData);
        all[idx].updated_at = new Date().toISOString().replace("T", " ").slice(0, 19);
        if (updateData.status === "Resolved") {
            all[idx].resolved_at = new Date().toISOString().replace("T", " ").slice(0, 19);
        }
        localStorage.setItem(STORAGE_KEYS.complaints, JSON.stringify(all));
        return { success: true, message: `Grievance ${id} updated locally.`, complaint: all[idx] };
    }
    return { success: false, message: "Grievance not found." };
}

async function apiSubmitFeedback(id, rating, feedback, citizenName) {
    try {
        const res = await fetch(`${API_BASE}/api/complaints/${id}/feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating, feedback, citizen_name: citizenName })
        });
        return await res.json();
    } catch (e) {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.complaints)) || [];
        const idx = all.findIndex(x => x.id === id);
        if (idx !== -1) {
            all[idx].citizen_rating = rating;
            all[idx].citizen_feedback = feedback;
            localStorage.setItem(STORAGE_KEYS.complaints, JSON.stringify(all));
        }
        return { success: true, message: "Feedback saved locally." };
    }
}

// Upvote API Helper
async function apiUpvoteComplaint(id, userId, citizenName) {
    try {
        const res = await fetch(`${API_BASE}/api/complaints/${id}/upvote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, citizen_name: citizenName })
        });
        return await res.json();
    } catch (e) {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.complaints)) || [];
        const idx = all.findIndex(x => x.id === id);
        if (idx !== -1) {
            all[idx].upvotes = (all[idx].upvotes || 0) + 1;
            localStorage.setItem(STORAGE_KEYS.complaints, JSON.stringify(all));
            return { success: true, upvotes: all[idx].upvotes, message: "Upvoted locally." };
        }
        return { success: false, message: "Could not upvote grievance." };
    }
}

// Auto-Triage AI Helper
async function apiAutoTriage(title, description) {
    try {
        const res = await fetch(`${API_BASE}/api/complaints/auto-triage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description })
        });
        return await res.json();
    } catch (e) {
        // Fallback local heuristic
        const text = `${title} ${description}`.toLowerCase();
        let cat = "Roads & Potholes";
        let dept = "Public Works & Roads Department (PWD)";
        let sla = 72;
        if (/garbage|waste|sanitation|trash/.test(text)) {
            cat = "Sanitation & Solid Waste Management";
            dept = "Sanitation & Solid Waste Management (Nagar Nigam)";
            sla = 24;
        } else if (/water|leak|pipeline/.test(text)) {
            cat = "Water Supply & Pipelines";
            dept = "Jal Sansthan & Water Supply Board";
            sla = 24;
        } else if (/light|electricity|dark/.test(text)) {
            cat = "Street Lighting & Electricity";
            dept = "Street Lighting & Vidyut Vitran Nigam (DISCOM)";
            sla = 48;
        }
        return {
            success: true,
            recommendation: {
                category: cat,
                priority: /urgent|emergency|accident/.test(text) ? "Emergency" : "Medium",
                department: dept,
                sla_hours: sla,
                confidence: "92%"
            }
        };
    }
}

// Check Duplicate API Helper
async function apiCheckDuplicate(title, description, ward_no) {
    try {
        const res = await fetch(`${API_BASE}/api/complaints/check-duplicate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, ward_no })
        });
        return await res.json();
    } catch (e) {
        return { success: true, hasDuplicate: false, duplicates: [] };
    }
}

// ==========================================
// SLA TIMER & BADGE COMPUTATION
// ==========================================

function calcSlaBadge(createdAt, slaHours = 72, status = "Pending") {
    if (status === "Resolved") {
        return {
            label: "Resolved",
            labelHi: "निस्तारित",
            cls: "sla-resolved",
            isBreached: false,
            remainingHours: 0,
            text: "✅ Resolved within statutory SLA"
        };
    }

    if (status === "Rejected") {
        return {
            label: "Rejected",
            labelHi: "अस्वीकृत",
            cls: "sla-rejected",
            isBreached: false,
            remainingHours: 0,
            text: "❌ Closed / Rejected"
        };
    }

    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) {
        return {
            label: `${slaHours}h SLA`,
            cls: "sla-ok",
            isBreached: false,
            remainingHours: slaHours,
            text: `⏱️ ${slaHours}h SLA Turnaround`
        };
    }

    const deadlineTime = createdTime + (slaHours * 60 * 60 * 1000);
    const now = Date.now();
    const diffMs = deadlineTime - now;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMs <= 0) {
        const breachedBy = Math.abs(diffHours);
        return {
            label: `SLA BREACHED (-${breachedBy}h)`,
            labelHi: `समय-सीमा समाप्त (-${breachedBy} घंटे)`,
            cls: "sla-breached",
            isBreached: true,
            remainingHours: diffHours,
            text: `🚨 SLA Overdue by ${breachedBy}h (Escalated to Commissioner)`
        };
    } else if (diffHours <= 6) {
        return {
            label: `CRITICAL SLA (${diffHours}h left)`,
            labelHi: `अति आवश्यक (${diffHours} घंटे शेष)`,
            cls: "sla-critical",
            isBreached: false,
            remainingHours: diffHours,
            text: `⚠️ Urgent: Only ${diffHours}h left to comply`
        };
    } else {
        return {
            label: `${diffHours}h SLA Left`,
            labelHi: `${diffHours} घंटे शेष`,
            cls: "sla-ok",
            isBreached: false,
            remainingHours: diffHours,
            text: `⏱️ ${diffHours}h remaining in standard SLA`
        };
    }
}

// ==========================================
// SIMULATED CITIZEN SMS & WHATSAPP ALERTS
// ==========================================

function showSimulatedNotification(options) {
    const {
        title = "Gov Alert",
        message = "",
        token = "GOV-UP-2026-1001",
        channel = "sms", // "sms" or "whatsapp"
        type = "status_change"
    } = options;

    let drawer = document.getElementById("simulatedNotificationDrawer");
    if (!drawer) {
        drawer = document.createElement("div");
        drawer.id = "simulatedNotificationDrawer";
        drawer.className = "simulated-notif-drawer";
        document.body.appendChild(drawer);
    }

    const card = document.createElement("div");
    card.className = `simulated-notif-card notif-channel-${channel}`;

    const icon = channel === "whatsapp" ? "💬" : "📲";
    const sender = channel === "whatsapp" ? "SCISM WhatsApp Bot (Verified)" : "GOV-SCISM-UP (SMS Gateway)";

    card.innerHTML = `
        <div class="simulated-notif-header">
            <div class="simulated-notif-sender">
                <span>${icon}</span>
                <strong>${escapeHTML(sender)}</strong>
            </div>
            <span class="simulated-notif-time">Just Now</span>
            <button type="button" class="simulated-notif-close" onclick="this.parentElement.parentElement.remove()">✕</button>
        </div>
        <div class="simulated-notif-body">
            <p class="simulated-notif-title"><strong>${escapeHTML(title)}</strong></p>
            <p class="simulated-notif-msg">${escapeHTML(message)}</p>
            <div class="simulated-notif-token-tag">🎫 Token: <strong>${escapeHTML(token)}</strong></div>
        </div>
    `;

    drawer.prepend(card);

    // Auto dismiss after 7 seconds
    setTimeout(() => {
        if (card.parentElement) {
            card.classList.add("notif-slide-out");
            setTimeout(() => card.remove(), 400);
        }
    }, 7500);
}

// ==========================================
// UI HELPERS & TOASTS
// ==========================================

function getStatusBadge(status) {
    const s = status || "Pending";
    let cls = "status-pending";
    let icon = "⏳";
    let textHi = "लंबित";

    if (s === "Under Review") {
        cls = "status-review";
        icon = "🔍";
        textHi = "समीक्षाधीन";
    } else if (s === "In Progress") {
        cls = "status-progress";
        icon = "⚙️";
        textHi = "प्रगति पर";
    } else if (s === "Resolved") {
        cls = "status-resolved";
        icon = "✅";
        textHi = "निस्तारित";
    } else if (s === "Rejected") {
        cls = "status-rejected";
        icon = "❌";
        textHi = "अस्वीकृत";
    }

    const lang = getLanguage();
    const display = lang === "hi" ? `${icon} ${textHi}` : `${icon} ${s}`;
    return `<span class="gov-badge ${cls}">${escapeHTML(display)}</span>`;
}

function getPriorityBadge(priority) {
    const p = priority || "Medium";
    let cls = "priority-medium";
    if (p === "High") cls = "priority-high";
    else if (p === "Emergency") cls = "priority-emergency";
    else if (p === "Low") cls = "priority-low";
    return `<span class="gov-priority-tag ${cls}">${escapeHTML(p)} Priority</span>`;
}

function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-msg toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span><span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-out");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Document Ready Initialization
document.addEventListener("DOMContentLoaded", () => {
    initAccessibility();
    applyTranslations();

    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
        langBtn.addEventListener("click", () => {
            const nextLang = getLanguage() === "en" ? "hi" : "en";
            setLanguage(nextLang);
        });
    }

    const fontIncrease = document.getElementById("fontIncreaseBtn");
    const fontDecrease = document.getElementById("fontDecreaseBtn");
    const fontReset = document.getElementById("fontResetBtn");
    if (fontIncrease) fontIncrease.addEventListener("click", () => adjustFontSize("increase"));
    if (fontDecrease) fontDecrease.addEventListener("click", () => adjustFontSize("decrease"));
    if (fontReset) fontReset.addEventListener("click", () => adjustFontSize("reset"));

    const contrastBtn = document.getElementById("contrastToggleBtn");
    if (contrastBtn) contrastBtn.addEventListener("click", toggleHighContrast);
});
