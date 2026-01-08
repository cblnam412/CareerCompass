const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeVnExpressMajors() {
    const url = 'https://diemthi.vnexpress.net/tra-cuu-dai-hoc/tim-nganh'; 

    try {
        console.log("Đang tải dữ liệu...");
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const nganhHocList = [];

        $('li.lookup__result strong').each((index, element) => {
            const name = $(element).text().trim();
            if (name) {
                nganhHocList.push(name);
            }
        });

        if (nganhHocList.length > 0) {
            fs.writeFileSync('nganh_hoc.txt', nganhHocList.join('\n'), 'utf8');
            console.log(`Thành công!`);
            console.log(`Đã tìm thấy ${nganhHocList.length} ngành học`);
        } else {
            console.log("Không tìm thấy dữ liệu. Hãy kiểm tra lại URL hoặc Selector.");
        }

    } catch (error) {
        console.error("Lỗi khi cào dữ liệu:", error.message);
    }
}

scrapeVnExpressMajors();