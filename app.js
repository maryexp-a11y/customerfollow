/* 
   ========================================================================
   LOGIC NGHIỆP VỤ & QUẢN LÝ DỮ LIỆU CRM ROSE GOLD (100% TIẾNG VIỆT)
   ========================================================================
   Tích hợp lưu trữ IndexedDB, LocalStorage, Lịch biểu, Lễ hội, Excel & Gửi mail
*/

// Trạng thái ứng dụng toàn cục
let appState = {
    customers: [],
    activeTab: 'dashboard',
    selectedCustomerId: null,
    currentCalendarDate: new Date(),
    db: null // Đối tượng database IndexedDB
};

// Cấu hình các Quốc gia và Ngày lễ lớn phục vụ tính năng Lễ hội chúc mừng
const HOLIDAY_DATABASE = {
    "Việt Nam": [
        { date: "01-01", name: "Tết Dương Lịch", greeting: "Chúc bạn một năm mới an khang thịnh vượng, vạn sự như ý!" },
        { date: "30-04", name: "Ngày Giải Phóng Miền Nam", greeting: "Chúc mừng ngày đại lễ thống nhất đất nước!" },
        { date: "01-05", name: "Ngày Quốc Tế Lao Động", greeting: "Chúc bạn có một kỳ nghỉ lễ thật ấm áp bên gia đình!" },
        { date: "02-09", name: "Ngày Quốc Khánh Việt Nam", greeting: "Chúc bạn ngày lễ Quốc Khánh ngập tràn niềm vui và hạnh phúc!" }
    ],
    "Mỹ": [
        { date: "07-04", name: "Ngày Độc Lập Mỹ (Independence Day)", greeting: "Happy Independence Day! Wishing you a wonderful celebration with your family!" },
        { date: "11-26", name: "Lễ Tạ Ơn (Thanksgiving)", greeting: "Happy Thanksgiving! Extremely grateful for our partnership. Wishing you joy and harvest!" },
        { date: "12-25", name: "Lễ Giáng Sinh (Christmas)", greeting: "Merry Christmas! May your holiday season be filled with warmth, love, and success!" }
    ],
    "Nhật Bản": [
        { date: "01-01", name: "Tết Nguyên Đán Nhật Bản (Gantan)", greeting: "A Happy New Year! (謹賀新年) Wishing you prosperity and good health in this new year!" },
        { date: "05-05", name: "Ngày Trẻ Em (Kodomo no Hi)", greeting: "Happy Children's Day! Wishing you a peaceful and joyful season!" },
        { date: "11-23", name: "Ngày Tạ Ơn Lao Động (Kinro Kansha no Hi)", greeting: "Thank you for your hard work and great partnership! Happy Labor Thanksgiving Day!" }
    ],
    "Hàn Quốc": [
        { date: "08-15", name: "Ngày Quang Phục Hàn Quốc (Gwangbokjeol)", greeting: "Happy Liberation Day of Korea! (광복절 축하드립니다) Wishing you success!" },
        { date: "10-03", name: "Ngày Quốc Khánh Hàn Quốc (Gaecheonjeol)", greeting: "Happy National Foundation Day of Korea! Wishing you prosperity!" },
        { date: "12-25", name: "Lễ Giáng Sinh (Christmas)", greeting: "Merry Christmas! (성탄절 축하드립니다) May your holiday be warm and bright!" }
    ]
};

// Danh sách Email Template có sẵn
const EMAIL_TEMPLATES = [
    {
        id: "intro",
        name: "Giới thiệu & Chào mừng khách mới",
        subject: "Thư chào mừng từ [Tên công ty của bạn] - Trân trọng cảm ơn [Tên khách hàng]",
        body: `Kính gửi Anh/Chị {TenKhachHang},\n\nEm là đại diện từ công ty. Lời đầu tiên, em xin gửi lời chào trân trọng và lời chúc sức khỏe tốt đẹp nhất tới Anh/Chị và Quý công ty {TenCongTy}.\n\nChúng em rất vinh hạnh khi có cơ hội được kết nối và giới thiệu các dòng sản phẩm chất lượng cao của chúng em tới Quý khách hàng. Dưới đây em xin đính kèm catalog và bảng báo giá cơ bản để Anh/Chị tham khảo.\n\nNếu cần thêm thông tin hoặc hỗ trợ gì, Anh/Chị cứ phản hồi cho em nhé!\n\nTrân trọng,\n[Tên của bạn]\n[Số điện thoại]`
    },
    {
        id: "quotation",
        name: "Gửi báo giá sản phẩm",
        subject: "Báo giá sản phẩm theo yêu cầu - Khách hàng {TenKhachHang} - {TenCongTy}",
        body: `Kính gửi Anh/Chị {TenKhachHang},\n\nEm xin gửi bảng báo giá chi tiết cho các sản phẩm/dịch vụ mà chúng ta đã thảo luận. \n\nChúng em luôn cam kết mang tới chất lượng sản phẩm tốt nhất cùng chính sách hậu mãi và ưu đãi tốt nhất dành cho đối tác {TenCongTy}.\n\n(Các file báo giá chi tiết em đã lưu trữ trên hồ sơ tài liệu khách hàng để tiện đối chiếu).\n\nAnh/Chị xem qua và cho em xin phản hồi về số lượng cũng như thời gian giao nhận dự kiến để em lên hợp đồng nhé!\n\nTrân trọng,\n[Tên của bạn]`
    },
    {
        id: "sample",
        name: "Thông báo gửi sản phẩm mẫu",
        subject: "Xác nhận gửi mẫu thử sản phẩm - Khách hàng {TenKhachHang} - {TenCongTy}",
        body: `Kính gửi Anh/Chị {TenKhachHang},\n\nEm xin thông báo mẫu thử sản phẩm của chúng em đã được gửi đi thông qua đơn vị vận chuyển. Dự kiến Anh/Chị sẽ nhận được mẫu thử này trong vòng 2-3 ngày tới.\n\nMã vận đơn giao hàng: [Nhập mã vận đơn]\n\nRất mong sản phẩm mẫu này sẽ đáp ứng được đầy đủ các tiêu chuẩn kỹ thuật khắt khe của Quý công ty {TenCongTy}. Khi nhận được mẫu, Anh/Chị có thể kiểm tra thực tế và phản hồi cảm nhận cho em nhé.\n\nTrân trọng,\n[Tên của bạn]`
    },
    {
        id: "birthday",
        name: "Chúc mừng sinh nhật khách hàng",
        subject: "Chúc mừng sinh nhật Anh/Chị {TenKhachHang}! - Trân trọng từ [Công ty của bạn]",
        body: `Kính gửi Anh/Chị {TenKhachHang},\n\nNhân dịp sinh nhật của Anh/Chị, tập thể công ty chúng em xin gửi tới Anh/Chị lời chúc mừng chân thành và nồng nhiệt nhất!\n\nChúc Anh/Chị tuổi mới luôn tràn đầy sức khỏe, hạnh phúc vững bền và gặt hái thêm nhiều thành công rực rỡ trong cả sự nghiệp lẫn cuộc sống. \n\nCảm ơn Anh/Chị đã luôn là đối tác tin cậy, đồng hành cùng sự phát triển của chúng em trong thời gian qua.\n\nTrân trọng,\n[Tên của bạn]`
    },
    {
        id: "holiday",
        name: "Chúc mừng ngày lễ quốc gia",
        subject: "Chúc mừng ngày lễ {TenNgayLe} - Trân trọng gửi tới Anh/Chị {TenKhachHang}",
        body: `Kính gửi Anh/Chị {TenKhachHang},\n\nNhân ngày lễ {TenNgayLe} đầy ý nghĩa tại {QuocGia},\n\nChúng em xin gửi lời chúc tốt đẹp nhất đến Anh/Chị, Quý gia đình và toàn thể cán bộ nhân viên công ty {TenCongTy} một kỳ nghỉ lễ thật ấm áp, vui tươi và tràn đầy năng lượng tích cực.\n\nChúc cho sự hợp tác tốt đẹp giữa hai bên chúng ta ngày càng bền chặt và gặt hái được nhiều thành công hơn nữa!\n\nTrân trọng,\n[Tên của bạn]`
    }
];

