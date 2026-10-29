// =========================================================
// PHẦN 1: CẤU HÌNH KẾT NỐI SUPABASE & BIẾN TOÀN CỤC
// =========================================================
const SUPABASE_URL = 'https://dvetgpjcqcjamslvjiuf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bCC1heNzUdnSNgHCNZcUhg_pI_XPRcg';

// Khai báo db chuẩn xác nhất
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.db = db; 

// Biến toàn cục 
let tatCaMauThiep = [];
let bieuDoThongKe = null;
let idDonHangVuaDat = null; // Biến nhớ ID đơn hàng để cho phép sửa/xóa

// Khởi chạy khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    taiDanhSachMauThiep();
    taiDanhSachDonHang();
    xuLyFormDatHang();
});

// =========================================================
// PHẦN 2: CÁC HÀM XỬ LÝ DỮ LIỆU CỐT LÕI
// =========================================================

// 2.1. TẢI VÀ HIỂN THỊ MẪU THIỆP 
async function taiDanhSachMauThiep() {
    const { data, error } = await db.from('mau_thiep').select('*').order('ma_code', { ascending: true });

    if (error) {
        console.error("Lỗi lấy mẫu thiệp:", error);
        document.getElementById('grid-mau-thiep').innerHTML = '<p style="color:red; text-align:center;">Lỗi kết nối CSDL!</p>';
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

// Cập nhật hỗ trợ hiển thị cả ảnh và Video cho mẫu thiệp
function renderTheThiep(danhSach) {
    const grid = document.getElementById('grid-mau-thiep');
    grid.innerHTML = ''; 

    if (danhSach.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%;">Không tìm thấy mẫu thiệp phù hợp.</p>';
        return;
    }

    danhSach.forEach(thiep => {
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

document.getElementById('filter-phong-cach').addEventListener('change', (e) => {
    const luaChon = e.target.value;
    if (luaChon === 'ALL') {
        renderTheThiep(tatCaMauThiep);
    } else {
        const danhSachDaLoc = tatCaMauThiep.filter(t => t.phong_cach === luaChon);
        renderTheThiep(danhSachDaLoc);
    }
});

// 2.2. XỬ LÝ FORM ĐẶT HÀNG (ĐÃ TÍCH HỢP SỬA & HỦY)
function xuLyFormDatHang() {
    const form = document.getElementById('form-dat-hang');
    const btnSubmit = document.getElementById('btn-gui-don');
    const btnHuyDon = document.getElementById('btn-huy-don');

    // Sự kiện khi bấm GỬI ĐƠN hoặc CẬP NHẬT
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const donHang = {
            ten_khach_hang: document.getElementById('ten_khach').value.trim(),
            so_dien_thoai: document.getElementById('so_dien_thoai').value.trim(),
            ma_code_thiep: document.getElementById('chon_mau_thiep').value,
            so_luong_in: parseInt(document.getElementById('so_luong').value),
            yeu_cau_customize: document.getElementById('yeu_cau_customize').value.trim()
        };

        if (idDonHangVuaDat === null) {
            // TRƯỜNG HỢP 1: CHƯA CÓ ĐƠN -> TẠO MỚI (INSERT)
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'ĐANG ĐẶT HÀNG...';

            const { data, error } = await db.from('don_dat_hang').insert([donHang]).select();

            if (error) {
                alert('Có lỗi xảy ra: ' + error.message);
                btnSubmit.textContent = 'GỬI ĐƠN ĐẶT HÀNG';
            } else if (data) {
                alert('🎉 Đặt hàng thành công! Bạn có thể xem lại hoặc Hủy/Sửa đơn bên dưới.');
                idDonHangVuaDat = data[0].id; // Lưu lại ID
                
                // Đổi giao diện
                btnSubmit.textContent = 'CẬP NHẬT THÔNG TIN';
                btnSubmit.style.backgroundColor = '#28a745';
                btnHuyDon.style.display = 'block';

                taiDanhSachDonHang();
                taiDanhSachMauThiep();
            }
            btnSubmit.disabled = false;

        } else {
            // TRƯỜNG HỢP 2: ĐÃ CÓ ID -> SỬA (UPDATE)
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'ĐANG CẬP NHẬT...';

            const { error } = await db.from('don_dat_hang').update(donHang).eq('id', idDonHangVuaDat);

            if (error) {
                alert('Lỗi khi cập nhật: ' + error.message);
            } else {
                alert('✅ Đã cập nhật thông tin đơn hàng thành công!');
                taiDanhSachDonHang();
            }
            btnSubmit.textContent = 'CẬP NHẬT THÔNG TIN';
            btnSubmit.disabled = false;
        }
    });

    // Sự kiện khi bấm HỦY ĐƠN VỪA ĐẶT
    btnHuyDon.addEventListener('click', async () => {
        if (!idDonHangVuaDat) return;

        const xacNhan = confirm("Bạn có chắc chắn muốn hủy đơn hàng vừa đặt này không?");
        
        if (xacNhan) {
            btnHuyDon.textContent = 'ĐANG XÓA...';
            btnHuyDon.disabled = true;

            const { error } = await db.from('don_dat_hang').delete().eq('id', idDonHangVuaDat);

            if (error) {
                alert('Lỗi khi hủy đơn: ' + error.message);
                btnHuyDon.textContent = 'HỦY ĐƠN VỪA ĐẶT';
                btnHuyDon.disabled = false;
            } else {
                alert('Đã hủy đơn hàng thành công!');
                
                // Trả giao diện về như cũ
                idDonHangVuaDat = null;
                btnHuyDon.style.display = 'none';
                btnHuyDon.disabled = false;
                btnHuyDon.textContent = 'HỦY ĐƠN VỪA ĐẶT';
                
                btnSubmit.textContent = 'GỬI ĐƠN ĐẶT HÀNG';
                btnSubmit.style.backgroundColor = '';
                
                form.reset();
                taiDanhSachDonHang();
            }
        }
    });
}

// 2.3. HIỂN THỊ BẢNG ĐƠN HÀNG
async function taiDanhSachDonHang() {
    const { data, error } = await db.from('don_dat_hang').select('*').order('id', { ascending: false }).limit(7);
    const tbody = document.getElementById('tbody-don-hang');
    
    if (error) {
        tbody.innerHTML = '<tr><td colspan="7">Lỗi tải dữ liệu đơn hàng.</td></tr>';
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Chưa có đơn hàng nào.</td></tr>';
        return;
    }