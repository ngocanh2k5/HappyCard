/* ==========================================================
   script-extra.js — JS mở rộng (tách từ 3 thẻ <script> inline trong index.html)
   Nạp SAU script.js vì dùng các biến/hàm của script.js:
   tatCaMauThiep, db (Supabase), taiDanhSachDonHang
   Gồm 3 khối: (1) Nội dung thiệp + popup + admin, (2) Cấu hình liên hệ, (3) Băng chuyền 3D
   ========================================================== */

/* ===== KHỐI 1: Tự động gom nội dung, nén ảnh Base64 & phân quyền xem chi tiết ===== */
(() => {
    const $ = (id) => document.getElementById(id);
    const $$ = (s) => [...document.querySelectorAll(s)];
    const val = (id) => $(id).value.trim();
    const radio = (n) => ($$(`input[name="${n}"]:checked`)[0] || {}).value || '';
    const mk = (tag, cls, txt) => { const e = document.createElement(tag); e.className = cls; e.textContent = txt || ''; return e; };
    const dsMau = () => (typeof tatCaMauThiep !== 'undefined' ? tatCaMauThiep : []);

    let base64AnhRe = '';
    let base64AnhDau = '';

    function docFileBase64(file, callback) {
        if (!file) return callback('');
        const reader = new FileReader();
        reader.onload = (e) => callback(e.target.result);
        reader.readAsDataURL(file);
    }

    function popup(id, onClose) {
        const ov = $(id);
        const open = () => { ov.classList.add('open'); ov.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
        const close = () => { ov.classList.remove('open'); ov.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (onClose) onClose(); };
        ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('[data-close]')) close(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ov.classList.contains('open')) close(); });
        return { open, close };
    }

    const pv = popup('preview-overlay');
    let tenThiep = '';
    $('grid-mau-thiep').addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (!card) return;
        const txt = (s) => (card.querySelector(s) || {}).textContent || '';
        const img = card.querySelector('.card-img');
        $('pv-img').src = img ? img.src : '';
        $('pv-img').alt = img ? img.alt : '';
        $('pv-img').parentElement.scrollTop = 0;
        tenThiep = txt('.card-title');
        $('pv-badge').textContent = txt('.card-badge');
        $('pv-title').textContent = tenThiep;
        $('pv-price').textContent = txt('.card-price');
        $('pv-sold').textContent = txt('.card-orders');
        pv.open();
    });
    $('pv-order').addEventListener('click', () => {
        const opt = [...$('chon_mau_thiep').options].find((o) => o.value && o.textContent.includes('] ' + tenThiep + ' -'));
        if (opt) $('chon_mau_thiep').value = opt.value;
        pv.close();
        tamTinh();
        $('dat-hang').scrollIntoView({ behavior: 'smooth' });
    });

    function tamTinh() {
        const sl = parseInt($('so_luong').value) || 0;
        const mau = dsMau().find((t) => t.ma_code === $('chon_mau_thiep').value);
        const gia = mau ? Number(mau.gia_tien) : 0;
        $('preview-giam-gia').textContent = sl >= 500 ? '🎉 Đã áp dụng giảm 10% (từ 500 thiệp)' : '';
        $('preview-don-gia').textContent = gia.toLocaleString() + ' đ';
        $('preview-tong-tien').textContent = Math.round(gia * sl * (sl >= 500 ? 0.9 : 1)).toLocaleString() + ' đ';
    }
    $('chon_mau_thiep').addEventListener('change', tamTinh);
    $('so_luong').addEventListener('input', tamTinh);

    const bat = (k) => { const sw = document.querySelector(`[data-sec="${k}"] .ct-switch input`); return !sw || sw.checked; };
    $$('.ct-sec').forEach((sec) => {
        const sw = sec.querySelector('.ct-switch input');
        sec.querySelector('.ct-head').addEventListener('click', (e) => { if (!e.target.closest('.ct-switch')) sec.classList.toggle('collapsed'); });
        if (sw) sw.addEventListener('change', () => sec.classList.toggle('off', !sw.checked));
    });

    let lastAuto = '';
    const dongBoTen = () => {
        const re = val('ct_re'), dau = val('ct_dau'), o = $('ten_khach');
        if (re && dau && (o.value === '' || o.value === lastAuto)) o.value = lastAuto = re + ' & ' + dau;
    };
    $('ct_re').addEventListener('input', dongBoTen);
    $('ct_dau').addEventListener('input', dongBoTen);

    $('ct_anh_re').addEventListener('change', (e) => {
        const f = e.target.files[0], box = $('pv_re');
        box.textContent = '🖼';
        if (!f) { base64AnhRe = ''; return; }
        docFileBase64(f, (res) => {
            base64AnhRe = res;
            box.innerHTML = `<img src="${res}" style="width:100%;height:100%;object-fit:cover;">`;
        });
    });

    $('ct_anh_dau').addEventListener('change', (e) => {
        const f = e.target.files[0], box = $('pv_dau');
        box.textContent = '🖼';
        if (!f) { base64AnhDau = ''; return; }
        docFileBase64(f, (res) => {
            base64AnhDau = res;
            box.innerHTML = `<img src="${res}" style="width:100%;height:100%;object-fit:cover;">`;
        });
    });

    const TIEU_DE = { 'Tiệc cưới': 'THÔNG TIN TIỆC CƯỚI', 'Tiệc báo hỷ': 'THÔNG TIN TIỆC BÁO HỶ', 'Tiệc đính hôn': 'THÔNG TIN TIỆC ĐÍNH HÔN' };
    let tiecTruoc = 'Tiệc cưới';
    $$('input[name="ct_loai_tiec"]').forEach((r) => r.addEventListener('change', () => {
        if (!r.checked) return;
        const t = $('ct_tiec_tieude');
        if (t.value === '' || t.value === TIEU_DE[tiecTruoc]) t.value = TIEU_DE[r.value];
        tiecTruoc = r.value;
    }));

    function taoDS(listId, addId, nhan, gridCls, fields, macDinh) {
        const list = $(listId);
        const head = '<div class="ct-row-head"><span class="ct-row-title"></span><span class="ct-row-tools">' +
            '<button type="button" data-a="up" title="Lên">▲</button><button type="button" data-a="down" title="Xuống">▼</button>' +
            '<button type="button" data-a="del" title="Xoá">🗑</button></span></div>';
        const body = `<div class="ct-grid ${gridCls}">` + fields.map(([f, l, t, p]) =>
            `<label class="lbw"><span>${l}</span><input type="${t}" class="form-input" data-f="${f}"${p ? ` placeholder="${p}"` : ''}></label>`).join('') + '</div>';
        const danhSo = () => [...list.children].forEach((r, i) => { r.querySelector('.ct-row-title').textContent = nhan + ' ' + (i + 1); });
        const them = (v = {}) => {
            const r = mk('div', 'ct-row');
            r.innerHTML = head + body;
            Object.entries(v).forEach(([k, x]) => { r.querySelector(`[data-f="${k}"]`).value = x; });
            list.append(r);
            danhSo();
        };
        list.addEventListener('click', (e) => {
            const b = e.target.closest('button[data-a]');
            if (!b) return;
            const r = b.closest('.ct-row'), a = b.dataset.a;
            if (a === 'del') r.remove();
            else if (a === 'up' && r.previousElementSibling) r.previousElementSibling.before(r);
            else if (a === 'down' && r.nextElementSibling) r.nextElementSibling.after(r);
            danhSo();
        });
        $(addId).addEventListener('click', () => them());
        const khoiTao = () => { list.innerHTML = ''; macDinh.forEach((v) => them(v)); };
        khoiTao();
        return { khoiTao, hang: () => [...list.children].map((r) => (k) => r.querySelector(`[data-f="${k}"]`).value.trim()) };
    }
    const dsLe = taoDS('ct_le_list', 'ct_le_add', 'Lễ', '', [['ten', 'Tên lễ', 'text', 'VD: Lễ Vu Quy'], ['dd', 'Địa điểm', 'text', 'VD: Tư gia nhà gái'], ['ngay', 'Ngày', 'date'], ['gio', 'Giờ', 'time']], []);
    const dsLt = taoDS('ct_lt_list', 'ct_lt_add', 'Hoạt động', 'time', [['gio', 'Giờ', 'time'], ['nd', 'Nội dung', 'text', 'VD: Đón khách']], [{ gio: '17:30', nd: 'Đón khách' }, { gio: '18:30', nd: 'Khai tiệc' }]);

    const ngay = (v) => (v ? v.split('-').reverse().join('/') : '');
    const gio = (v, fmt) => {
        if (!v) return '';
        const [h, m] = v.split(':'), hh = parseInt(h, 10);
        return fmt === '24 giờ' ? String(hh).padStart(2, '0') + ':' + m : (hh % 12 || 12) + ':' + m + ' ' + (hh < 12 ? 'SA' : 'CH');
    };

    function tomTat() {
        const fmt = radio('ct_tiec_fmt'), out = [];
        const them = (tieu, lines) => { lines = lines.filter(Boolean); if (lines.length) out.push('[' + tieu + ']\n' + lines.join('\n')); };
        const nguoi = (vai, ten, dx) => (ten ? vai + ': ' + ten + (dx ? ' - ' + dx : '') : '');
        const tieuDe = (id) => (val(id) ? 'Tiêu đề: ' + val(id) : '');

        const re = val('ct_re'), dau = val('ct_dau');
        them('Thông tin cơ bản', [nguoi('Chú rể', re, val('ct_dx_re')), nguoi('Cô dâu', dau, val('ct_dx_dau')), re || dau ? 'Thứ tự hiển thị: ' + radio('ct_thu_tu') : '']);

        if (bat('anh')) {
            them('Ảnh đôi', [
                base64AnhRe ? '[ANH_RE]' + base64AnhRe + '[/ANH_RE]' : '',
                base64AnhDau ? '[ANH_DAU]' + base64AnhDau + '[/ANH_DAU]' : ''
            ]);
        }
        if (bat('thongbao')) them('Lời thông báo', [val('ct_thongbao').replace(/\s*\n\s*/g, ' / ')]);
        if (bat('giadinh')) {
            const nha = (ten, p) => {
                const o = val(p + '_ong'), b = val(p + '_ba'), dx = val(p + '_dx'), dc = val(p + '_dc');
                const ds = [dx && '(' + dx + ')', o && 'Ông ' + o, b && 'Bà ' + b].filter(Boolean).join(', ');
                return [o || b ? ten + ': ' + ds : '', dc ? 'Địa chỉ ' + ten.toLowerCase() + ': ' + dc : ''];
            };
            them('Thông tin gia đình', [...nha('Nhà trai', 'ct_nt'), ...nha('Nhà gái', 'ct_ng')]);
        }
        const le = dsLe.hang().map((g) => [g('ten'), ngay(g('ngay')), gio(g('gio'), fmt), g('dd')].filter(Boolean).join(' | ')).filter(Boolean);
        if (le.length) them('Lễ', [tieuDe('ct_le_tieude'), ...le]);
        if (bat('tiec')) {
            const n = ngay(val('ct_tiec_ngay')), g = gio(val('ct_tiec_gio'), fmt);
            them(radio('ct_loai_tiec') || 'Tiệc', [tieuDe('ct_tiec_tieude'), n && 'Ngày: ' + n, g && 'Giờ: ' + g]);
        }
        if (bat('lichtrinh')) {
            const hd = dsLt.hang().map((g) => [gio(g('gio'), fmt), g('nd')].filter(Boolean).join(' - ')).filter(Boolean);
            if (hd.length) them('Lịch trình ngày cưới', [tieuDe('ct_lt_tieude'), ...hd]);
        }
        if (bat('camon')) them('Lời cảm ơn', [val('ct_camon')]);
        return out.length ? '--- NỘI DUNG THIỆP ---\n' + out.join('\n\n') : '';
    }

    document.addEventListener('submit', (e) => {
        if (e.target.id !== 'form-dat-hang') return;
        const ta = $('yeu_cau_customize'), goc = ta.value, g = goc.trim(), t = tomTat();
        ta.value = g && t ? g + '\n\n' + t : g || t;
        setTimeout(() => { ta.value = goc; }, 0);
    }, true);

    $('form-dat-hang').addEventListener('reset', () => setTimeout(() => {
        base64AnhRe = '';
        base64AnhDau = '';
        tamTinh();
        lastAuto = ''; tiecTruoc = 'Tiệc cưới';
        $('pv_re').textContent = $('pv_dau').textContent = '🖼';
        dsLe.khoiTao(); dsLt.khoiTao();
        $$('.ct-sec').forEach((s) => { const sw = s.querySelector('.ct-switch input'); s.classList.toggle('off', !!sw && !sw.checked); });
    }, 0));

    // Quản trị viên
    const QT = { isAdmin: false, mask: (p) => { p = String(p == null ? '' : p); return p.length > 6 ? p.slice(0, 3) + '*'.repeat(p.length - 6) + p.slice(-3) : p; } };
    const ad = popup('ad-overlay'), tb = $('tbody-don-hang'), toggle = $('admin-toggle');
    const taiLaiBang = () => { if (typeof taiDanhSachDonHang === 'function') taiDanhSachDonHang(); };
    const capNhatNut = () => { toggle.textContent = QT.isAdmin ? '🔓 Đăng xuất' : '🔒 Quản trị'; };

    new MutationObserver(() => {
        if (QT.isAdmin) return;
        [...tb.rows].forEach((tr) => { const c = tr.cells[2], s = c && c.textContent.trim(); if (s && /^\d{7,}$/.test(s)) c.textContent = QT.mask(s); });
    }).observe(tb, { childList: true });

    toggle.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!QT.isAdmin) { $('ad-err').textContent = ''; ad.open(); setTimeout(() => $('ad-email').focus(), 50); return; }
        try { await db.auth.signOut(); } catch (x) {}
        QT.isAdmin = false; capNhatNut(); taiLaiBang();
    });

    $('ad-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = $('ad-submit'), err = $('ad-err');
        btn.disabled = true; err.textContent = '';
        try {
            const { error } = await db.auth.signInWithPassword({ email: val('ad-email'), password: $('ad-pass').value });
            if (error) err.textContent = 'Đăng nhập thất bại: ' + error.message;
            else { QT.isAdmin = true; $('ad-pass').value = ''; ad.close(); capNhatNut(); taiLaiBang(); }
        } catch (x) { err.textContent = 'Không kết nối được hệ thống: ' + x.message; }
        btn.disabled = false;
    });

    (async () => {
        try { const { data } = await db.auth.getSession(); if (data && data.session) { QT.isAdmin = true; capNhatNut(); taiLaiBang(); } } catch (x) {}
    })();

    // Chi tiết đơn hàng
    let token = 0;
    const od = popup('od-overlay', () => { token++; });
    const thongBao = (t) => { $('od-body').replaceChildren(mk('div', 'od-msg', t)); };

    function hienThi(don) {
        const admin = QT.isAdmin;
        const dl = mk('dl', 'od-list');
        const ngayDat = (v) => { const t = new Date(v); return isNaN(t) ? String(v) : t.toLocaleString('vi-VN'); };

        dl.append(mk('dt', '', 'Mã đơn'), mk('dd', '', '#' + don.id));
        dl.append(mk('dt', '', 'Khách hàng'), mk('dd', '', don.ten_khach_hang || ''));
        dl.append(mk('dt', '', 'Số điện thoại'), mk('dd', '', admin ? String(don.so_dien_thoai) : QT.mask(don.so_dien_thoai)));

        const m = dsMau().find((t) => t.ma_code === don.ma_code_thiep);
        dl.append(mk('dt', '', 'Mẫu thiệp'), mk('dd', '', m ? `[${don.ma_code_thiep}] ${m.ten_thiep} (${m.phong_cach})` : don.ma_code_thiep));
        dl.append(mk('dt', '', 'Số lượng in'), mk('dd', '', Number(don.so_luong_in).toLocaleString() + ' thiệp'));
        dl.append(mk('dt', '', 'Tổng tiền'), mk('dd', 'od-money', parseInt(don.tong_tien).toLocaleString() + ' đ'));
        dl.append(mk('dt', '', 'Trạng thái'), mk('dd', '', don.trang_thai || 'Mới đặt'));
        if (don.created_at) dl.append(mk('dt', '', 'Ngày đặt'), mk('dd', '', ngayDat(don.created_at)));

        dl.append(mk('dt', '', 'Nội dung thiệp / Chi tiết'));

        if (!admin) {
            const ddKhoa = mk('dd', 'od-note');
            ddKhoa.innerHTML = '<span style="color:#c2185b;font-weight:600;">🔒 Thông tin riêng tư</span> — Chỉ Quản trị viên mới xem được thông tin in thiệp và ảnh cưới của khách. (Vui lòng bấm <b>Quản trị</b> ở thanh menu trên cùng để đăng nhập).';
            dl.append(ddKhoa);
        } else {
            let rawText = don.yeu_cau_customize || '';
            let anhReSrc = '', anhDauSrc = '';

            const matchRe = rawText.match(/\[ANH_RE\](.*?)\[\/ANH_RE\]/);
            if (matchRe) {
                anhReSrc = matchRe[1];
                rawText = rawText.replace(matchRe[0], '');
            }

            const matchDau = rawText.match(/\[ANH_DAU\](.*?)\[\/ANH_DAU\]/);
            if (matchDau) {
                anhDauSrc = matchDau[1];
                rawText = rawText.replace(matchDau[0], '');
            }

            const ddChiTiet = mk('dd', '');

            if (anhReSrc || anhDauSrc) {
                const wrapAnh = mk('div', '');
                wrapAnh.style.cssText = 'display:flex;gap:20px;margin-bottom:12px;background:#fdf7f9;padding:12px 16px;border-radius:8px;border:1px dashed #e3d6db;';
                wrapAnh.innerHTML = `
                    ${anhReSrc ? `<div style="text-align:center;"><img src="${anhReSrc}" style="width:85px;height:85px;border-radius:50%;object-fit:cover;border:2px solid #c2185b;display:block;"><small style="color:#555;font-weight:600;display:block;margin-top:4px;">Chú rể</small></div>` : ''}
                    ${anhDauSrc ? `<div style="text-align:center;"><img src="${anhDauSrc}" style="width:85px;height:85px;border-radius:50%;object-fit:cover;border:2px solid #c2185b;display:block;"><small style="color:#555;font-weight:600;display:block;margin-top:4px;">Cô dâu</small></div>` : ''}
                `;
                ddChiTiet.append(wrapAnh);
            }

            const wrapNote = mk('div', 'od-note');
            wrapNote.textContent = rawText.trim() || 'Khách không điền thêm thông tin hoặc yêu cầu nào.';
            ddChiTiet.append(wrapNote);

            dl.append(ddChiTiet);
        }

        $('od-body').replaceChildren(dl);
    }

    tb.addEventListener('click', async (e) => {
        const tr = e.target.closest('tr');
        const m = tr && tr.cells.length && /^#(\d+)$/.exec(tr.cells[0].textContent.trim());
        if (!m) return;
        const id = parseInt(m[1], 10), my = ++token;
        $('od-title').textContent = 'Chi tiết đơn hàng #' + id;
        thongBao('Đang tải thông tin đơn hàng...');
        od.open();
        try {
            const { data, error } = await db.from('don_dat_hang').select('*').eq('id', id).single();
            if (my !== token) return;
            if (error || !data) thongBao('Không tải được đơn hàng' + (error ? ': ' + error.message : '.'));
            else hienThi(data);
        } catch (err) {
            if (my === token) thongBao('Không tải được đơn hàng: ' + err.message);
        }
    });
})();