// Dữ liệu khách hàng mẫu tiếng Việt ban đầu
const MOCK_CUSTOMERS = [
    {
        id: "c-001",
        name: "Nguyễn Minh Anh",
        company: "Tập Đoàn Hùng Phát",
        phone: "0912345678",
        email: "minhanh.nguyen@hungphat.com",
        source: "Facebook",
        status: "Khách hàng Mới",
        priority: "Cao",
        birthday: "1990-06-15",
        country: "Việt Nam",
        dealValue: 120000000,
        dealStage: "Soạn thảo",
        lastInteraction: "2026-05-20",
        nextFollowUpDate: "2026-05-25",
        nextFollowUpType: "Call",
        notes: "Khách hàng muốn tham khảo dòng sản phẩm gia dụng phân khúc cao cấp.",
        logs: [
            { date: "2026-05-20", type: "call", content: "Đã gọi điện giới thiệu sơ bộ, khách hàng tỏ ra quan tâm và xin catalog." }
        ]
    },
    {
        id: "c-002",
        name: "Sophia Bennett",
        company: "Alibaba International",
        phone: "14155552671",
        email: "sophia.bennett@alibaba-global.com",
        source: "Triển lãm",
        status: "Đang Trao Đổi",
        priority: "Cao",
        birthday: "1988-05-28", // Sắp đến sinh nhật dựa trên lịch 24-05
        country: "Mỹ",
        dealValue: 450000000,
        dealStage: "Đã gửi",
        lastInteraction: "2026-05-22",
        nextFollowUpDate: "2026-05-26",
        nextFollowUpType: "Meeting",
        notes: "Yêu cầu cung cấp giấy chứng nhận kiểm định chất lượng FDA và giá xuất khẩu FOB.",
        logs: [
            { date: "2026-05-22", type: "zalo", content: "Chat WhatsApp thảo luận điều khoản thanh toán LC. Khách muốn cọc trước 30%." },
            { date: "2026-05-18", type: "mail", content: "Gửi thư cảm ơn khách hàng đã ghé thăm gian hàng tại triển lãm." }
        ]
    },
    {
        id: "c-003",
        name: "Hiroshi Tanaka",
        company: "Toyota Logistics Japan",
        phone: "81335028111",
        email: "tanaka.hiroshi@toyota-log.co.jp",
        source: "Đối tác giới thiệu",
        status: "Đã Gửi Mẫu",
        priority: "Cao",
        birthday: "1982-06-05",
        country: "Nhật Bản",
        dealValue: 850000000,
        dealStage: "Khách đang xem",
        lastInteraction: "2026-05-24",
        nextFollowUpDate: "2026-05-28",
        nextFollowUpType: "Call",
        notes: "Mẫu thử số hiệu M-902 đã được giao tới văn phòng Tokyo. Đang chờ phản hồi đánh giá kỹ thuật.",
        logs: [
            { date: "2026-05-24", type: "mail", content: "Gửi mã vận đơn DHL mẫu thử và tài liệu hướng dẫn lắp đặt bằng tiếng Anh." },
            { date: "2026-05-15", type: "call", content: "Xác nhận địa chỉ nhận hàng và số lượng mẫu thử cần gửi." }
        ]
    },
    {
        id: "c-004",
        name: "Trần Quốc Bảo",
        company: "Tập Đoàn Vingroup",
        phone: "0988887766",
        email: "bao.tq@vingroup.net",
        source: "Website",
        status: "Chốt Thành Công",
        priority: "Trung bình",
        birthday: "1995-10-22",
        country: "Việt Nam",
        dealValue: 1500000000,
        dealStage: "Đã ký",
        lastInteraction: "2026-05-23",
        nextFollowUpDate: "2026-06-10",
        nextFollowUpType: "Call",
        notes: "Hợp đồng đã ký đóng dấu đầy đủ. Chuẩn bị bàn giao đợt 1 vào ngày 05/06.",
        logs: [
            { date: "2026-05-23", type: "meeting", content: "Gặp mặt trực tiếp tại văn phòng Symphony. Hai bên ký kết hợp đồng thương mại." },
            { date: "2026-05-10", type: "mail", content: "Gửi bản dự thảo hợp đồng sửa đổi bổ sung điều khoản bảo hành 2 năm." }
        ]
    },
    {
        id: "c-005",
        name: "Sarah Jenkins",
        company: "Global Trade Agency",
        phone: "442079460192",
        email: "sarah.j@globaltrade.org.uk",
        source: "Email giới thiệu",
        status: "Đã Gửi Báo Giá",
        priority: "Cao",
        birthday: "1991-12-25",
        country: "Mỹ", // Lễ tạ ơn Mỹ sắp tới
        dealValue: 320000000,
        dealStage: "Khách đang xem",
        lastInteraction: "2026-05-21",
        nextFollowUpDate: "2026-05-27",
        nextFollowUpType: "Call",
        notes: "Đã gửi bảng báo giá CIF Hải Phòng. Khách hàng đang đàm phán mức chiết khấu 5%.",
        logs: [
            { date: "2026-05-21", type: "mail", content: "Gửi báo giá chính thức kèm điều khoản bảo hiểm hàng hóa vận chuyển đường biển." }
        ]
    }
];

// Khởi tạo ứng dụng khi tải trang hoàn tất
document.addEventListener('DOMContentLoaded', () => {
    initIndexedDB();
    initCustomers();
    initAppNavigation();
    initSearchFilters();
    initActionHandlers();
    initKanbanDragAndDrop();
    initExcelDropZone();
    renderDashboard();
});

/* ========================================================================
   1. KHỞI TẠO CƠ SỞ DỮ LIỆU INDEXEDDB (FILE STORAGE)
   ======================================================================== */
function initIndexedDB() {
    const request = indexedDB.open("PinkCRMDb", 1);
    
    request.onerror = (event) => {
        console.error("Lỗi khởi tạo IndexedDB:", event);
    };
    
    request.onsuccess = (event) => {
        appState.db = event.target.result;
        console.log("Khởi tạo IndexedDB thành công!");
    };
    
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Tạo objectStore lưu tài liệu tệp của khách hàng
        const objectStore = db.createObjectStore("documents", { keyPath: "fileId" });
        objectStore.createIndex("customerId", "customerId", { unique: false });
        console.log("Cập nhật cấu trúc IndexedDB thành công!");
    };
}

// Hàm lưu tài liệu vào IndexedDB
function saveDocument(customerId, fileName, fileSize, fileData, fileType, callback) {
    if (!appState.db) {
        alert("Cơ sở dữ liệu lưu trữ tài liệu chưa sẵn sàng!");
        return;
    }
    
    const fileId = "file-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
    const newDoc = {
        fileId: fileId,
        customerId: customerId,
        fileName: fileName,
        fileSize: fileSize,
        fileData: fileData, // dạng Base64
        fileType: fileType,
        uploadDate: new Date().toISOString().split('T')[0]
    };
    
    const transaction = appState.db.transaction(["documents"], "readwrite");
    const objectStore = transaction.objectStore("documents");
    const request = objectStore.add(newDoc);
    
    request.onsuccess = () => {
        console.log("Đã lưu tài liệu thành công vào IndexedDB");
        if (callback) callback(newDoc);
    };
    
    request.onerror = (e) => {
        console.error("Lỗi lưu tài liệu:", e);
    };
}

// Hàm lấy tất cả tài liệu của 1 khách hàng từ IndexedDB
function getDocumentsForCustomer(customerId, callback) {
    if (!appState.db) {
        setTimeout(() => getDocumentsForCustomer(customerId, callback), 200);
        return;
    }
    
    const transaction = appState.db.transaction(["documents"], "readonly");
    const objectStore = transaction.objectStore("documents");
    const index = objectStore.index("customerId");
    const request = index.getAll(customerId);
    
    request.onsuccess = (event) => {
        callback(event.target.result || []);
    };
}

// Hàm xóa tài liệu khỏi IndexedDB
function deleteDocument(fileId, callback) {
    if (!appState.db) return;
    
    const transaction = appState.db.transaction(["documents"], "readwrite");
    const objectStore = transaction.objectStore("documents");
    const request = objectStore.delete(fileId);
    
    request.onsuccess = () => {
        console.log("Xóa file thành công:", fileId);
        if (callback) callback();
    };
}

/* ========================================================================
   2. KHỞI TẠO KHÁCH HÀNG & LOCALSTORAGE
   ======================================================================== */
function initCustomers() {
    const stored = localStorage.getItem('crm_customers');
    if (stored) {
        try {
            appState.customers = JSON.parse(stored);
        } catch (e) {
            console.error("Lỗi parse LocalStorage, nạp mock data:", e);
            appState.customers = [...MOCK_CUSTOMERS];
            saveCustomersToStorage();
        }
    } else {
        appState.customers = [...MOCK_CUSTOMERS];
        saveCustomersToStorage();
    }
}

function saveCustomersToStorage() {
    localStorage.setItem('crm_customers', JSON.stringify(appState.customers));
}

// Hàm loại bỏ dấu tiếng Việt để tìm kiếm thông minh
function removeAccents(str) {
    if (!str) return '';
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd')
              .replace(/Đ/g, 'D')
              .toLowerCase();
}

/* ========================================================================
   3. MENU ĐIỀU HƯỚNG & CHUYỂN TAB
   ======================================================================== */
function initAppNavigation() {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const parent = link.closest('.nav-item');
            const tabId = parent.getAttribute('data-tab');
            
            // Xóa active khỏi menu cũ
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            // Thêm active vào menu mới
            parent.classList.add('active');
            
            // Ẩn tất cả tab panels
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            // Hiển thị tab panel tương ứng
            const targetPanel = document.getElementById(tabId + '-tab');
            if (targetPanel) {
                targetPanel.classList.add('active');
                appState.activeTab = tabId;
                
                // Kích hoạt render tương ứng cho từng Tab
                if (tabId === 'dashboard') {
                    renderDashboard();
                } else if (tabId === 'contacts') {
                    renderContactsTable();
                } else if (tabId === 'kanban') {
                    renderKanbanBoard();
                } else if (tabId === 'deals') {
                    renderDealsTab();
                } else if (tabId === 'calendar') {
                    renderCalendar();
                } else if (tabId === 'celebrations') {
                    renderCelebrationsTab();
                }
            }
        });
    });
}

/* ========================================================================
   4. TAB 1: TỔNG QUAN (DASHBOARD - THỐNG KÊ & BIỂU ĐỒ)
   ======================================================================== */
let dashboardChart = null; // Quản lý vòng đời biểu đồ Chart.js

