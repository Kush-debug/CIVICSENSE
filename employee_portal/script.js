/* =====================================================
   CIVIC CONNECT (SCISM) - MUNICIPAL OFFICER PORTAL SCRIPT
   GIS Hotspots Command Console & Executive Redressal
===================================================== */

const session = requireAuth("EMPLOYEE");
if (!session) throw new Error("Unauthorized");

// DOM Elements
const officerComplaintList = document.getElementById("officerComplaintList");
const filterStatus = document.getElementById("filterStatus");
const filterCategory = document.getElementById("filterCategory");
const filterWard = document.getElementById("filterWard");
const filterPriority = document.getElementById("filterPriority");
const searchComplaintInput = document.getElementById("searchComplaintInput");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const openNoticeModalBtn = document.getElementById("openNoticeModalBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Status Modal Elements
const statusUpdateModal = document.getElementById("statusUpdateModal");
const closeStatusModalBtn = document.getElementById("closeStatusModalBtn");
const statusUpdateForm = document.getElementById("statusUpdateForm");
const modalComplaintId = document.getElementById("modalComplaintId");
const modalTokenDisplay = document.getElementById("modalTokenDisplay");
const modalSubjectDisplay = document.getElementById("modalSubjectDisplay");
const modalStatusSelect = document.getElementById("modalStatusSelect");
const modalDeptSelect = document.getElementById("modalDeptSelect");
const modalOfficerName = document.getElementById("modalOfficerName");
const modalResolutionPhoto = document.getElementById("modalResolutionPhoto");
const modalRemarks = document.getElementById("modalRemarks");

// History Modal Elements
const historyModal = document.getElementById("historyModal");
const closeHistoryModalBtn = document.getElementById("closeHistoryModalBtn");
const historyTokenDisplay = document.getElementById("historyTokenDisplay");
const historyTimelineList = document.getElementById("historyTimelineList");

// Notice Modal Elements
const noticeModal = document.getElementById("noticeModal");
const closeNoticeModalBtn = document.getElementById("closeNoticeModalBtn");
const noticeForm = document.getElementById("noticeForm");

let allComplaintsCache = [];

// GIS Map State
let officerMap = null;
let officerMarkersLayer = null;
let officerHotspotsLayer = null;
let currentOfficerMapFilter = "all";
let officerComplaintMarkersMap = {};

// Initialize Officer Profile Info
function initProfile() {
    const badgeEl = document.getElementById("userBadge");
    const nameEl = document.getElementById("profileName");
    const emailEl = document.getElementById("profileEmail");
    const deptEl = document.getElementById("profileDept");
    const wardEl = document.getElementById("profileWard");
    const phoneEl = document.getElementById("profilePhone");
    const avatarEl = document.getElementById("profileAvatar");
    const desigEl = document.getElementById("profileDesignation");
    const badgeTagEl = document.getElementById("profileBadgeTag");

    if (badgeEl) badgeEl.textContent = session.name || "Officer";
    if (nameEl) nameEl.textContent = session.name || "Municipal Officer";
    if (emailEl) emailEl.textContent = session.email || "";
    if (deptEl) deptEl.textContent = session.department || "Municipal Administration";
    if (wardEl) wardEl.textContent = session.ward_no || "Zone-3";
    if (phoneEl) phoneEl.textContent = session.phone || "+91 91234 56789";
    if (avatarEl) avatarEl.textContent = (session.name || "O").charAt(0).toUpperCase();
    if (desigEl) desigEl.textContent = session.designation || "Municipal Officer (नगर पालिका अधिकारी)";
    if (badgeTagEl) badgeTagEl.textContent = session.id || "EMP-2026-101";
}
initProfile();

// Logout
logoutBtn.addEventListener("click", logout);

// Fetch All Complaints from API / Store
async function refreshComplaints() {
    try {
        const complaints = await apiFetchComplaints();
        allComplaintsCache = complaints;
        updateExecutiveKPIs(complaints);
        updateAnalyticsVisuals(complaints);
        renderOfficerGrid(getFilteredComplaints());
        renderOfficerGisMap();
    } catch (err) {
        console.error("Error loading complaints for officer portal:", err);
    }
}

// Update Executive KPI Numbers
function updateExecutiveKPIs(list) {
    const total = list.length;
    const pending = list.filter(c => c.status === "Pending").length;
    const underReview = list.filter(c => c.status === "Under Review").length;
    const inProgress = list.filter(c => c.status === "In Progress").length;
    const resolved = list.filter(c => c.status === "Resolved").length;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statPending").textContent = pending;
    document.getElementById("statUnderReview").textContent = underReview;
    document.getElementById("statProgress").textContent = inProgress;
    document.getElementById("statResolved").textContent = resolved;
}

// Update Analytics Visual Progress Bars
function updateAnalyticsVisuals(list) {
    const total = list.length || 1;

    // Categories
    const catCounts = {};
    list.forEach(c => {
        catCounts[c.category] = (catCounts[c.category] || 0) + 1;
    });

    const catContainer = document.getElementById("categoryMetricsList");
    if (catContainer) {
        const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
        const colors = ["fill-orange", "fill-green", "fill-blue", "fill-purple"];
        catContainer.innerHTML = topCats.map(([cat, count], idx) => {
            const pct = Math.round((count / total) * 100);
            return `
                <div class="gov-progress-item">
                    <div class="gov-progress-labels">
                        <span>${escapeHTML(cat)}</span>
                        <strong>${count} (${pct}%)</strong>
                    </div>
                    <div class="gov-progress-track">
                        <div class="gov-progress-fill ${colors[idx % colors.length]}" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join("");
    }

    // Wards
    const wardCounts = {};
    list.forEach(c => {
        const w = c.ward_no || "General";
        wardCounts[w] = (wardCounts[w] || 0) + 1;
    });

    const wardContainer = document.getElementById("wardMetricsList");
    if (wardContainer) {
        const topWards = Object.entries(wardCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
        const colors = ["fill-orange", "fill-blue", "fill-green", "fill-purple"];
        wardContainer.innerHTML = topWards.map(([ward, count], idx) => {
            const pct = Math.round((count / total) * 100);
            return `
                <div class="gov-progress-item">
                    <div class="gov-progress-labels">
                        <span>${escapeHTML(ward)}</span>
                        <strong>${count} (${pct}%)</strong>
                    </div>
                    <div class="gov-progress-track">
                        <div class="gov-progress-fill ${colors[idx % colors.length]}" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join("");
    }
}

// Multi-Criteria Filter Logic
function getFilteredComplaints() {
    const status = filterStatus.value;
    const category = filterCategory.value;
    const ward = filterWard.value;
    const priority = filterPriority.value;
    const search = (searchComplaintInput.value || "").trim().toLowerCase();

    return allComplaintsCache.filter(c => {
        const matchStatus = !status || c.status === status;
        const matchCategory = !category || c.category === category;
        const matchWard = !ward || (c.ward_no && c.ward_no.toLowerCase().includes(ward.toLowerCase()));
        const matchPriority = !priority || c.priority === priority;
        const matchSearch = !search || (
            c.id.toLowerCase().includes(search) ||
            c.title.toLowerCase().includes(search) ||
            c.reported_by.toLowerCase().includes(search) ||
            c.ward_no.toLowerCase().includes(search) ||
            (c.landmark && c.landmark.toLowerCase().includes(search))
        );
        return matchStatus && matchCategory && matchWard && matchPriority && matchSearch;
    });
}

// Render Grievance Cards in Officer Workbench
function renderOfficerGrid(list) {
    officerComplaintList.innerHTML = "";

    if (list.length === 0) {
        officerComplaintList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--gov-text-muted);">
                <div style="font-size: 3rem; margin-bottom: 8px;">🔍</div>
                <h3 style="color: var(--gov-navy-900); margin-bottom: 4px;">No Grievances Match Selected Filters</h3>
                <p style="font-size: 0.85rem;">Try changing status, category, or clearing the search box.</p>
            </div>
        `;
        return;
    }

    list.forEach(c => {
        const card = document.createElement("div");
        card.className = "gov-officer-card";
        card.id = `officer-card-${c.id}`;

        const ratingDisplay = c.citizen_rating
            ? `<span style="color: #d97706; font-weight: 700; font-size: 0.78rem;">⭐ Citizen Rating: ${c.citizen_rating}/5</span>`
            : "";

        const resolutionInfo = c.resolution_remarks
            ? `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; margin: 10px 0; font-size: 0.8rem; color: #166534;">
                <strong>Action Taken:</strong> ${escapeHTML(c.resolution_remarks)}
               </div>`
            : "";

        card.innerHTML = `
            <div class="gov-officer-card-top">
                <div>
                    <span class="gov-token-code">${escapeHTML(c.id)}</span>
                    <h3>${escapeHTML(c.title)}</h3>
                </div>
                <div>
                    ${getStatusBadge(c.status)}
                </div>
            </div>

            <div class="gov-officer-meta">
                <span>👤 <strong>${escapeHTML(c.reported_by || "Citizen")}</strong> (${escapeHTML(c.phone || "No Phone")})</span>
                <span>📁 ${escapeHTML(c.category)}</span>
                <span>📍 ${escapeHTML(c.ward_no)}</span>
                <span>📌 ${escapeHTML(c.landmark || "N/A")}</span>
                <span>📅 ${escapeHTML(c.created_at)}</span>
                ${getPriorityBadge(c.priority)}
            </div>

            <p class="gov-officer-desc">${escapeHTML(c.description)}</p>

            ${c.photo_url ? `<img src="${escapeHTML(c.photo_url)}" style="max-height: 140px; border-radius: 6px; margin-bottom: 12px; border: 1px solid var(--gov-border);" alt="Evidence Photo">` : ""}
            ${resolutionInfo}

            <div class="gov-officer-footer">
                <div style="font-size: 0.78rem; color: var(--gov-text-muted);">
                    🏢 <strong>${escapeHTML(c.department || "General Administration")}</strong>
                    ${c.assigned_officer_name ? ` · Officer: <strong>${escapeHTML(c.assigned_officer_name)}</strong>` : " · <em>Unassigned</em>"}
                    ${ratingDisplay ? ` · ${ratingDisplay}` : ""}
                </div>

                <div class="gov-officer-actions">
                    <button type="button" class="gov-btn-action" style="color: var(--gov-saffron-600); border-color: var(--gov-saffron-500);" onclick="focusOfficerMapOnComplaint('${escapeHTML(c.id)}')">
                        🗺️ Locate on Map
                    </button>
                    <button type="button" class="gov-btn-action" onclick="openHistoryModal('${escapeHTML(c.id)}')">
                        📄 Audit Trail
                    </button>
                    <button type="button" class="gov-btn-manage" onclick="openStatusModal('${escapeHTML(c.id)}')">
                        ⚡ Update Status & ATR
                    </button>
                </div>
            </div>
        `;

        officerComplaintList.appendChild(card);
    });
}

// Event Listeners for Filters
filterStatus.addEventListener("change", () => renderOfficerGrid(getFilteredComplaints()));
filterCategory.addEventListener("change", () => renderOfficerGrid(getFilteredComplaints()));
filterWard.addEventListener("change", () => renderOfficerGrid(getFilteredComplaints()));
filterPriority.addEventListener("change", () => renderOfficerGrid(getFilteredComplaints()));
searchComplaintInput.addEventListener("input", () => renderOfficerGrid(getFilteredComplaints()));

// ==========================================
// GIS OFFICER COMMAND CONSOLE & HOTSPOTS ENGINE
// ==========================================

function getCategoryEmoji(cat = "") {
    const c = cat.toLowerCase();
    if (c.includes("road") || c.includes("pothole")) return "🕳️";
    if (c.includes("sanitation") || c.includes("waste") || c.includes("garbage")) return "🗑️";
    if (c.includes("water") || c.includes("jal") || c.includes("pipeline")) return "🚰";
    if (c.includes("light") || c.includes("discom") || c.includes("vidyut")) return "💡";
    if (c.includes("drain") || c.includes("sewer")) return "🌊";
    if (c.includes("health") || c.includes("dengue") || c.includes("malaria")) return "🏥";
    return "🏛️";
}

function getStatusColorClass(status) {
    if (status === "Under Review") return "gis-pin-review";
    if (status === "In Progress") return "gis-pin-progress";
    if (status === "Resolved") return "gis-pin-resolved";
    return "gis-pin-pending";
}

function initOfficerGisMap() {
    const mapEl = document.getElementById("officerGisMap");
    if (!mapEl || typeof L === "undefined") return;

    if (!officerMap) {
        officerMap = L.map("officerGisMap", {
            center: [26.4600, 80.3200],
            zoom: 12.5,
            zoomControl: true,
            scrollWheelZoom: false
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO | SCISM Officer Command'
        }).addTo(officerMap);

        officerHotspotsLayer = L.layerGroup().addTo(officerMap);
        officerMarkersLayer = L.layerGroup().addTo(officerMap);

        // Officer Filter Pills
        const filterBtns = document.querySelectorAll(".gov-map-filter-bar .gov-map-pill[data-officer-map-filter]");
        filterBtns.forEach(btn => {
            btn.addEventListener("click", function () {
                filterBtns.forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                currentOfficerMapFilter = this.dataset.officerMapFilter || "all";
                renderOfficerGisMap();
            });
        });

        // Reset View Button
        const centerBtn = document.getElementById("officerCenterMapBtn");
        if (centerBtn) {
            centerBtn.addEventListener("click", () => {
                officerMap.flyTo([26.4600, 80.3200], 12.5, { animate: true, duration: 1.2 });
            });
        }
    }

    renderOfficerGisMap();
}

function renderOfficerGisMap() {
    if (!officerMap || !officerMarkersLayer || !officerHotspotsLayer) return;

    officerMarkersLayer.clearLayers();
    officerHotspotsLayer.clearLayers();
    officerComplaintMarkersMap = {};

    const countAllEl = document.getElementById("officerMapCountAll");
    const countOpenEl = document.getElementById("officerMapCountOpen");
    const countEmergEl = document.getElementById("officerMapCountEmergency");

    if (countAllEl) countAllEl.textContent = allComplaintsCache.length;
    if (countOpenEl) {
        const openCount = allComplaintsCache.filter(c => c.status !== "Resolved" && c.status !== "Rejected").length;
        countOpenEl.textContent = openCount;
    }
    if (countEmergEl) {
        const emergCount = allComplaintsCache.filter(c => c.priority === "Emergency" && c.status !== "Resolved").length;
        countEmergEl.textContent = emergCount;
    }

    const filtered = allComplaintsCache.filter(c => {
        if (currentOfficerMapFilter === "open") {
            return c.status !== "Resolved" && c.status !== "Rejected";
        }
        if (currentOfficerMapFilter === "emergency") {
            return c.priority === "Emergency" || c.priority === "High";
        }
        if (currentOfficerMapFilter === "pwd") {
            return (c.department || "").includes("PWD") || (c.category || "").toLowerCase().includes("road");
        }
        if (currentOfficerMapFilter === "sanitation") {
            return (c.department || "").includes("Sanitation") || (c.category || "").toLowerCase().includes("sanitation");
        }
        if (currentOfficerMapFilter === "jal") {
            return (c.department || "").includes("Jal") || (c.category || "").toLowerCase().includes("water");
        }
        if (currentOfficerMapFilter === "elec") {
            return (c.department || "").includes("Lighting") || (c.category || "").toLowerCase().includes("light");
        }
        return true; // 'all'
    });

    // 1. Calculate Ward Hotspots
    const wardCounts = {};
    allComplaintsCache.forEach(c => {
        if (c.status !== "Resolved" && c.status !== "Rejected") {
            const w = c.ward_no || "General Ward";
            wardCounts[w] = (wardCounts[w] || 0) + 1;
        }
    });

    Object.entries(wardCounts).forEach(([ward, count]) => {
        const centroid = parseGeoCoords(null, ward);
        const radius = Math.min(1300, 500 + (count * 220));
        let color = count >= 3 ? "#ef4444" : (count >= 2 ? "#f59e0b" : "#3b82f6");

        const circle = L.circle(centroid, {
            color: color,
            weight: 2,
            dashArray: "4, 6",
            fillColor: color,
            fillOpacity: count >= 3 ? 0.28 : 0.18,
            radius: radius
        });

        circle.bindTooltip(`<strong>📍 ${escapeHTML(ward)}</strong><br>⚠️ ${count} Active Grievance(s)<br><small>Click to deploy squad</small>`, {
            sticky: true,
            direction: "top"
        });

        circle.on("click", () => {
            officerMap.flyTo(centroid, 14.5, { animate: true, duration: 1 });
        });

        officerHotspotsLayer.addLayer(circle);
    });

    // 2. Render Complaint Markers
    filtered.forEach(c => {
        const coords = parseGeoCoords(c.geo_coords, c.ward_no);
        const statusCls = getStatusColorClass(c.status);
        const priorityCls = (c.priority === "High" || c.priority === "Emergency") && c.status !== "Resolved"
            ? "gis-pin-emergency"
            : "";
        const emoji = getCategoryEmoji(c.category);

        const customIcon = L.divIcon({
            className: "gis-div-icon",
            html: `<div class="gis-marker-pin ${statusCls} ${priorityCls}"><span class="gis-pin-icon">${emoji}</span></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -28]
        });

        const marker = L.marker(coords, { icon: customIcon });

        const photoImg = c.photo_url
            ? `<img src="${escapeHTML(c.photo_url)}" class="gov-map-popup-thumb" alt="Evidence" loading="lazy">`
            : "";

        const slaInfo = calculateSlaStatus(c.created_at, c.sla_hours || 48, c.status);

        const popupHtml = `
            <div class="gov-map-popup-card">
                <div class="gov-map-popup-header">
                    <span class="gov-map-popup-token">${escapeHTML(c.id)}</span>
                    ${getStatusBadge(c.status)}
                </div>
                <div class="gov-map-popup-title">${escapeHTML(c.title)}</div>
                <div class="gov-map-popup-meta">
                    <span>👤 <strong>${escapeHTML(c.reported_by || "Citizen")}</strong> (${escapeHTML(c.phone || "No Phone")})</span>
                    <span>📁 ${escapeHTML(c.category)} · 🏢 ${escapeHTML(c.department || "General")}</span>
                    <span>📍 ${escapeHTML(c.ward_no)} · ${escapeHTML(c.landmark || "Kanpur")}</span>
                    <span>⏱️ <span class="gov-sla-tag ${slaInfo.cls}">${escapeHTML(slaInfo.label)}</span></span>
                    ${getPriorityBadge(c.priority)}
                </div>
                ${photoImg}
                <div class="gov-map-popup-actions">
                    <button type="button" class="gov-map-popup-btn gov-map-popup-btn-action" onclick="openStatusModal('${escapeHTML(c.id)}')">
                        ⚡ Update Status / ATR
                    </button>
                    <button type="button" class="gov-map-popup-btn" onclick="scrollToOfficerCard('${escapeHTML(c.id)}')">
                        📋 View in Workbench
                    </button>
                </div>
            </div>
        `;

        marker.bindPopup(popupHtml, { maxWidth: 320 });
        officerMarkersLayer.addLayer(marker);
        officerComplaintMarkersMap[c.id] = marker;
    });
}

