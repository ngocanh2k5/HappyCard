// =========================================================
// 1. CẤU HÌNH KẾT NỐI SUPABASE
// =========================================================
const SUPABASE_URL = 'https://dvetgpjcqcjamslvjiuf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bCC1heNzUdnSNgHCNZcUhg_pI_XPRcg';

// CẬP NHẬT QUAN TRỌNG: Gắn db vào 'window' để file HTML có thể sử dụng chung kết nối này cho chức năng Đăng nhập Admin
window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Biến toàn cục lưu danh sách gốc để phục vụ tính năng Lọc
let tatCaMauThiep = [];
let bieuDoThongKe = null;

// Khởi chạy các hàm khi web vừa tải xong
document.addEventListener('DOMContentLoaded', () => {
    taiDanhSachMauThiep();
    taiDanhSachDonHang();
    xuLyFormDatHang();
});

// =========================================================
// 2. TẢI VÀ HIỂN THỊ MẪU THIỆP (TỪ BẢNG mau_thiep)
// =========================================================
async function taiDanhSachMauThiep() {
    const { data, error } = await window.db
        .from('mau_thiep')
        .select('*')
        .order('ma_code', { ascending: true });

    if (error) {
        console.error("Lỗi lấy mẫu thiệp:", error);
        document.getElementById('grid-mau-thiep').innerHTML = '<p style="color:red; text-align:center;">Lỗi kết nối cơ sở dữ liệu!</p>';
        return;
    }

    tatCaMauThiep = data;
    renderTheThiep(tatCaMauThiep);
    
    const selectThiep = document.getElementById('chon_mau_thiep');
    selectThiep.innerHTML = '<option value="">-- Click để chọn mẫu thiệp --</option>';
    tatCaMauThiep.forEach(thiep => {
        const option = document.createElement('option');
        option.value = thiep.ma_code;
        option.textContent = `[${thiep.ma_code}] ${thiep.ten_thiep} - ${thiep.gia_tien.toLocaleString()} đ`;
        selectThiep.appendChild(option);
    });

    veBieuDoChartJS(tatCaMauThiep);
}

// Hàm in thẻ HTML cho từng mẫu thiệp (Đã nâng cấp hỗ trợ Video)
function renderTheThiep(danhSach) {
    const grid = document.getElementById('grid-mau-thiep');
    grid.innerHTML = ''; 

    if (danhSach.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%;">Không tìm thấy mẫu thiệp phù hợp.</p>';
        return;
    }

    danhSach.forEach(thiep => {
        // Kiểm tra xem link dữ liệu là video (.mp4, .webm) hay là ảnh tĩnh
        let phanTuHienThi = '';
        const link = thiep.hinh_anh.toLowerCase();
        
        if (link.includes('.mp4') || link.includes('.webm')) {
            phanTuHienThi = `<video src="${thiep.hinh_anh}" class="card-img" autoplay loop muted playsinline style="object-fit: cover;"></video>`;
        } else {
            phanTuHienThi = `<img src="${thiep.hinh_anh}" alt="${thiep.ten_thiep}" class="card-img" loading="lazy">`;
        }

        grid.innerHTML += `
            <div class="card">
                ${phanTuHienThi}
                <div class="card-body">
                    <span class="card-badge">${thiep.phong_cach}</span>
                    <h3 class="card-title">${thiep.ten_thiep}</h3>
                    <div class="card-price">${thiep.gia_tien.toLocaleString()} VNĐ</div>
                    <div class="card-orders">Đã bán: <strong>${thiep.luot_dat_mua}</strong> thiệp</div>
                </div>
            </div>
        `;
    });
}

// Lọc phong cách thiệp
document.getElementById('filter-phong-cach').addEventListener('change', (e) => {
    const luaChon = e.target.value;
    if (luaChon === 'ALL') {
        renderTheThiep(tatCaMauThiep);
    } else {
        const danhSachDaLoc = tatCaMauThiep.filter(t => t.phong_cach === luaChon);
        renderTheThiep(danhSachDaLoc);
    }
});

// =========================================================
// 3. XỬ LÝ FORM ĐẶT HÀNG
// =========================================================
function xuLyFormDatHang() {
    const form = document.getElementById('form-dat-hang');
    const btnSubmit = document.getElementById('btn-submit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'ĐANG XỬ LÝ ĐƠN HÀNG...';

        const donHangMoi = {
            ten_khach_hang: document.getElementById('ten_khach').value.trim(),
            so_dien_thoai: document.getElementById('so_dien_thoai').value.trim(),
            ma_code_thiep: document.getElementById('chon_mau_thiep').value,
            so_luong_in: parseInt(document.getElementById('so_luong').value),
            yeu_cau_customize: document.getElementById('yeu_cau_customize').value.trim()
        };

        const { error } = await window.db.from('don_dat_hang').insert([donHangMoi]);

        if (error) {
            alert('Có lỗi xảy ra: ' + error.message);
        } else {
            alert('🎉 Chúc mừng! Đơn hàng của bạn đã được ghi nhận.');
            form.reset();
            taiDanhSachDonHang();
            taiDanhSachMauThiep(); 
        }

        btnSubmit.disabled = false;
        btnSubmit.textContent = 'GỬI ĐƠN ĐẶT HÀNG';
    });
}

// =========================================================
// 4. HIỂN THỊ BẢNG ĐƠN HÀNG
// =========================================================
async function taiDanhSachDonHang() {
    const { data, error } = await window.db
        .from('don_dat_hang')
        .select('*')
        .order('id', { ascending: false })
        .limit(7);

    const tbody = document.getElementById('tbody-don-hang');
    
    if (error) {
        tbody.innerHTML = '<tr><td colspan="7">Lỗi tải dữ liệu đơn hàng.</td></tr>';
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Chưa có đơn hàng nào.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(don => {
        // Cứ in nguyên bản dữ liệu ra. File HTML của bạn có một đoạn mã cực kỳ thông minh 
        // tự động nhận diện và che giấu cột số điện thoại này nếu chưa đăng nhập.
        tbody.innerHTML += `
            <tr>
                <td>#${don.id}</td>
                <td><strong>${don.ten_khach_hang}</strong></td>
                <td>${don.so_dien_thoai}</td>
                <td>${don.ma_code_thiep}</td>
                <td>${don.so_luong_in}</td>
                <td class="tien-te">${parseInt(don.tong_tien).toLocaleString()} đ</td>
                <td><span class="status-badge">${don.trang_thai}</span></td>
            </tr>
        `;
    });
}

// =========================================================
// 5. VẼ BIỂU ĐỒ THỐNG KÊ (SỬ DỤNG CHART.JS)
// =========================================================
function veBieuDoChartJS(danhSach) {
    const ctx = document.getElementById('chart-luot-dat').getContext('2d');
    
    const top5 = [...danhSach]
        .sort((a, b) => b.luot_dat_mua - a.luot_dat_mua)
        .slice(0, 5);

    const nhanBieuDo = top5.map(t => t.ma_code + ' - ' + t.ten_thiep);
    const duLieuBieuDo = top5.map(t => t.luot_dat_mua);

    if (bieuDoThongKe) {
        bieuDoThongKe.destroy();
    }

    bieuDoThongKe = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nhanBieuDo,
            datasets: [{
                label: 'Tổng lượt đặt in thiệp',
                data: duLieuBieuDo,
                backgroundColor: 'rgba(194, 24, 91, 0.6)',
                borderColor: '#c2185b',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}