function renderDashboard() {
    // 1. Thống kê KPI
    const total = appState.customers.length;
    const activeFollowups = appState.customers.filter(c => {
        if (!c.nextFollowUpDate) return false;
        const today = new Date().toISOString().split('T')[0];
        return c.nextFollowUpDate <= today && c.status !== 'Chốt Thành Công' && c.status !== 'Tạm Ngưng/Thất Bại';
    }).length;
    
    const wonCount = appState.customers.filter(c => c.status === 'Chốt Thành Công').length;
    const conversionRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;
    
    // Cập nhật thẻ KPI trên giao diện
    document.getElementById('kpi-total-cust').textContent = total;
    document.getElementById('kpi-active-follow').textContent = activeFollowups;
    document.getElementById('kpi-won').textContent = wonCount;
    document.getElementById('kpi-conversion').textContent = conversionRate + "%";
    
    // Cập nhật số badge trên sidebar
    const followBadge = document.getElementById('badge-follow-count');
    if (followBadge) {
        followBadge.textContent = activeFollowups;
        followBadge.style.display = activeFollowups > 0 ? 'inline-block' : 'none';
    }

    // 2. Vẽ đồ thị trạng thái Chart.js
    const statusCounts = {
        'Mới': 0, 'Đã liên hệ': 0, 'Đang trao đổi': 0, 'Báo giá': 0, 'Gửi mẫu': 0, 'Chốt thành công': 0, 'Thất bại': 0
    };
    
    appState.customers.forEach(c => {
        if (c.status === 'Khách hàng Mới') statusCounts['Mới']++;
        else if (c.status === 'Đã Liên Hệ') statusCounts['Đã liên hệ']++;
        else if (c.status === 'Đang Trao Đổi') statusCounts['Đang trao đổi']++;
        else if (c.status === 'Đã Gửi Báo Giá') statusCounts['Báo giá']++;
        else if (c.status === 'Đã Gửi Mẫu') statusCounts['Gửi mẫu']++;
        else if (c.status === 'Chốt Thành Công') statusCounts['Chốt thành công']++;
        else if (c.status === 'Tạm Ngưng/Thất Bại') statusCounts['Thất bại']++;
    });
    
    const ctx = document.getElementById('dashboard-status-chart');
    if (ctx) {
        if (dashboardChart) {
            dashboardChart.destroy();
        }
        
        dashboardChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        '#db2777', // Mới - Hồng sen
                        '#3b82f6', // Đã liên hệ - Xanh dương
                        '#8b5cf6', // Đang trao đổi - Tím
                        '#f59e0b', // Báo giá - Vàng hổ phách
                        '#10b981', // Gửi mẫu - Emerald
                        '#16a34a', // Chốt thành công - Xanh lá
                        '#ef4444'  // Thất bại - Đỏ
                    ],
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.7)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: { family: 'Inter', size: 12 },
                            color: '#3c2430'
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // 3. Render danh sách Sự kiện nhanh bên phải Dashboard
    renderDashboardEvents();
}

function renderDashboardEvents() {
    const listContainer = document.getElementById('dash-events-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    const events = [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Thu thập các cuộc hẹn hôm nay hoặc tương lai gần (trong vòng 10 ngày)
    appState.customers.forEach(cust => {
        if (cust.nextFollowUpDate && cust.status !== 'Chốt Thành Công' && cust.status !== 'Tạm Ngưng/Thất Bại') {
            const diffDays = Math.ceil((new Date(cust.nextFollowUpDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 10) {
                events.push({
                    type: 'call',
                    date: cust.nextFollowUpDate,
                    title: `${cust.nextFollowUpType === 'Meeting' ? 'Họp với' : 'Gọi cho'} ${cust.name}`,
                    sub: cust.company,
                    cust: cust
                });
            }
        }
        
        // Sinh nhật sắp tới
        if (cust.birthday) {
            const bdayDate = new Date(cust.birthday);
            const today = new Date(todayStr);
            const thisYearBday = new Date(today.getFullYear(), bdayDate.getMonth(), bdayDate.getDate());
            
            let diffDays = Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                // Đã qua sinh nhật năm nay, tính năm sau
                const nextYearBday = new Date(today.getFullYear() + 1, bdayDate.getMonth(), bdayDate.getDate());
                diffDays = Math.ceil((nextYearBday - today) / (1000 * 60 * 60 * 24));
            }
            
            if (diffDays >= 0 && diffDays <= 15) {
                events.push({
                    type: 'birthday',
                    date: `${new Date().getFullYear()}-${String(bdayDate.getMonth() + 1).padStart(2,'0')}-${String(bdayDate.getDate()).padStart(2,'0')}`,
                    title: `Sinh nhật ${cust.name}`,
                    sub: `Tuổi mới: ${new Date().getFullYear() - bdayDate.getFullYear()} tuổi`,
                    cust: cust
                });
            }
        }
    });

    // Sắp xếp các sự kiện theo ngày tăng dần
    events.sort((a, b) => a.date.localeCompare(b.date));

    if (events.length === 0) {
        listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0;">Không có lịch hẹn hay sinh nhật nào sắp diễn ra.</div>`;
        return;
    }

    events.slice(0, 5).forEach(ev => {
        const dateObj = new Date(ev.date);
        const day = dateObj.getDate();
        const month = "Th" + (dateObj.getMonth() + 1);
        
        const typeClass = ev.type === 'birthday' ? 'birthday' : 'call';
        const typeIcon = ev.type === 'birthday' ? 'fa-birthday-cake' : (ev.cust.nextFollowUpType === 'Meeting' ? 'fa-users' : 'fa-phone');
        const typeLabel = ev.type === 'birthday' ? 'Sinh Nhật' : 'Lịch Hẹn';
        
        const item = document.createElement('div');
        item.className = 'event-widget-item';
        item.innerHTML = `
            <div class="event-date-badge">
                <span>${month}</span>
                <span>${day}</span>
            </div>
            <div class="event-widget-info">
                <div class="event-widget-title">${ev.title}</div>
                <div class="event-widget-sub">${ev.sub}</div>
                <div style="margin-top: 4px;">
                    <span class="event-widget-type ${typeClass}">
                        <i class="fas ${typeIcon}" style="font-size: 9px; margin-right: 4px;"></i>${typeLabel}
                    </span>
                </div>
            </div>
            <button class="btn btn-icon btn-secondary" onclick="openCustomerDrawer('${ev.cust.id}')" style="width: 32px; height: 32px; border-radius: 8px;">
                <i class="fas fa-eye" style="font-size: 11px;"></i>
            </button>
        `;
        listContainer.appendChild(item);
    });
}

/* ========================================================================
   5. TAB 2: DANH BẠ LIÊN HỆ (DANH SÁCH & BỘ LỌC)
   ======================================================================== */
function initSearchFilters() {
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const filterPriority = document.getElementById('filter-priority');
    const filterCountry = document.getElementById('filter-country');
    
    const handleFilterChange = () => {
        if (appState.activeTab === 'contacts') {
            renderContactsTable();
        } else if (appState.activeTab === 'kanban') {
            renderKanbanBoard();
        } else if (appState.activeTab === 'deals') {
            renderDealsTab();
        }
    };
    
    if (searchInput) searchInput.addEventListener('input', handleFilterChange);
    if (filterStatus) filterStatus.addEventListener('change', handleFilterChange);
    if (filterPriority) filterPriority.addEventListener('change', handleFilterChange);
    if (filterCountry) filterCountry.addEventListener('change', handleFilterChange);
}

// Lấy danh sách khách hàng sau khi đã áp dụng các bộ lọc tìm kiếm
function getFilteredCustomers() {
    const searchVal = removeAccents(document.getElementById('search-input')?.value || '');
    const statusVal = document.getElementById('filter-status')?.value || 'all';
    const priorityVal = document.getElementById('filter-priority')?.value || 'all';
    const countryVal = document.getElementById('filter-country')?.value || 'all';
    
    return appState.customers.filter(c => {
        // 1. Lọc Tìm kiếm (Không dấu, tìm theo Tên, Công ty, Email, Điện thoại)
        const matchSearch = !searchVal || 
            removeAccents(c.name).includes(searchVal) ||
            removeAccents(c.company).includes(searchVal) ||
            removeAccents(c.email).includes(searchVal) ||
            c.phone.includes(searchVal);
            
        // 2. Lọc Trạng thái
        const matchStatus = statusVal === 'all' || c.status === statusVal;
        
        // 3. Lọc Ưu tiên
        const matchPriority = priorityVal === 'all' || c.priority === priorityVal;
        
        // 4. Lọc Quốc gia
        const matchCountry = countryVal === 'all' || c.country === countryVal;
        
        return matchSearch && matchStatus && matchPriority && matchCountry;
    });
}

function renderContactsTable() {
    const tbody = document.getElementById('contacts-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const filtered = getFilteredCustomers();
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-search" style="font-size: 24px; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                    Không tìm thấy khách hàng nào khớp với bộ lọc.
                </td>
            </tr>
        `;
        return;
    }
    
    filtered.forEach(c => {
        // Nhãn class trạng thái
        let statusClass = 'status-new';
        if (c.status === 'Đã Liên Hệ') statusClass = 'status-contacted';
        else if (c.status === 'Đang Trao Đổi') statusClass = 'status-discussion';
        else if (c.status === 'Đã Gửi Báo Giá') statusClass = 'status-quotation';
        else if (c.status === 'Đã Gửi Mẫu') statusClass = 'status-sample';
        else if (c.status === 'Chốt Thành Công') statusClass = 'status-won';
        else if (c.status === 'Tạm Ngưng/Thất Bại') statusClass = 'status-lost';
        
        // Nhãn độ ưu tiên
        let priorityClass = 'priority-low';
        if (c.priority === 'Cao') priorityClass = 'priority-high';
        else if (c.priority === 'Trung bình') priorityClass = 'priority-medium';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="customer-meta">
                    <span class="name" onclick="openCustomerDrawer('${c.id}')">${c.name}</span>
                    <span class="company">${c.company}</span>
                </div>
            </td>
            <td>${c.phone}</td>
            <td>${c.email}</td>
            <td><span class="badge-status ${statusClass}">${c.status}</span></td>
            <td><span class="badge-priority ${priorityClass}"><i class="fas fa-circle" style="font-size: 6px;"></i> ${c.priority}</span></td>
            <td>${c.country}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-icon btn-secondary" onclick="openCustomerDrawer('${c.id}')" style="width: 32px; height: 32px; border-radius: 8px;">
                        <i class="fas fa-pencil-alt" style="font-size: 12px;"></i>
                    </button>
                    <button class="btn btn-icon btn-secondary" onclick="confirmDeleteCustomer('${c.id}')" style="width: 32px; height: 32px; border-radius: 8px; color: var(--color-danger);">
                        <i class="fas fa-trash-alt" style="font-size: 12px;"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* ========================================================================
   6. TAB 3: BẢNG KANBAN KÉO THẢ (7 BƯỚC QUY TRÌNH CHĂM SÓC)
   ======================================================================== */
const PIPELINE_STAGES = [
    "Khách hàng Mới",
    "Đã Liên Hệ",
    "Đang Trao Đổi",
    "Đã Gửi Báo Giá",
    "Đã Gửi Mẫu",
    "Chốt Thành Công",
    "Tạm Ngưng/Thất Bại"
];

function renderKanbanBoard() {
    const boardContainer = document.getElementById('kanban-board-container');
    if (!boardContainer) return;
    
    boardContainer.innerHTML = '';
    const filtered = getFilteredCustomers();
    
    PIPELINE_STAGES.forEach((stage, idx) => {
        const stageCustomers = filtered.filter(c => c.status === stage);
        
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.setAttribute('data-stage', stage);
        
        column.innerHTML = `
            <div class="kanban-column-header">
                <span>${stage}</span>
                <span class="kanban-count">${stageCustomers.length}</span>
            </div>
            <div class="kanban-cards-list" id="kanban-list-${idx}">
                <!-- Danh sách thẻ card -->
            </div>
        `;
        
        boardContainer.appendChild(column);
        
        const cardsList = column.querySelector('.kanban-cards-list');
        
        if (stageCustomers.length === 0) {
            // Hiển thị placeholder nếu cột trống
            cardsList.innerHTML = `<div style="text-align: center; border: 1.5px dashed rgba(60,36,48,0.1); border-radius: 8px; padding: 20px 10px; font-size: 11px; color: var(--text-muted);">Thả khách vào đây</div>`;
        } else {
            stageCustomers.forEach(c => {
                const card = document.createElement('div');
                card.className = 'kanban-card';
                card.setAttribute('draggable', 'true');
                card.setAttribute('data-id', c.id);
                
                // Nhãn độ ưu tiên
                let priorityHtml = '';
                if (c.priority === 'Cao') {
                    priorityHtml = `<span style="color: var(--color-danger); font-weight: 700; font-size: 9px;"><i class="fas fa-circle" style="font-size: 5px;"></i> ƯU TIÊN CAO</span>`;
                }
                
                const lastActStr = c.lastInteraction ? `Gần nhất: ${c.lastInteraction}` : 'Chưa có tương tác';
                
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                        <span class="kanban-card-title" onclick="openCustomerDrawer('${c.id}')" style="cursor: pointer; hover: color: var(--pink-primary);">${c.name}</span>
                        ${priorityHtml}
                    </div>
                    <div class="kanban-card-company">${c.company}</div>
                    <div class="kanban-card-footer">
                        <span class="kanban-card-date"><i class="far fa-clock"></i> ${lastActStr}</span>
                        <i class="fas fa-briefcase" style="color: var(--text-muted); opacity: 0.5;"></i>
                    </div>
                `;
                
                // Bắt sự kiện click mở drawer khi bấm vào card (nhưng tránh trigger drag)
                card.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'SPAN') {
                        openCustomerDrawer(c.id);
                    }
                });
                
                cardsList.appendChild(card);
            });
        }
    });
    
    // Đăng ký lại các sự kiện Kéo thả sau khi vẽ xong
    initKanbanDragAndDrop();
}