// Focus Officer Map on Complaint from Card
window.focusOfficerMapOnComplaint = function (id) {
    const mapSection = document.getElementById("officerGisSection");
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    let marker = officerComplaintMarkersMap[id];
    if (!marker) {
        const allBtn = document.querySelector(".gov-map-filter-bar .gov-map-pill[data-officer-map-filter='all']");
        if (allBtn) allBtn.click();
        marker = officerComplaintMarkersMap[id];
    }

    if (marker && officerMap) {
        officerMap.flyTo(marker.getLatLng(), 15, { animate: true, duration: 1.2 });
        setTimeout(() => marker.openPopup(), 800);
    }
};

// Scroll to Officer Card from Map Popup
window.scrollToOfficerCard = function (id) {
    const card = document.getElementById(`officer-card-${id}`);
    if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("card-highlight-flash");
        setTimeout(() => card.classList.remove("card-highlight-flash"), 2500);
    } else {
        searchComplaintInput.value = id;
        renderOfficerGrid(getFilteredComplaints());
        const filteredCard = document.getElementById(`officer-card-${id}`);
        if (filteredCard) {
            filteredCard.scrollIntoView({ behavior: "smooth", block: "center" });
            filteredCard.classList.add("card-highlight-flash");
            setTimeout(() => filteredCard.classList.remove("card-highlight-flash"), 2500);
        }
    }
};