/* ===== KHỐI 2: CẤU HÌNH LIÊN HỆ — chỉ cần sửa 3 dòng trong LIEN_HE ===== */
(() => {
    const LIEN_HE = {
        zalo: '0900000000',        // Số điện thoại Zalo của shop (số thôi, không dấu cách)
        messenger: 'ten-fanpage',  // Tên/ID fanpage Facebook (phần sau facebook.com/)
        dienThoai: '0900000000'    // Số hotline để khách bấm gọi
    };
    const href = {
        zalo: 'https://zalo.me/' + LIEN_HE.zalo,
        mess: 'https://m.me/' + LIEN_HE.messenger,
        tel: 'tel:' + LIEN_HE.dienThoai
    };
    document.querySelectorAll('[data-ct]').forEach((a) => { a.href = href[a.dataset.ct]; });
})();

/* ===== KHỐI 3: BĂNG CHUYỀN 3D & chuyển màn hình Landing <-> giao diện chính ===== */
(() => {
    const $ = (id) => document.getElementById(id);
    const stage = $('cf-stage'), dots = $('cf-dots'), cap = $('cf-cap'), grid = $('grid-mau-thiep');
    let items = [], dotEls = [], cards = [], cur = 0, moved = false;

    function layout() {
        if (!items.length) return;
        const w = items[0].offsetWidth || 300;
        items.forEach((it, i) => {
            const d = i - cur, a = Math.abs(d), s = Math.sign(d);
            const x = a === 0 ? 0 : s * (w * 0.72 + (a - 1) * w * 0.3);
            const z = a === 0 ? 0 : -120 - a * 40;
            const r = a === 0 ? 0 : -s * 38;
            it.style.transform = `translate(-50%,-50%) translateX(${x}px) translateZ(${z}px) rotateY(${r}deg)`;
            it.style.opacity = a > 5 ? 0 : Math.max(0.15, 1 - a * 0.17);
            it.style.zIndex = 100 - a;
            it.style.pointerEvents = a > 5 ? 'none' : 'auto';
            it.classList.toggle('center', a === 0);
        });
        dotEls.forEach((d, i) => d.classList.toggle('active', i === cur));
        const c = cards[cur];
        if (c) {
            const t = (s) => (c.querySelector(s) || {}).textContent || '';
            cap.textContent = [t('.card-title'), t('.card-price')].filter(Boolean).join(' · ');
        }
    }

    function go(i) {
        if (!items.length) return;
        cur = (i + items.length) % items.length;
        layout();
    }

    /* Chuyển từ trang đầu sang giao diện chính khi bấm mẫu */
    function enter(i) {
        const card = cards[i];
        document.body.classList.remove('landing-on'); // Ẩn màn hình intro
        window.scrollTo(0, 0);
        if (!card) return;
        setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.remove('card-pick');
            void card.offsetWidth;
            card.classList.add('card-pick');
            setTimeout(() => card.classList.remove('card-pick'), 2600);
        }, 60);
    }

    function build() {
        cards = [...grid.querySelectorAll('.card')];
        stage.innerHTML = ''; dots.innerHTML = ''; items = []; dotEls = [];
        if (!cards.length) { stage.innerHTML = '<p class="cf-empty">Đang tải mẫu thiệp...</p>'; cap.textContent = ''; return; }
        if (cur >= cards.length) cur = 0;
        cards.forEach((c, i) => {
            const im = c.querySelector('.card-img');
            const it = document.createElement('div');
            it.className = 'cf-item';
            const img = document.createElement('img');
            img.src = im ? im.src : '';
            img.alt = im ? im.alt : '';
            img.draggable = false;
            it.append(img);
            it.addEventListener('click', () => { if (moved) return; i === cur ? enter(i) : go(i); });
            stage.append(it); items.push(it);
            const d = document.createElement('button');
            d.type = 'button'; d.className = 'cf-dot'; d.setAttribute('aria-label', 'Mẫu ' + (i + 1));
            d.addEventListener('click', () => go(i));
            dots.append(d); dotEls.push(d);
        });
        layout();
    }

    let pending = false;
    new MutationObserver(() => {
        if (pending) return; pending = true;
        requestAnimationFrame(() => { pending = false; build(); });
    }).observe(grid, { childList: true });
    build();

    $('cf-prev').addEventListener('click', () => go(cur - 1));
    $('cf-next').addEventListener('click', () => go(cur + 1));
    window.addEventListener('resize', layout);

    document.addEventListener('keydown', (e) => {
        if (!document.body.classList.contains('landing-on')) return;
        if (e.key === 'ArrowLeft') go(cur - 1);
        else if (e.key === 'ArrowRight') go(cur + 1);
        else if (e.key === 'Enter') enter(cur);
    });

    let sx = null;
    stage.addEventListener('pointerdown', (e) => { sx = e.clientX; moved = false; });
    window.addEventListener('pointerup', (e) => {
        if (sx === null) return;
        const dx = e.clientX - sx; sx = null;
        if (Math.abs(dx) > 50) { moved = true; go(cur + (dx < 0 ? 1 : -1)); setTimeout(() => { moved = false; }, 50); }
    });

    stage.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 30) { e.preventDefault(); go(cur + (e.deltaX > 0 ? 1 : -1)); }
    }, { passive: false });

    /* Nút "Xem tất cả dạng lưới" -> Sang giao diện chính */
    $('lp-skip').addEventListener('click', () => {
        document.body.classList.remove('landing-on');
        window.scrollTo(0, 0);
        setTimeout(() => $('bo-suu-tap').scrollIntoView({ behavior: 'smooth' }), 60);
    });

    /* Bấm logo ở Navbar -> Quay lại màn hình Intro trang đầu */
    document.querySelector('.navbar .logo').addEventListener('click', () => {
        document.body.classList.add('landing-on');
        window.scrollTo(0, 0);
        layout();
    });
})();