// Logic kéo thả Kanban
function initKanbanDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-column');
    
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
            card.style.opacity = '0.4';
        });
        
        card.addEventListener('dragend', () => {
            card.style.opacity = '1';
        });
    });
    
    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.style.background = 'rgba(219, 39, 119, 0.04)';
        });
        
        column.addEventListener('dragleave', () => {
            column.style.background = 'rgba(255, 255, 255, 0.4)';
        });
        
        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.style.background = 'rgba(255, 255, 255, 0.4)';
            
            const customerId = e.dataTransfer.getData('text/plain');
            const targetStage = column.getAttribute('data-stage');
            
            const customer = appState.customers.find(c => c.id === customerId);
            if (customer && customer.status !== targetStage) {
                const oldStage = customer.status;
                customer.status = targetStage;
                customer.lastInteraction = new Date().toISOString().split('T')[0];
                
                // Ghi nhật ký hệ thống tự động
                customer.logs.unshift({
                    date: customer.lastInteraction,
                    type: 'other',
                    content: `Hệ thống: Chuyển bước quy trình từ [${oldStage}] sang [${targetStage}].`
                });
                
                saveCustomersToStorage();
                renderKanbanBoard();
                
                // Thông báo nhỏ nhẹ
                console.log(`Đã chuyển ${customer.name} sang ${targetStage}`);
            }
        });
    });
}

/* ========================================================================
   7. TAB 4: ƯU TIÊN & QUẢN LÝ HỢP ĐỒNG (DEALS / AGREEMENTS)
   ======================================================================== */
function renderDealsTab() {
    const dealsList = document.getElementById('deals-list-container');
    if (!dealsList) return;
    
    dealsList.innerHTML = '';
    
    // Lọc các khách hàng có ưu tiên "Cao" hoặc đang ở các giai đoạn đàm phán/chốt
    const targetStages = ["Đang Trao Đổi", "Đã Gửi Báo Giá", "Đã Gửi Mẫu", "Chốt Thành Công"];
    const priorityCustomers = appState.customers.filter(c => 
        c.priority === 'Cao' || targetStages.includes(c.status)
    );

    if (priorityCustomers.length === 0) {
        dealsList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;">Không có giao dịch ưu tiên cao nào hiện tại. Hãy chuyển đổi độ ưu tiên của khách sang "Cao" hoặc đổi trạng thái để xem tại đây!</div>`;
        return;
    }

    // Tính tổng giá trị phễu dự kiến
    let totalPipelineValue = 0;
    priorityCustomers.forEach(c => {
        totalPipelineValue += (c.dealValue || 0);
    });
    
    // Cập nhật giá trị phễu trên thẻ phụ
    document.getElementById('total-pipeline-value').innerHTML = `
        <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">Tổng giá trị phễu:</span><br/>
        <strong style="color: var(--pink-primary); font-size: 24px;">${totalPipelineValue.toLocaleString('vi-VN')} đ</strong>
    `;

    priorityCustomers.forEach(c => {
        const item = document.createElement('div');
        item.className = 'deal-item';
        
        const dealValFormatted = (c.dealValue || 0).toLocaleString('vi-VN') + " đ";
        const stageSelected = c.dealStage || 'Soạn thảo';
        
        item.innerHTML = `
            <div class="deal-info">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="priority-badge-dot ${c.priority === 'Cao' ? 'high' : 'medium'}"></span>
                    <span class="deal-name" onclick="openCustomerDrawer('${c.id}')" style="cursor: pointer; hover: text-decoration: underline;">${c.name}</span>
                    <span style="font-size: 11px; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-weight: 600;">${c.company}</span>
                </div>
                <div class="deal-meta-text">
                    <span>Giai đoạn chăm sóc: <strong>${c.status}</strong></span>
                    <span>Tương tác cuối: ${c.lastInteraction || 'N/A'}</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 20px;">
                <div class="deal-value">${dealValFormatted}</div>
                <div>
                    <select class="agreement-status-select" onchange="updateDealStage('${c.id}', this.value)">
                        <option value="Soạn thảo" ${stageSelected === 'Soạn thảo' ? 'selected' : ''}>📝 Soạn thảo</option>
                        <option value="Đã gửi" ${stageSelected === 'Đã gửi' ? 'selected' : ''}>✉️ Đã gửi Đề xuất</option>
                        <option value="Khách đang xem" ${stageSelected === 'Khách đang xem' ? 'selected' : ''}>👀 Đang Xem xét</option>
                        <option value="Đã ký" ${stageSelected === 'Đã ký' ? 'selected' : ''}>✍️ Đã Ký kết</option>
                        <option value="Từ chối" ${stageSelected === 'Từ chối' ? 'selected' : ''}>❌ Từ chối</option>
                    </select>
                </div>
                <button class="btn btn-icon btn-secondary" onclick="openCustomerDrawer('${c.id}')" style="width: 32px; height: 32px; border-radius: 8px;">
                    <i class="fas fa-folder-open" style="font-size: 12px;"></i>
                </button>
            </div>
        `;
        dealsList.appendChild(item);
    });
}

function updateDealStage(customerId, newStage) {
    const customer = appState.customers.find(c => c.id === customerId);
    if (customer) {
        const oldStage = customer.dealStage || 'Soạn thảo';
        customer.dealStage = newStage;
        customer.lastInteraction = new Date().toISOString().split('T')[0];
        
        customer.logs.unshift({
            date: customer.lastInteraction,
            type: 'other',
            content: `Hệ thống: Trạng thái đề xuất/thỏa thuận chuyển từ [${oldStage}] sang [${newStage}].`
        });
        
        saveCustomersToStorage();
        console.log(`Đã cập nhật trạng thái hợp đồng ${customer.name} sang ${newStage}`);
    }
}

/* ========================================================================
   8. TAB 5: LỊCH HẸN CHĂM SÓC (VISUAL CALENDAR & GOOGLE CALENDAR SYNC)
   ======================================================================== */