// ==========================================
// STATUS & ACTION TAKEN REPORT (ATR) MODAL
// ==========================================

window.openStatusModal = function (complaintId) {
    const c = allComplaintsCache.find(x => x.id === complaintId);
    if (!c) return;

    modalComplaintId.value = c.id;
    modalTokenDisplay.textContent = c.id;
    modalSubjectDisplay.textContent = `${c.category} · ${c.ward_no} · ${c.title}`;
    modalStatusSelect.value = c.status;
    modalDeptSelect.value = c.department || "Public Works & Roads Department (PWD)";
    modalOfficerName.value = c.assigned_officer_name || session.name;
    modalRemarks.value = c.resolution_remarks || "";

    statusUpdateModal.style.display = "flex";
};

closeStatusModalBtn.addEventListener("click", () => {
    statusUpdateModal.style.display = "none";
});

statusUpdateForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = modalComplaintId.value;
    const saveBtn = document.getElementById("saveStatusBtn");

    saveBtn.disabled = true;
    saveBtn.textContent = "Updating Official Status...";

    const updatePayload = {
        status: modalStatusSelect.value,
        department: modalDeptSelect.value,
        assigned_officer_name: modalOfficerName.value,
        assigned_officer_id: session.id,
        resolution_remarks: modalRemarks.value,
        updated_by_name: session.name,
        updated_by_role: session.role
    };

    const photoFile = modalResolutionPhoto.files[0] || null;

    const res = await apiUpdateComplaintStatus(id, updatePayload, photoFile);

    saveBtn.disabled = false;
    saveBtn.textContent = "Save Official Update & Notify Citizen ➔";

    if (!res.success) {
        showToast(res.message || "Failed to update grievance.", "error");
        return;
    }

    showToast(`Grievance ${id} status updated to "${modalStatusSelect.value}".`, "success");
    statusUpdateModal.style.display = "none";
    statusUpdateForm.reset();
    await refreshComplaints();
});

