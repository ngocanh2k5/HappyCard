// =========================================================
// 1. CẤU HÌNH KẾT NỐI SUPABASE
// =========================================================
const SUPABASE_URL = 'https://dvetgpjcqcjamslvjiuf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bCC1heNzUdnSNgHCNZcUhg_pI_XPRcg';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    const { data, error } = await supabase
        .from('mau_thiep')
        .select('*')
        .order('ma_code', { ascending: true });

    if (error) {
        console.error("Lỗi lấy mẫu thiệp:", error);
        document.getElementById('grid-mau-thiep').innerHTML = '<p style="color:red; text-align:center;">Lỗi kết nối cơ sở dữ liệu!</p>';
        return;
    }

    tatCaMauThiep = data;
    
    // Hiển thị ra lưới
    renderTheThiep(tatCaMauThiep);
    
    // Đổ dữ liệu vào ô Select của Form đặt hàng
    const selectThiep = document.getElementById('chon_mau_thiep');
    selectThiep.innerHTML = '<option value="">-- Click để chọn mẫu thiệp --</option>';
    tatCaMauThiep.forEach(thiep => {
        const option = document.createElement('option');
        option.value = thiep.ma_code;
        option.textContent = `[${thiep.ma_code}] ${thiep.ten_thiep} - ${thiep.gia_tien.toLocaleString()} đ`;
        selectThiep.appendChild(option);
    });

    // Vẽ biểu đồ
    veBieuDoChartJS(tatCaMauThiep);
}

// Hàm in thẻ HTML cho từng mẫu thiệp
function renderTheThiep(danhSach) {
    const grid = document.getElementById('grid-mau-thiep');
    grid.innerHTML = ''; // Xóa trạng thái loading

    if (danhSach.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%;">Không tìm thấy mẫu thiệp phù hợp.</p>';
        return;
    }

    danhSach.forEach(thiep => {
        grid.innerHTML += `
            <div class="card">
                <img src="${thiep.hinh_anh}" alt="${thiep.ten_thiep}" class="card-img" loading="lazy">
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

// Bắt sự kiện người dùng Lọc phong cách thiệp
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
// 3. XỬ LÝ FORM ĐẶT HÀNG (THÊM VÀO BẢNG don_dat_hang)
// =========================================================
function xuLyFormDatHang() {
    const form = document.getElementById('form-dat-hang');
    const btnSubmit = document.getElementById('btn-submit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Ngăn trình duyệt reload
        
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'ĐANG XỬ LÝ ĐƠN HÀNG...';

        // Gom dữ liệu
        const donHangMoi = {
            ten_khach_hang: document.getElementById('ten_khach').value.trim(),
            so_dien_thoai: document.getElementById('so_dien_thoai').value.trim(),
            ma_code_thiep: document.getElementById('chon_mau_thiep').value,
            so_luong_in: parseInt(document.getElementById('so_luong').value),
            yeu_cau_customize: document.getElementById('yeu_cau_customize').value.trim()
        };

        // Bắn dữ liệu lên Supabase
        const { error } = await supabase.from('don_dat_hang').insert([donHangMoi]);

        if (error) {
            alert('Có lỗi xảy ra: ' + error.message);
        } else {
            alert('🎉 Chúc mừng! Đơn hàng của bạn đã được ghi nhận. (Hệ thống đã tự động tính tổng tiền ở Back-end).');
            form.reset();
            // Cập nhật lại Bảng và Biểu đồ ngay lập tức
            taiDanhSachDonHang();
            taiDanhSachMauThiep(); 
        }

        btnSubmit.disabled = false;
        btnSubmit.textContent = 'GỬI ĐƠN ĐẶT HÀNG';
    });
}

// =========================================================
// 4. HIỂN THỊ BẢNG ĐƠN HÀNG (TỪ BẢNG don_dat_hang)
// =========================================================
async function taiDanhSachDonHang() {
    // Chỉ lấy 7 đơn mới nhất để hiển thị ra bảng
    const { data, error } = await supabase
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
    
    // Tìm ra 5 mẫu thiệp có lượt đặt in cao nhất
    const top5 = [...danhSach]
        .sort((a, b) => b.luot_dat_mua - a.luot_dat_mua)
        .slice(0, 5);

    const nhanBieuDo = top5.map(t => t.ma_code + ' - ' + t.ten_thiep);
    const duLieuBieuDo = top5.map(t => t.luot_dat_mua);

    // Xóa biểu đồ cũ nếu có để vẽ lại bản cập nhật mới
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