function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid-container');
    const calendarMonthTitle = document.getElementById('calendar-month-title');
    if (!calendarGrid || !calendarMonthTitle) return;
    
    calendarGrid.innerHTML = '';
    
    const curDate = appState.currentCalendarDate;
    const year = curDate.getFullYear();
    const month = curDate.getMonth();
    
    // Tên tháng Tiếng Việt hiển thị ở tiêu đề
    const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
    calendarMonthTitle.textContent = `${monthNames[month]} - Năm ${year}`;
    
    // Vẽ tiêu đề Thứ trong tuần
    const daysOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    daysOfWeek.forEach(day => {
        const headerCell = document.createElement('div');
        headerCell.className = 'calendar-day-header';
        headerCell.textContent = day;
        calendarGrid.appendChild(headerCell);
    });
    
    const firstDayIndex = new Date(year, month, 1).getDay(); // Ngày đầu tiên của tháng là thứ mấy
    const totalDays = new Date(year, month + 1, 0).getDate(); // Tổng số ngày trong tháng hiện tại
    const prevMonthTotalDays = new Date(year, month, 0).getDate(); // Tổng số ngày tháng trước
    
    // 1. Vẽ các ngày thuộc tháng trước (mờ đi)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dayNum = prevMonthTotalDays - i;
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell other-month';
        cell.innerHTML = `<div class="calendar-day-number">${dayNum}</div>`;
        calendarGrid.appendChild(cell);
    }
    
    // 2. Vẽ các ngày trong tháng hiện tại
    const todayStr = new Date().toISOString().split('T')[0];
    
    for (let day = 1; day <= totalDays; day++) {
        const cellDateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const isToday = cellDateStr === todayStr;
        
        const cell = document.createElement('div');
        cell.className = `calendar-day-cell ${isToday ? 'today' : ''}`;
        cell.innerHTML = `<div class="calendar-day-number">${day}</div>`;
        
        // Tìm lịch hẹn khớp với ngày này
        const dayEvents = appState.customers.filter(c => c.nextFollowUpDate === cellDateStr && c.status !== 'Chốt Thành Công' && c.status !== 'Tạm Ngưng/Thất Bại');
        
        dayEvents.forEach(c => {
            const evElement = document.createElement('div');
            const typeClass = c.nextFollowUpType === 'Meeting' ? 'meeting' : (c.nextFollowUpType === 'Email' ? 'followup' : 'call');
            const typeLabel = c.nextFollowUpType === 'Meeting' ? 'Họp' : (c.nextFollowUpType === 'Email' ? 'Mail' : 'Call');
            
            evElement.className = `calendar-event-item ${typeClass}`;
            evElement.textContent = `📞 ${typeLabel}: ${c.name}`;
            evElement.title = `${c.name} - ${c.company}\nNội dung: ${c.notes}`;
            
            evElement.addEventListener('click', (e) => {
                e.stopPropagation();
                openCustomerDrawer(c.id);
            });
            
            cell.appendChild(evElement);
        });
        
        calendarGrid.appendChild(cell);
    }
    
    // 3. Vẽ các ngày tháng sau để lấp đầy lịch (bội số của 7)
    const currentCellsCount = firstDayIndex + totalDays;
    const remainingCells = 42 - currentCellsCount; // lịch 6 dòng = 42 ô
    for (let day = 1; day <= remainingCells; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell other-month';
        cell.innerHTML = `<div class="calendar-day-number">${day}</div>`;
        calendarGrid.appendChild(cell);
    }
}