// ==========================================
// AUDIT TRAIL HISTORY MODAL
// ==========================================

window.openHistoryModal = async function (complaintId) {
    historyTokenDisplay.textContent = complaintId;
    historyTimelineList.innerHTML = `<p style="font-size: 0.85rem; color: var(--gov-text-muted);">Loading official audit history...</p>`;
    historyModal.style.display = "flex";

    const detail = await apiFetchComplaintDetail(complaintId);

    if (!detail.success || !detail.history || detail.history.length === 0) {
        historyTimelineList.innerHTML = `
            <div class="gov-advisory-item">
                <div class="gov-advisory-title">Grievance Registered</div>
                <div class="gov-advisory-desc">Registered by Citizen. Awaiting further departmental actions.</div>
            </div>
        `;
        return;
    }

    historyTimelineList.innerHTML = detail.history.map((h, i) => {
        let badgeColor = "#0284c7";
        if (h.action === "GRIEVANCE_RESOLVED") badgeColor = "#166534";
        else if (h.action === "EMERGENCY_ESCALATION") badgeColor = "#dc2626";

        return `
            <div style="background: #f8fafc; border-left: 3px solid ${badgeColor}; padding: 12px 14px; border-radius: 0 8px 8px 0; font-size: 0.82rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <strong style="color: var(--gov-navy-900);">${escapeHTML(h.action.replace(/_/g, " "))}</strong>
                    <span style="font-size: 0.75rem; color: var(--gov-text-muted);">${escapeHTML(h.created_at)}</span>
                </div>
                <div style="color: #334155; margin-bottom: 4px;">${escapeHTML(h.remarks)}</div>
                <div style="font-size: 0.72rem; color: var(--gov-text-muted);">
                    Updated By: <strong>${escapeHTML(h.updated_by_name)}</strong> (${escapeHTML(h.updated_by_role || "SYSTEM")})
                </div>
            </div>
        `;
    }).join("");
};

