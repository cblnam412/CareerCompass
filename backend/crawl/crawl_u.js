const axios = require('axios');
const cheerio = require('cheerio');
const ExcelJS = require('exceljs');

const BASE_API = 'https://diemthi.vnexpress.net/tra-cuu-dai-hoc/loadcollege';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

async function fetchPage(offset = 0, limit = 20) {
    const url = `${BASE_API}?location_id=-1&input_college=&offset=${offset}&limit=${limit}&college_type=2`;
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Referer': 'https://diemthi.vnexpress.net/tra-cuu-dai-hoc',
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

async function getUniversityDetail(url) {
    try {
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);

        const getTextAfter = (label) => {
            return $('strong:contains("' + label + '")').parent().find('p').text().trim().replace(/["“”]/g, '') || null;
        };

        const getPhones = () => {
            const area = $('.main__content');     
            const links = area.find('strong:contains("Điện thoại")').parent().find('a');
            return [
                $(links[0]).text().trim() || null,
                $(links[1]).text().trim() || null
            ];
        };

        const getWebsite = () => {
            return $('strong:contains("Website")')
                .parent()
                .find('a')
                .attr('href') || null;
        };

        const address = getTextAfter('Địa chỉ');
        const [phone1, phone2] = getPhones();
        const website = getWebsite();

        return { address, phone1, phone2, website };

    } catch (err) {
        console.error('Lỗi lấy chi tiết:', url, err.message);
        return { address: null, phone1: null, phone2: null, website: null };
    }
}


(async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Universities');


    sheet.columns = [
        { header: 'idTruong', key: 'id', width: 10 },
        { header: 'shortName', key: 'shortName', width: 20 },
        { header: 'fullName', key: 'fullName', width: 50 },
        { header: 'address', key: 'address', width: 50 },
        { header: 'phone1', key: 'phone1', width: 20 },
        { header: 'phone2', key: 'phone2', width: 20 },
        { header: 'website', key: 'website', width: 40 },
        { header: 'slug', key: 'slug', width: 30 },
        { header: 'url', key: 'url', width: 60 },
    ];

    let offset = 0;
    const limit = 50;
    const allMap = new Map();
    const universities = [];

    while (true) {
        console.log(`→ Fetch offset=${offset}, limit=${limit}`);
        const resp = await fetchPage(offset, limit);
        if (!resp) {
            console.log('Không nhận được response, dừng.');
            break;
        }

        const items = extractFromResponse(resp);
        if (!items || items.length === 0) {
            console.log('Hết dữ liệu (hoặc API trả rỗng ở offset này).');
            break;
        }
        universities.push(...items);

        for (const it of items) {
            if (!allMap.has(it.id)) allMap.set(it.id, it);
        }

        console.log(` Lấy được ${items.length} mục (tổng hiện có: ${allMap.size})`);
        offset += limit;
        await new Promise(r => setTimeout(r, 250)); 
        //break;
    }

    for (let uni of universities) {
        console.log(` Lấy dữ liệu trường ${uni.fullName}`);
        const detail = await getUniversityDetail(uni.url);

        uni.address = detail.address;
        uni.phone1 = detail.phone1;
        uni.phone2 = detail.phone2;
        uni.website = detail.website;
    }

    const all = Array.from(allMap.values()).sort((a, b) => a.id - b.id);
    all.forEach(r => sheet.addRow(r));
    await workbook.xlsx.writeFile('Uni.xlsx');
    console.log(`Hoàn tất, lưu ${all.length} trường vào Uni.xlsx`);
})();