// Chuyển lịch sang tháng trước
function prevCalendarMonth() {
    appState.currentCalendarDate.setMonth(appState.currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

// Chuyển lịch sang tháng sau
function nextCalendarMonth() {
    appState.currentCalendarDate.setMonth(appState.currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

// Hàm đồng bộ nhanh tạo link Google Calendar
function getGoogleCalendarLink(customer) {
    const title = encodeURIComponent(`Cuộc gọi CRM: Chăm sóc ${customer.name} (${customer.company})`);
    
    // Đặt khung thời gian sự kiện: 09:00 -> 09:30 sáng của ngày hẹn
    const dateStr = customer.nextFollowUpDate.replace(/-/g, '');
    const dateRange = `${dateStr}T090000/${dateStr}T093000`;
    
    const details = encodeURIComponent(`Nội dung ghi chú khách hàng:\n- Công ty: ${customer.company}\n- SĐT: ${customer.phone}\n- Email: ${customer.email}\n- Ghi chú: ${customer.notes}`);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateRange}&details=${details}&sf=true&output=xml`;
}

/* ========================================================================
   9. TAB 6: QUẢN LÝ LỄ HỘI & SINH NHẬT (CELEBRATIONS)
   ======================================================================== */
function renderCelebrationsTab() {
    const bdaysList = document.getElementById('birthdays-list');
    const holidaysList = document.getElementById('holidays-list');
    if (!bdaysList || !holidaysList) return;
    
    bdaysList.innerHTML = '';
    holidaysList.innerHTML = '';
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let hasBdays = false;
    let hasHolidays = false;
    
    appState.customers.forEach(cust => {
        // A. Kiểm tra sinh nhật sắp tới trong 30 ngày
        if (cust.birthday) {
            const bdayDate = new Date(cust.birthday);
            const thisYearBday = new Date(today.getFullYear(), bdayDate.getMonth(), bdayDate.getDate());
            
            let diffDays = Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                const nextYearBday = new Date(today.getFullYear() + 1, bdayDate.getMonth(), bdayDate.getDate());
                diffDays = Math.ceil((nextYearBday - today) / (1000 * 60 * 60 * 24));
            }
            
            if (diffDays >= 0 && diffDays <= 30) {
                hasBdays = true;
                const bdayCard = document.createElement('div');
                bdayCard.className = 'celebration-card-item birthday';
                bdayCard.innerHTML = `
                    <div class="celebration-icon-box">
                        <i class="fas fa-cake-candles"></i>
                    </div>
                    <div class="celebration-info-details">
                        <div class="celebration-name-text">${cust.name}</div>
                        <div class="celebration-sub-text">Sinh nhật: <strong>${bdayDate.getDate()}/${bdayDate.getMonth()+1}</strong> (${cust.company})</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="days-countdown">${diffDays === 0 ? 'HÔM NAY! 🎉' : `còn ${diffDays} ngày`}</span>
                        <button class="btn btn-primary" onclick="openBirthdayCongratulate('${cust.id}')" style="padding: 6px 12px; font-size:12px;">Chúc mừng</button>
                    </div>
                `;
                bdaysList.appendChild(bdayCard);
            }
        }
        
        // B. Kiểm tra ngày lễ của quốc gia khách hàng trong 30 ngày
        const country = cust.country || "Việt Nam";
        const countryHolidays = HOLIDAY_DATABASE[country] || [];
        
        countryHolidays.forEach(holiday => {
            const [holidayDay, holidayMonth] = holiday.date.split('-').map(Number);
            const thisYearHoliday = new Date(today.getFullYear(), holidayMonth - 1, holidayDay);
            
            let diffDays = Math.ceil((thisYearHoliday - today) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                const nextYearHoliday = new Date(today.getFullYear() + 1, holidayMonth - 1, holidayDay);
                diffDays = Math.ceil((nextYearHoliday - today) / (1000 * 60 * 60 * 24));
            }
            
            if (diffDays >= 0 && diffDays <= 30) {
                hasHolidays = true;
                const holidayCard = document.createElement('div');
                holidayCard.className = 'celebration-card-item holiday';
                holidayCard.innerHTML = `
                    <div class="celebration-icon-box">
                        <i class="fas fa-flag"></i>
                    </div>
                    <div class="celebration-info-details">
                        <div class="celebration-name-text">${holiday.name}</div>
                        <div class="celebration-sub-text">Khách: <strong>${cust.name}</strong> - Quốc tịch: <strong>${country}</strong></div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="days-countdown">${diffDays === 0 ? 'HÔM NAY! 🌍' : `còn ${diffDays} ngày`}</span>
                        <button class="btn btn-gold" onclick="openHolidayCongratulate('${cust.id}', '${holiday.name}', '${holiday.greeting}')" style="padding: 6px 12px; font-size:12px;">Gửi Lời Chúc</button>
                    </div>
                `;
                holidaysList.appendChild(holidayCard);
            }
        });
    });
    
    if (!hasBdays) {
        bdaysList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; width:100%; padding:20px;">Không có sinh nhật nào diễn ra trong 30 ngày tới.</div>`;
    }
    if (!hasHolidays) {
        holidaysList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; width:100%; padding:20px;">Không có ngày lễ quốc gia nào sắp diễn ra trong 30 ngày tới.</div>`;
    }
}

// Chức năng Chúc mừng sinh nhật nhanh
function openBirthdayCongratulate(customerId) {
    const cust = appState.customers.find(c => c.id === customerId);
    if (!cust) return;
    openCustomerDrawer(cust.id);
    // Chuyển drawer sang tab Gửi mail
    setTimeout(() => {
        switchDrawerTab('email');
        const select = document.getElementById('email-template-select');
        if (select) {
            select.value = 'birthday';
            select.dispatchEvent(new Event('change'));
        }
    }, 450);
}

// Chức năng Chúc mừng ngày lễ nhanh
function openHolidayCongratulate(customerId, holidayName, greetingText) {
    const cust = appState.customers.find(c => c.id === customerId);
    if (!cust) return;
    openCustomerDrawer(cust.id);
    setTimeout(() => {
        switchDrawerTab('email');
        const select = document.getElementById('email-template-select');
        if (select) {
            select.value = 'holiday';
            
            // Xử lý nạp template tùy biến có sẵn ngày lễ
            const template = EMAIL_TEMPLATES.find(t => t.id === 'holiday');
            if (template) {
                let subject = template.subject.replace('{TenNgayLe}', holidayName).replace('{TenKhachHang}', cust.name);
                let body = template.body
                    .replace('{TenNgayLe}', holidayName)
                    .replace('{TenKhachHang}', cust.name)
                    .replace('{QuocGia}', cust.country)
                    .replace('{TenCongTy}', cust.company);
                
                // Tiêm vào khung soạn thư nháp
                document.getElementById('email-subject-input').value = subject;
                document.getElementById('email-body-input').value = body;
            }
        }
    }, 450);
}

/* ========================================================================
   10. NGĂN KÉO CHI TIẾT KHÁCH HÀNG (SLIDE-OUT DRAWER HOẠT ĐỘNG)
   ======================================================================== */
function openCustomerDrawer(customerId) {
    const cust = appState.customers.find(c => c.id === customerId);
    if (!cust) return;
    
    appState.selectedCustomerId = customerId;
    
    // Tiêm các thông tin cơ bản vào drawer
    document.getElementById('drawer-cust-name').textContent = cust.name;
    document.getElementById('drawer-cust-company').textContent = cust.company;
    
    // Hồ sơ chi tiết
    document.getElementById('det-name').value = cust.name;
    document.getElementById('det-company').value = cust.company;
    document.getElementById('det-phone').value = cust.phone;
    document.getElementById('det-email').value = cust.email;
    document.getElementById('det-source').value = cust.source || 'Facebook';
    document.getElementById('det-status').value = cust.status || 'Khách hàng Mới';
    document.getElementById('det-priority').value = cust.priority || 'Trung bình';
    document.getElementById('det-birthday').value = cust.birthday || '';
    document.getElementById('det-country').value = cust.country || 'Việt Nam';
    document.getElementById('det-deal-value').value = cust.dealValue || 0;
    
    // Ghi chú cơ bản
    document.getElementById('det-notes').value = cust.notes || '';
    
    // Liên kết Click-to-chat nhanh
    setupSocialButtons(cust);
    
    // Nạp email template select ban đầu
    const emailSelect = document.getElementById('email-template-select');
    if (emailSelect) {
        emailSelect.innerHTML = EMAIL_TEMPLATES.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        emailSelect.value = 'intro';
        loadEmailTemplate('intro', cust);
    }
    
    // Đọc lịch sử tương tác dòng thời gian
    renderTimeline(cust);
    
    // Đọc danh sách File tài liệu từ IndexedDB
    renderDocumentList(cust.id);
    
    // Mở Drawer giao diện mượt mà
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('drawer-container');
    overlay.style.display = 'block';
    setTimeout(() => {
        overlay.style.opacity = '1';
        drawer.classList.add('open');
    }, 10);
    
    // Mặc định chọn tab "Nhật ký tương tác"
    switchDrawerTab('timeline');
}

function closeCustomerDrawer() {
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('drawer-container');
    
    overlay.style.opacity = '0';
    drawer.classList.remove('open');
    setTimeout(() => {
        overlay.style.display = 'none';
        appState.selectedCustomerId = null;
        
        // Refresh lại tab đang mở để cập nhật thay đổi
        if (appState.activeTab === 'dashboard') renderDashboard();
        else if (appState.activeTab === 'contacts') renderContactsTable();
        else if (appState.activeTab === 'kanban') renderKanbanBoard();
        else if (appState.activeTab === 'deals') renderDealsTab();
        else if (appState.activeTab === 'calendar') renderCalendar();
        else if (appState.activeTab === 'celebrations') renderCelebrationsTab();
    }, 300);
}

function switchDrawerTab(tabName) {
    document.querySelectorAll('.drawer-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.drawer-tab-content').forEach(cont => cont.classList.remove('active'));
    
    document.querySelector(`.drawer-tab-btn[onclick="switchDrawerTab('${tabName}')"]`)?.classList.add('active');
    document.getElementById(`drawer-tab-${tabName}`).classList.add('active');
}

// Thiết lập các liên kết gọi điện, chat nhanh
function setupSocialButtons(cust) {
    const whatsappBtn = document.getElementById('quick-link-whatsapp');
    const viberBtn = document.getElementById('quick-link-viber');
    const gmailBtn = document.getElementById('quick-link-gmail');
    
    // WhatsApp: wa.me/số_điện_thoại?text=nội_dung_soạn_sẵn
    let phoneClean = cust.phone.replace(/[^0-9]/g, '');
    // Định dạng lại đầu số Việt Nam nếu có dạng 09... -> 849...
    if (phoneClean.startsWith('0')) {
        phoneClean = '84' + phoneClean.slice(1);
    }
    
    const textMsg = encodeURIComponent(`Xin chào Anh/Chị ${cust.name},\nEm liên hệ từ [Tên công ty của bạn]...`);
    whatsappBtn.href = `https://wa.me/${phoneClean}?text=${textMsg}`;
    
    // Viber: viber://chat?number=số_điện_thoại (cần cài đặt app trên máy tính)
    viberBtn.href = `viber://chat?number=%2B${phoneClean}`;
    
    // Gmail: mailto link mở trình duyệt/Outlook
    gmailBtn.href = `mailto:${cust.email}?subject=${encodeURIComponent("Liên hệ công việc")}`;
}

// Cập nhật và lưu lại toàn bộ thông tin Hồ sơ khách hàng từ Drawer
function saveCustomerProfileFromDrawer() {
    const custId = appState.selectedCustomerId;
    const cust = appState.customers.find(c => c.id === custId);
    
    if (cust) {
        cust.name = document.getElementById('det-name').value;
        cust.company = document.getElementById('det-company').value;
        cust.phone = document.getElementById('det-phone').value;
        cust.email = document.getElementById('det-email').value;
        cust.source = document.getElementById('det-source').value;
        
        const oldStatus = cust.status;
        const newStatus = document.getElementById('det-status').value;
        cust.status = newStatus;
        
        cust.priority = document.getElementById('det-priority').value;
        cust.birthday = document.getElementById('det-birthday').value;
        cust.country = document.getElementById('det-country').value;
        cust.dealValue = Number(document.getElementById('det-deal-value').value) || 0;
        cust.notes = document.getElementById('det-notes').value;
        
        // Ghi log tự động nếu trạng thái bị thay đổi trong drawer
        if (oldStatus !== newStatus) {
            cust.logs.unshift({
                date: new Date().toISOString().split('T')[0],
                type: 'other',
                content: `Hệ thống: Thay đổi trạng thái hồ sơ từ [${oldStatus}] sang [${newStatus}].`
            });
        }
        
        saveCustomersToStorage();
        alert("Đã lưu thông tin hồ sơ thành công!");
        closeCustomerDrawer();
    }
}

// Nhật ký Chăm Sóc Khách Hàng (Follow-up Activity Logging)
function renderTimeline(cust) {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';
    
    if (!cust.logs || cust.logs.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 20px 0;">Chưa có lịch sử chăm sóc nào được ghi nhận.</div>`;
        return;
    }
    
    cust.logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        let typeClass = 'other';
        let typeLabel = 'Khác';
        if (log.type === 'call') { typeClass = 'call'; typeLabel = 'Cuộc Gọi'; }
        else if (log.type === 'zalo') { typeClass = 'zalo'; typeLabel = 'Nhắn Tin'; }
        else if (log.type === 'mail') { typeClass = 'mail'; typeLabel = 'Gửi Email'; }
        
        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-meta">
                <span class="timeline-type-tag ${typeClass}">${typeLabel}</span>
                <span>Ngày thực hiện: ${log.date}</span>
            </div>
            <div class="timeline-content-card">
                ${log.content}
            </div>
        `;
        container.appendChild(item);
    });
}

// Bổ sung Nhật ký chăm sóc thủ công
function addFollowUpLog() {
    const custId = appState.selectedCustomerId;
    const cust = appState.customers.find(c => c.id === custId);
    if (!cust) return;
    
    const type = document.getElementById('log-type-select').value;
    const content = document.getElementById('log-content-input').value.trim();
    const nextDate = document.getElementById('log-next-date').value;
    const nextType = document.getElementById('log-next-type').value;
    
    if (!content) {
        alert("Vui lòng nhập nội dung cuộc trò chuyện/tương tác!");
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Đẩy hoạt động mới lên đầu timeline
    cust.logs.unshift({
        date: today,
        type: type,
        content: content
    });
    
    cust.lastInteraction = today;
    
    // Đặt lịch hẹn tiếp theo nếu có nhập ngày hẹn
    if (nextDate) {
        cust.nextFollowUpDate = nextDate;
        cust.nextFollowUpType = nextType;
        
        // Thêm câu ghi chú vào lịch sử
        cust.logs.unshift({
            date: today,
            type: 'other',
            content: `📅 Đã hẹn lịch: ${nextType === 'Meeting' ? 'Cuộc họp' : 'Cuộc gọi'} tiếp theo vào ngày ${nextDate}.`
        });
    }
    
    saveCustomersToStorage();
    
    // Reset form
    document.getElementById('log-content-input').value = '';
    document.getElementById('log-next-date').value = '';
    
    // Tải lại giao diện
    renderTimeline(cust);
    alert("Đã thêm nhật ký chăm sóc thành công!");
}

/* ========================================================================
   11. TRÌNH SOẠN THẢO EMAIL TỰ ĐỘNG (COMPOSER & TEMPLATE DETECTOR)
   ======================================================================== */
function loadEmailTemplate(templateId, cust) {
    if (!cust) {
        cust = appState.customers.find(c => c.id === appState.selectedCustomerId);
    }
    if (!cust) return;
    
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    let subject = template.subject
        .replace('{TenKhachHang}', cust.name)
        .replace('{TenCongTy}', cust.company);
        
    let body = template.body
        .replace('{TenKhachHang}', cust.name)
        .replace('{TenCongTy}', cust.company)
        .replace('{QuocGia}', cust.country || 'Việt Nam')
        .replace('{TenNgayLe}', '[Nhập Tên Ngày Lễ]');
        
    document.getElementById('email-subject-input').value = subject;
    document.getElementById('email-body-input').value = body;
}

// Khi chuyển đổi select box trong email composer
function onEmailTemplateChange() {
    const val = document.getElementById('email-template-select').value;
    loadEmailTemplate(val);
}

// Bấm nút tạo thư nháp (Gmail/Outlook mailto link)
function sendEmailDraft() {
    const custId = appState.selectedCustomerId;
    const cust = appState.customers.find(c => c.id === custId);
    if (!cust) return;
    
    const subject = document.getElementById('email-subject-input').value;
    const body = document.getElementById('email-body-input').value;
    
    // Ghi nhận nhật ký tự động
    cust.logs.unshift({
        date: new Date().toISOString().split('T')[0],
        type: 'mail',
        content: `Đã gửi Email nháp (Draft): ${subject}`
    });
    cust.lastInteraction = new Date().toISOString().split('T')[0];
    saveCustomersToStorage();
    
    // Tạo link kích hoạt mở phần mềm mail
    const mailtoUrl = `mailto:${cust.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Tạo một thẻ 'a' ẩn để click
    const tempLink = document.createElement('a');
    tempLink.href = mailtoUrl;
    tempLink.target = '_blank';
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    
    renderTimeline(cust);
    alert("Đã ghi nhận hoạt động và mở trình soạn thảo thư của máy tính/trình duyệt của bạn!");
}

/* ========================================================================
   12. TÍCH HỢP LƯU TRỮ TÀI LIỆU KHÁCH HÀNG (INDEXEDDB VAULT)
   ======================================================================== */
function renderDocumentList(customerId) {
    const list = document.getElementById('file-list-container');
    if (!list) return;
    
    list.innerHTML = '';
    
    getDocumentsForCustomer(customerId, (docs) => {
        if (docs.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 12px 0;">Chưa có tài liệu/file đính kèm nào cho khách hàng này.</div>`;
            return;
        }
        
        docs.forEach(doc => {
            const item = document.createElement('div');
            item.className = 'file-item';
            
            // Icon file tương ứng
            let iconClass = 'fa-file-alt';
            if (doc.fileType.includes('pdf')) iconClass = 'fa-file-pdf';
            else if (doc.fileType.includes('image')) iconClass = 'fa-file-image';
            else if (doc.fileType.includes('excel') || doc.fileType.includes('sheet') || doc.fileName.endsWith('.xlsx') || doc.fileName.endsWith('.xls')) iconClass = 'fa-file-excel';
            else if (doc.fileType.includes('word') || doc.fileName.endsWith('.docx') || doc.fileName.endsWith('.doc')) iconClass = 'fa-file-word';
            
            item.innerHTML = `
                <div class="file-item-info">
                    <i class="far ${iconClass}" style="color: var(--pink-primary); font-size: 16px;"></i>
                    <span>${doc.fileName}</span>
                    <span style="font-size: 10px; color: var(--text-muted);">(${doc.fileSize}, ${doc.uploadDate})</span>
                </div>
                <div class="file-item-actions">
                    <i class="fas fa-download" onclick="downloadCustomerFile('${doc.fileId}')" title="Tải xuống"></i>
                    <i class="fas fa-trash-alt" onclick="deleteCustomerFile('${doc.fileId}')" title="Xóa file" style="color: var(--color-danger);"></i>
                </div>
            `;
            list.appendChild(item);
        });
    });
}

// Tải file nhị phân lên IndexedDB
function uploadCustomerFile(inputElement) {
    const customerId = appState.selectedCustomerId;
    if (!customerId) return;
    
    const file = inputElement.files[0];
    if (!file) return;
    
    // Giới hạn dung lượng file đơn lẻ 15MB để tránh lag trình duyệt
    if (file.size > 15 * 1024 * 1024) {
        alert("Vui lòng tải tệp có dung lượng nhỏ hơn 15MB!");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const fileData = event.target.result; // Dạng base64 string
        const fileSizeStr = formatBytes(file.size);
        
        saveDocument(customerId, file.name, fileSizeStr, fileData, file.type, (newDoc) => {
            // Thêm log hoạt động
            const cust = appState.customers.find(c => c.id === customerId);
            if (cust) {
                cust.logs.unshift({
                    date: new Date().toISOString().split('T')[0],
                    type: 'other',
                    content: `📁 Đã đính kèm tệp tài liệu mới: [${file.name}] (${fileSizeStr})`
                });
                cust.lastInteraction = new Date().toISOString().split('T')[0];
                saveCustomersToStorage();
                renderTimeline(cust);
            }
            
            // Vẽ lại danh sách tệp
            renderDocumentList(customerId);
            alert("Đã lưu trữ file thành công!");
        });
    };
    reader.readAsDataURL(file);
}

// Trợ giúp định dạng byte
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Chức năng tải xuống tệp từ IndexedDB về máy tính
function downloadCustomerFile(fileId) {
    if (!appState.db) return;
    
    const transaction = appState.db.transaction(["documents"], "readonly");
    const objectStore = transaction.objectStore("documents");
    const request = objectStore.get(fileId);
    
    request.onsuccess = (event) => {
        const doc = event.target.result;
        if (doc) {
            const link = document.createElement('a');
            link.href = doc.fileData;
            link.download = doc.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
}

// Chức năng xóa tệp
function deleteCustomerFile(fileId) {
    if (!confirm("Bạn có chắc chắn muốn xóa tệp này vĩnh viễn khỏi trình duyệt?")) return;
    
    deleteDocument(fileId, () => {
        renderDocumentList(appState.selectedCustomerId);
        alert("Đã xóa tệp thành công!");
    });
}

/* ========================================================================
   13. TRÌNH ĐỌC FILE EXCEL THÔNG MINH (SHEETJS EXCEL LOADER & MAPPER)
   ======================================================================== */
let parsedExcelData = null; // Chứa mảng thô các dòng được đọc ra từ file Excel

function triggerExcelInput() {
    document.getElementById('excel-file-input').click();
}

function initExcelDropZone() {
    const dropZone = document.getElementById('excel-drop-zone');
    const input = document.getElementById('excel-file-input');
    
    if (!dropZone || !input) return;
    
    // Click mở bộ chọn file mặc định
    dropZone.addEventListener('click', () => input.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--pink-primary)';
        dropZone.style.background = 'rgba(219,39,119,0.08)';
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--pink-secondary)';
        dropZone.style.background = 'rgba(219,39,119,0.02)';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--pink-secondary)';
        dropZone.style.background = 'rgba(219,39,119,0.02)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleExcelFileParsing(files[0]);
        }
    });
    
    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleExcelFileParsing(e.target.files[0]);
        }
    });
}