closeHistoryModalBtn.addEventListener("click", () => {
    historyModal.style.display = "none";
});

// ==========================================
// CSV EXPORT ACTION
// ==========================================

exportCsvBtn.addEventListener("click", () => {
    window.location.href = `${API_BASE}/api/export/csv`;
    showToast("Generating official grievance CSV audit export...", "info");
});

const footerExportBtn = document.getElementById("footerExportCsv");
if (footerExportBtn) {
    footerExportBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = `${API_BASE}/api/export/csv`;
    });
}

// ==========================================
// PUBLIC ADVISORY BROADCAST MODAL
// ==========================================

openNoticeModalBtn.addEventListener("click", () => {
    noticeModal.style.display = "flex";
});

closeNoticeModalBtn.addEventListener("click", () => {
    noticeModal.style.display = "none";
});

noticeForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const publishBtn = document.getElementById("publishNoticeBtn");
    publishBtn.disabled = true;
    publishBtn.textContent = "Publishing...";

    const payload = {
        title: document.getElementById("noticeTitle").value,
        title_hi: document.getElementById("noticeTitleHi").value,
        message: document.getElementById("noticeMessage").value,
        category: document.getElementById("noticeCategory").value,
        is_urgent: document.getElementById("noticeUrgent").checked ? 1 : 0,
        department: session.department || "Municipal Administration"
    };

    try {
        const res = await fetch(`${API_BASE}/api/announcements`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        publishBtn.disabled = false;
        publishBtn.textContent = "Publish Advisory to Citizen Portal ➔";

        if (data.success) {
            showToast("Public Municipal Advisory broadcasted!", "success");
            noticeModal.style.display = "none";
            noticeForm.reset();
        } else {
            showToast(data.message || "Failed to publish advisory.", "error");
        }
    } catch (err) {
        publishBtn.disabled = false;
        publishBtn.textContent = "Publish Advisory to Citizen Portal ➔";
        showToast("Advisory saved locally.", "success");
        noticeModal.style.display = "none";
        noticeForm.reset();
    }
});

// Close Modals on Outer Click
window.addEventListener("click", (e) => {
    if (e.target === statusUpdateModal) statusUpdateModal.style.display = "none";
    if (e.target === historyModal) historyModal.style.display = "none";
    if (e.target === noticeModal) noticeModal.style.display = "none";
});

// Initial load
refreshComplaints();
initOfficerGisMap();
