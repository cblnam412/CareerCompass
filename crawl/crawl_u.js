const axios = require('axios');
const cheerio = require('cheerio');
const ExcelJS = require('exceljs');

const BASE_API = 'https://diemthi.vnexpress.net/tra-cuu-dai-hoc/loadcollege';
const BASE_URL = 'https://diemthi.vnexpress.net/tra-cuu-dai-hoc';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

async function fetchPage(offset = 0, limit = 20, collegeType = 2) {
    const url = `${BASE_API}?location_id=-1&input_college=&offset=${offset}&limit=${limit}&college_type=${collegeType}`;
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Referer': BASE_URL,
                'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: 15000
        });
        return res.data;
    } catch (e) {
        console.error('Fetch error:', e.message || e);
        return null;
    }
}

async function fetchMainPage() {
    try {
        const res = await axios.get(BASE_URL, {
            headers: {
                'User-Agent': USER_AGENT
            },
            timeout: 15000
        });
        return res.data;
    } catch (e) {
        console.error('Fetch main page error:', e.message || e);
        return null;
    }
}

function extractFromResponse(resp) {
    if (!resp) return [];
    if (typeof resp === 'object' && Array.isArray(resp.data) && resp.data.length) {
        return resp.data.map(item => ({
            id: item.college_id || item.id || null,
            shortName: item.name || (item.title || '').trim(),
            fullName: item.college_name || null,
            slug: item.slug || '',
            url: item.slug && (`https://diemthi.vnexpress.net/tra-cuu-dai-hoc/${item.slug}-${item.college_id || item.id}`) || ''
        })).filter(x => x.id);
    }

    let htmlText = null;
    if (typeof resp === 'object' && typeof resp.html === 'string') {
        htmlText = resp.html;
    }

    if (typeof resp === 'string') {

        try {
            const maybeJson = JSON.parse(resp);
            if (maybeJson && typeof maybeJson.html === 'string') {
                htmlText = maybeJson.html;
            } else {

                htmlText = resp;
            }
        } catch (e) {

            htmlText = resp;
        }
    }

    if (!htmlText) return [];

    const $ = cheerio.load(htmlText);
    const found = new Map();

    $('.lookup__result').each((_, el) => {
        const shortName = $(el).find('.lookup__result-code strong').text().trim() || null;
        const fullName = $(el).find('.lookup__result-name strong').text().trim() || null;
        const href = $(el).find('a[href*="/tra-cuu-dai-hoc/"]').attr('href') || '';

        const m = href.match(/-(\d+)(?:[\/"]|$)/);
        if (m) {
            const id = Number(m[1]);
            if (!Number.isNaN(id) && !found.has(id)) {
                let slug = href.split('/').pop() || '';
                slug = slug.replace(/[?#].*$/, '').replace(/^\//, '');
                const url = href.startsWith('http') ? href : 'https://diemthi.vnexpress.net' + href;

                found.set(id, { id, shortName, fullName, slug, url });
            }
        }
    });

    return Array.from(found.values());

}

function extractFromMainPage(htmlContent) {
    const $ = cheerio.load(htmlContent);
    const found = new Map();

    // Tìm các phần tử lookup__result trên trang chính
    $('.lookup__result').each((_, el) => {
        const shortName = $(el).find('.lookup__result-code strong').text().trim() || null;
        const fullName = $(el).find('.lookup__result-name strong').text().trim() || null;
        const href = $(el).find('a[href*="/tra-cuu-dai-hoc/"]').attr('href') || '';

        const m = href.match(/-(\d+)(?:[\/"]|$)/);
        if (m) {
            const id = Number(m[1]);
            if (!Number.isNaN(id) && !found.has(id)) {
                let slug = href.split('/').pop() || '';
                slug = slug.replace(/[?#].*$/, '').replace(/^\//, '');
                const url = href.startsWith('http') ? href : 'https://diemthi.vnexpress.net' + href;

                found.set(id, { id, shortName, fullName, slug, url });
            }
        }
    });

    return Array.from(found.values());
}

async function getUniversityDetail(url) {
    try {
        const { data: html } = await axios.get(url, { timeout: 15000 });
        const $ = cheerio.load(html);

        let code = null;
        let region = null;
        let address = null;
        let phone1 = null;
        let phone2 = null;
        let website = null;

        // Lấy code từ thẻ h1 (format: "[CODE] - TênTrường")
        const h1Text = $('h1').text().trim();
        const codeMatch = h1Text.match(/^\[([^\]]+)\]/);
        if (codeMatch) {
            code = codeMatch[1];
            console.log(`    → Code: ${code}`);
        } else {
            console.log(`    ⚠ Không tìm thấy code từ h1`);
        }

        // Cố gắng lấy region từ nhiều nơi
        // 1. Từ thẻ strong chứa region sau mã
        if (!region) {
            $('strong[class]').each((_, el) => {
                const text = $(el).text().trim();
                if (text && text.length > 0 && !text.match(/^[A-Z]+\.?$/)) {
                    region = text;
                }
            });
        }

        // 2. Từ span hoặc div chứa region
        if (!region) {
            const vietnamCities = ['Hà Nội', 'Hồ Chí Minh', 'TP.HCM', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Bắc Ninh', 'Hải Dương', 'Hưng Yên', 'Thái Nguyên', 'Lạng Sơn', 'Quảng Ninh', 'Bắc Giang', 'Yên Bái', 'Tuyên Quang', 'Sơn La', 'Điện Biên', 'Lai Châu', 'Lào Cai', 'Hòa Bình', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận', 'Đồng Nai', 'Bà Rịa Vũng Tàu', 'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh', 'Vĩnh Long', 'An Giang', 'Kiên Giang', 'Cà Mau', 'Đắk Nông', 'Đắk Lắk', 'Gia Lai', 'Kon Tum', 'Lâm Đồng', 'Bình Phước', 'Tây Ninh', 'Vĩnh Phúc', 'Bắc Kạn', 'Cao Bằng'];
            const pageText = $('body').text();
            for (const city of vietnamCities) {
                if (pageText.includes(city)) {
                    region = city;
                    break;
                }
            }
        }

        // 3. Từ li chứa Tỉnh/Thành phố
        if (!region) {
            $('.main__content li').each((_, el) => {
                const text = $(el).text().trim();
                const elHtml = $(el).html() || '';

                if (elHtml.includes('Tỉnh') || elHtml.includes('Thành phố')) {
                    const matches = text.match(/(?:Tỉnh|Thành phố)[:\s]+([^:]*?)(?:\n|$)/);
                    if (matches) {
                        region = matches[1].trim() || null;
                    } else {
                        region = text.split(':').pop().trim() || null;
                    }
                }
            });
        }

        // Lấy thông tin từ các thẻ li trong main__content
        $('.main__content li').each((_, el) => {
            const text = $(el).text().trim();
            const elHtml = $(el).html() || '';

            // Địa chỉ
            if (text.includes('Địa chỉ')) {
                address = text.replace(/Địa\s*chỉ/, '').trim() || null;
            }

            // Website
            if (text.includes('Website')) {
                const link = $(el).find('a').attr('href');
                website = link || null;
            }

            // Điện thoại/Hotline
            if (text.includes('Điện thoại') || text.includes('Hotline')) {
                const phones = [];
                $(el).find('a').each((idx, link) => {
                    const phone = $(link).text().trim();
                    if (phone && phones.length < 2) {
                        phones.push(phone);
                    }
                });
                phone1 = phones[0] || null;
                phone2 = phones[1] || null;
            }
        });

        return { code, region, address, phone1, phone2, website };

    } catch (err) {
        console.error('Lỗi lấy chi tiết:', url, err.message);
        return { code: null, region: null, address: null, phone1: null, phone2: null, website: null };
    }
}


(async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Universities');

    // Thiết lập header
    sheet.columns = [
        { header: 'idTruong', key: 'id', width: 10 },
        { header: 'code', key: 'code', width: 15 },
        { header: 'fullName', key: 'fullName', width: 50 },
        { header: 'region', key: 'region', width: 20 },
        { header: 'address', key: 'address', width: 50 },
        { header: 'phone1', key: 'phone1', width: 20 },
        { header: 'phone2', key: 'phone2', width: 20 },
        { header: 'website', key: 'website', width: 40 },
        { header: 'slug', key: 'slug', width: 30 },
        { header: 'url', key: 'url', width: 60 },
    ];

    const allMap = new Map();
    const universities = [];

    // 1. Lấy các trường được load sẵn trên trang chính
    console.log('→ Lấy các trường được load sẵn trên trang chính...');
    const mainPageHtml = await fetchMainPage();
    if (mainPageHtml) {
        const mainPageUnis = extractFromMainPage(mainPageHtml);
        console.log(` Lấy được ${mainPageUnis.length} trường từ trang chính`);
        for (const uni of mainPageUnis) {
            if (!allMap.has(uni.id)) {
                allMap.set(uni.id, uni);
                universities.push(uni);
            }
        }
    }
    await new Promise(r => setTimeout(r, 500));

    // 2. Lấy dữ liệu từ API cho đại học (college_type=2)
    console.log('→ Lấy dữ liệu đại học từ API...');
    let offset = 0;
    const limit = 50;
    while (true) {
        console.log(`  Fetch offset=${offset}, college_type=2 (đại học)`);
        const resp = await fetchPage(offset, limit, 2);
        if (!resp) {
            console.log('  Không nhận được response, dừng.');
            break;
        }

        const items = extractFromResponse(resp);
        if (!items || items.length === 0) {
            console.log('  Hết dữ liệu.');
            break;
        }

        for (const it of items) {
            if (!allMap.has(it.id)) {
                allMap.set(it.id, it);
                universities.push(it);
            }
        }

        console.log(`  Lấy được ${items.length} mục (tổng: ${allMap.size})`);
        offset += limit;
        await new Promise(r => setTimeout(r, 250));
    }

    // 3. Lấy dữ liệu từ API cho cao đẳng (college_type=1)
    console.log('→ Lấy dữ liệu cao đẳng từ API...');
    offset = 0;
    while (true) {
        console.log(`  Fetch offset=${offset}, college_type=1 (cao đẳng)`);
        const resp = await fetchPage(offset, limit, 1);
        if (!resp) {
            console.log('  Không nhận được response, dừng.');
            break;
        }

        const items = extractFromResponse(resp);
        if (!items || items.length === 0) {
            console.log('  Hết dữ liệu.');
            break;
        }

        for (const it of items) {
            if (!allMap.has(it.id)) {
                allMap.set(it.id, it);
                universities.push(it);
            }
        }

        console.log(`  Lấy được ${items.length} mục (tổng: ${allMap.size})`);
        offset += limit;
        await new Promise(r => setTimeout(r, 250));
    }

    // 4. Lấy chi tiết từng trường
    console.log(`→ Lấy chi tiết cho ${universities.length} trường...`);
    const validUniversities = [];
    for (let i = 0; i < universities.length; i++) {
        const uni = universities[i];
        console.log(`  [${i + 1}/${universities.length}] Lấy dữ liệu trường ${uni.fullName || uni.shortName}`);
        const detail = await getUniversityDetail(uni.url);

        // Chỉ thêm nếu có ít nhất một thông tin chi tiết
        if (detail.code || detail.region || detail.address || detail.phone1 || detail.phone2 || detail.website) {
            uni.code = uni.shortName; // Code từ shortName (item.name từ API)
            uni.address = detail.address;
            uni.phone1 = detail.phone1;
            uni.phone2 = detail.phone2;
            uni.website = detail.website;
            uni.region = detail.region;
            console.log(`    ✓ Code: ${uni.code}, Region: ${uni.region}`);
            validUniversities.push(uni);
            //break;
        } else {
            console.log(`    ⚠ Bỏ qua - không có thông tin chi tiết`);
        }
        
        await new Promise(r => setTimeout(r, 100));
    }

    // 5. Ghi dữ liệu vào Excel
    const all = validUniversities.sort((a, b) => a.id - b.id);
    all.forEach(r => sheet.addRow(r));
    await workbook.xlsx.writeFile('Uni.xlsx');
    console.log(`✓ Hoàn tất, lưu ${all.length} trường vào Uni.xlsx (tổng lấy được: ${universities.length})`);
})();