// Đọc phân tích file Excel nhị phân client-side qua thư viện SheetJS
function handleExcelFileParsing(file) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        alert("Vui lòng tải tệp Excel hợp lệ (.xlsx, .xls) hoặc tệp CSV!");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Lấy sheet đầu tiên
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Chuyển đổi thành mảng JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (jsonData.length < 2) {
                alert("Tệp Excel trống hoặc không đủ thông tin (cần có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu)!");
                return;
            }
            
            const headers = jsonData[0]; // dòng 1 chứa tiêu đề cột
            const rows = jsonData.slice(1); // các dòng tiếp theo
            
            parsedExcelData = {
                headers: headers,
                rows: rows
            };
            
            // Mở modal đối chiếu cột thông minh
            openExcelMappingModal(headers);
            
        } catch (err) {
            console.error("Lỗi đọc Excel:", err);
            alert("Không thể phân tích tệp Excel này! Chi tiết lỗi: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Hiện Modal đối chiếu cột Excel sang CRM
function openExcelMappingModal(headers) {
    const modal = document.getElementById('excel-mapping-modal');
    const container = document.getElementById('excel-mapping-fields');
    if (!modal || !container) return;
    
    container.innerHTML = '';
    
    // Định nghĩa các trường CRM cần ánh xạ
    const crmFields = [
        { key: "name", label: "Tên Khách Hàng (Bắt buộc)", required: true },
        { key: "company", label: "Tên Công Ty (Tùy chọn)", required: false },
        { key: "phone", label: "Số Điện Thoại (Tùy chọn)", required: false },
        { key: "email", label: "Địa Chỉ Email (Tùy chọn)", required: false },
        { key: "status", label: "Trạng Thái Bán Hàng (Tùy chọn)", required: false },
        { key: "priority", label: "Độ Ưu Tiên (Tùy chọn)", required: false },
        { key: "birthday", label: "Ngày Sinh (Tùy chọn)", required: false },
        { key: "country", label: "Quốc Tịch (Tùy chọn)", required: false },
        { key: "notes", label: "Ghi Chú/Mô Tả (Tùy chọn)", required: false }
    ];
    
    crmFields.forEach(field => {
        const row = document.createElement('div');
        row.className = 'mapping-row';
        
        // Cố gắng tự động đoán/match tiêu đề cột dựa trên tên tiếng Việt/tiếng Anh
        let matchedHeader = '';
        const fieldKeyLower = field.key.toLowerCase();
        const fieldLabelLower = field.label.toLowerCase();
        
        for (let h of headers) {
            const hLower = String(h).toLowerCase();
            if (hLower.includes(fieldKeyLower) || 
                hLower.includes('tên') && fieldKeyLower === 'name' ||
                hLower.includes('khách') && fieldKeyLower === 'name' ||
                hLower.includes('công ty') && fieldKeyLower === 'company' ||
                hLower.includes('điện thoại') && fieldKeyLower === 'phone' ||
                hLower.includes('sđt') && fieldKeyLower === 'phone' ||
                hLower.includes('thư') && fieldKeyLower === 'email' ||
                hLower.includes('trạng thái') && fieldKeyLower === 'status' ||
                hLower.includes('ưu tiên') && fieldKeyLower === 'priority' ||
                hLower.includes('sinh') && fieldKeyLower === 'birthday' ||
                hLower.includes('quốc') && fieldKeyLower === 'country' ||
                hLower.includes('ghi chú') && fieldKeyLower === 'notes') {
                matchedHeader = h;
                break;
            }
        }
        
        row.innerHTML = `
            <label>${field.label}</label>
            <select class="form-control mapping-select" data-field="${field.key}" ${field.required ? 'required' : ''}>
                <option value="">-- Bỏ qua cột này --</option>
                ${headers.map(h => `<option value="${h}" ${h === matchedHeader ? 'selected' : ''}>Cột: ${h}</option>`).join('')}
            </select>
        `;
        container.appendChild(row);
    });
    
    modal.classList.add('open');
}

function closeExcelMappingModal() {
    const modal = document.getElementById('excel-mapping-modal');
    modal.classList.remove('open');
    parsedExcelData = null;
}

// Bấm Xác Nhận nạp dữ liệu từ Excel đã đối chiếu vào danh sách
function confirmExcelImport() {
    if (!parsedExcelData) return;
    
    const selects = document.querySelectorAll('.mapping-select');
    const mapping = {};
    let nameFieldMapped = false;
    
    selects.forEach(sel => {
        const fieldKey = sel.getAttribute('data-field');
        const excelHeader = sel.value;
        if (excelHeader) {
            mapping[fieldKey] = parsedExcelData.headers.indexOf(excelHeader);
            if (fieldKey === 'name') nameFieldMapped = true;
        }
    });
    
    if (!nameFieldMapped) {
        alert("Bạn bắt buộc phải chọn cột ánh xạ cho trường [Tên Khách Hàng]!");
        return;
    }
    
    let importCount = 0;
    const today = new Date().toISOString().split('T')[0];
    
    parsedExcelData.rows.forEach(row => {
        // Lấy dữ liệu theo vị trí cột ánh xạ
        const nameVal = row[mapping['name']];
        if (!nameVal) return; // Bỏ qua dòng trống tên
        
        const companyVal = row[mapping['company']] || 'Công ty Tự Do';
        const phoneVal = String(row[mapping['phone']] || '0000000000').trim();
        const emailVal = row[mapping['email']] || 'chua.co.email@domain.com';
        
        // Trạng thái (Cố gắng ánh xạ sang quy trình chuẩn 7 bước)
        let statusVal = 'Khách hàng Mới';
        const rawStatus = String(row[mapping['status']] || '').toLowerCase();
        if (rawStatus.includes('liên hệ') || rawStatus.includes('contacted')) statusVal = 'Đã Liên Hệ';
        else if (rawStatus.includes('trao đổi') || rawStatus.includes('discussion')) statusVal = 'Đang Trao Đổi';
        else if (rawStatus.includes('báo giá') || rawStatus.includes('quotation')) statusVal = 'Đã Gửi Báo Giá';
        else if (rawStatus.includes('mẫu') || rawStatus.includes('sample')) statusVal = 'Đã Gửi Mẫu';
        else if (rawStatus.includes('thành công') || rawStatus.includes('won') || rawStatus.includes('chốt')) statusVal = 'Chốt Thành Công';
        else if (rawStatus.includes('thất bại') || rawStatus.includes('lost') || rawStatus.includes('tạm ngưng')) statusVal = 'Tạm Ngưng/Thất Bại';
        
        // Độ ưu tiên
        let priorityVal = 'Trung bình';
        const rawPriority = String(row[mapping['priority']] || '').toLowerCase();
        if (rawPriority.includes('cao') || rawPriority.includes('high')) priorityVal = 'Cao';
        else if (rawPriority.includes('thấp') || rawPriority.includes('low')) priorityVal = 'Thấp';
        
        // Sinh nhật (đưa về chuẩn yyyy-mm-dd nếu cần)
        let bdayVal = '';
        if (mapping['birthday'] !== undefined && row[mapping['birthday']]) {
            bdayVal = String(row[mapping['birthday']]).trim();
            // Nếu là dạng số sê-ri ngày của Excel, chuyển đổi
            if (!isNaN(bdayVal) && Number(bdayVal) > 10000) {
                const serial = Number(bdayVal);
                const utc_days  = Math.floor(serial - 25569);
                const utc_value = utc_days * 86400;
                const date_info = new Date(utc_value * 1000);
                bdayVal = date_info.toISOString().split('T')[0];
            }
        }
        
        const countryVal = row[mapping['country']] || 'Việt Nam';
        const notesVal = row[mapping['notes']] || 'Dữ liệu nhập từ file Excel.';
        
        const newCust = {
            id: "c-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
            name: String(nameVal).trim(),
            company: String(companyVal).trim(),
            phone: phoneVal,
            email: String(emailVal).trim(),
            source: "Excel Import",
            status: statusVal,
            priority: priorityVal,
            birthday: bdayVal,
            country: countryVal,
            dealValue: 0,
            dealStage: "Soạn thảo",
            lastInteraction: today,
            nextFollowUpDate: "",
            nextFollowUpType: "Call",
            notes: notesVal,
            logs: [
                { date: today, type: 'other', content: "Hồ sơ được tạo tự động thông qua tính năng nhập tệp Excel." }
            ]
        };
        
        appState.customers.unshift(newCust);
        importCount++;
    });
    
    saveCustomersToStorage();
    closeExcelMappingModal();
    
    // Đưa về màn hình Contacts để xem kết quả
    document.querySelector('.nav-item[data-tab="contacts"] .nav-link').click();
    
    alert(`Đã nhập khẩu thành công ${importCount} khách hàng vào hệ thống!`);
}

/* ========================================================================
   14. THAO TÁC SỰ KIỆN TRÊN MÀN HÌNH (ACTIONS HANDLERS)
   ======================================================================== */
function initActionHandlers() {
    // A. Mở modal thêm khách hàng thủ công
    const addBtn = document.getElementById('btn-add-customer');
    const modal = document.getElementById('add-customer-modal');
    if (addBtn && modal) {
        addBtn.addEventListener('click', () => {
            // Đặt ngày hôm nay làm giá trị mặc định cho lịch chăm sóc
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('add-next-date').value = today;
            modal.classList.add('open');
        });
    }
}

function closeAddCustomerModal() {
    const modal = document.getElementById('add-customer-modal');
    if (modal) modal.classList.remove('open');
}

// Bấm Lưu khi tạo khách hàng thủ công mới
function saveNewCustomer() {
    const name = document.getElementById('add-name').value.trim();
    const company = document.getElementById('add-company').value.trim();
    const phone = document.getElementById('add-phone').value.trim();
    const email = document.getElementById('add-email').value.trim();
    const source = document.getElementById('add-source').value;
    const status = document.getElementById('add-status').value;
    const priority = document.getElementById('add-priority').value;
    const birthday = document.getElementById('add-birthday').value;
    const country = document.getElementById('add-country').value;
    const dealValue = Number(document.getElementById('add-deal-value').value) || 0;
    const notes = document.getElementById('add-notes').value.trim();
    
    const nextDate = document.getElementById('add-next-date').value;
    const nextType = document.getElementById('add-next-type').value;

    if (!name) {
        alert("Vui lòng nhập họ và tên khách hàng!");
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    const newCust = {
        id: "c-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        name: name,
        company: company || "Cá nhân/Tự do",
        phone: phone || "Chưa có",
        email: email || "chua.co.email@domain.com",
        source: source,
        status: status,
        priority: priority,
        birthday: birthday,
        country: country,
        dealValue: dealValue,
        dealStage: "Soạn thảo",
        lastInteraction: today,
        nextFollowUpDate: nextDate,
        nextFollowUpType: nextType,
        notes: notes || "Không có ghi chú.",
        logs: [
            { date: today, type: 'other', content: "Tạo hồ sơ khách hàng mới thủ công trên CRM." }
        ]
    };
    
    if (nextDate) {
        newCust.logs.push({
            date: today,
            type: 'other',
            content: `📅 Đã lên lịch hẹn gọi/họp tiếp theo vào ngày ${nextDate}.`
        });
    }

    appState.customers.unshift(newCust);
    saveCustomersToStorage();
    closeAddCustomerModal();
    
    // Refresh màn hình tương ứng
    if (appState.activeTab === 'dashboard') renderDashboard();
    else if (appState.activeTab === 'contacts') renderContactsTable();
    else if (appState.activeTab === 'kanban') renderKanbanBoard();
    
    // Reset form
    document.getElementById('add-name').value = '';
    document.getElementById('add-company').value = '';
    document.getElementById('add-phone').value = '';
    document.getElementById('add-email').value = '';
    document.getElementById('add-birthday').value = '';
    document.getElementById('add-notes').value = '';
    document.getElementById('add-deal-value').value = 0;
    
    alert("Đã thêm khách hàng mới thành công!");
}

// Xóa khách hàng kèm hộp thoại xác nhận
function confirmDeleteCustomer(customerId) {
    const cust = appState.customers.find(c => c.id === customerId);
    if (!cust) return;
    
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn khách hàng [${cust.name}] và toàn bộ lịch sử tương tác khỏi hệ thống?`)) {
        appState.customers = appState.customers.filter(c => c.id !== customerId);
        saveCustomersToStorage();
        
        // Đồng thời xóa luôn các tài liệu đính kèm của khách hàng trong IndexedDB
        getDocumentsForCustomer(customerId, (docs) => {
            docs.forEach(doc => deleteDocument(doc.fileId));
        });
        
        if (appState.activeTab === 'contacts') renderContactsTable();
        alert(`Đã xóa khách hàng [${cust.name}] thành công!`);
    }
}

// Xuất toàn bộ cơ sở dữ liệu CRM ra tệp JSON dự phòng
function backupDatabase() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState.customers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `PinkCRM_DuPhong_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
}

// Nhập tệp dự phòng JSON vào CRM
function triggerImportBackup() {
    document.getElementById('backup-file-input').click();
}

function importDatabase(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                if (confirm(`Tìm thấy ${imported.length} khách hàng trong tệp dự phòng. Bạn có đồng ý ghi đè và nạp toàn bộ vào hệ thống không?`)) {
                    appState.customers = imported;
                    saveCustomersToStorage();
                    renderDashboard();
                    alert("Khôi phục cơ sở dữ liệu thành công!");
                }
            } else {
                alert("Tệp dự phòng JSON không đúng định dạng CRM!");
            }
        } catch (err) {
            alert("Lỗi đọc tệp dự phòng: " + err.message);
        }
    };
    reader.readAsText(file);
}
