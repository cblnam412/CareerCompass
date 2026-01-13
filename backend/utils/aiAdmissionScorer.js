export const createRateLimiter = (maxRequests = 10, timeWindow = 60000, minInterval = 2000) => {
    return {
        requestTimestamps: [],
        maxRequests,
        timeWindow,
        minInterval,
        lastRequestTime: 0,
        
        async waitForSlot() {
            const now = Date.now();
            
            this.requestTimestamps = this.requestTimestamps.filter(
                timestamp => now - timestamp < this.timeWindow
            );
            
            if (this.requestTimestamps.length >= this.maxRequests) {
                const oldestRequest = this.requestTimestamps[0];
                const waitTime = this.timeWindow - (now - oldestRequest);
                
                if (waitTime > 0) {
                    console.log(`[RateLimit] Reached limit (${this.maxRequests} in ${this.timeWindow}ms). Waiting ${Math.ceil(waitTime / 1000)}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return this.waitForSlot();
                }
            }
            
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.minInterval) {
                const delayNeeded = this.minInterval - timeSinceLastRequest;
                console.log(`[RateLimit] Waiting ${delayNeeded}ms between requests...`);
                await new Promise(resolve => setTimeout(resolve, delayNeeded));
            }
            
            this.requestTimestamps.push(now);
            this.lastRequestTime = Date.now();
        }
    };
};

export const getAdmissionScoreFromAI = async (rateLimiter, universityName, majorName) => {
    try {
        await rateLimiter.waitForSlot();
        
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY not configured');
        }

        const prompt = `Dựa trên kinh nghiệm và dữ liệu tuyển sinh, hãy ước tính điểm chuẩn cho:
- Trường: "${universityName}"
- Ngành: "${majorName}"

Điểm chuẩn thường từ 15-30 tùy vào mức độ cạnh tranh của ngành và trường.
- Trường top: 25-29 điểm
- Trường bình thường: 20-25 điểm  
- Trường khác: 15-22 điểm

Trả về JSON:
{"score": 23.5}

Nếu không thể ước tính:
{"score": null}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn(`[AI] Response content: "${content}"`);
            console.warn(`[AI] Could not parse JSON response for ${universityName} - ${majorName}`);
            return null;
        }

        const result = JSON.parse(jsonMatch[0]);
        return result.score || null;

    } catch (error) {
        console.error(`[AI Error] Failed to get admission score for ${universityName} - ${majorName}:`, error.message);
        return null;
    }
};

export const fetchAllAdmissionScoresFromAI = async (universityMajors) => {
    const rateLimiter = createRateLimiter(15, 60000, 2000); // 15 requests per 60s, 2s min between
    const results = [];
    const errors = [];

    for (let i = 0; i < universityMajors.length; i++) {
        const um = universityMajors[i];
        const progress = `[${i + 1}/${universityMajors.length}]`;
        
        try {
            const universityName = um.universityId?.name || um.universityName || 'Unknown';
            const majorName = um.majorId?.name || um.majorName || 'Unknown';
            
            console.log(`${progress} Fetching: ${universityName} - ${majorName}`);
            
            const scoreData = await getAdmissionScoreFromAI(
                rateLimiter,
                universityName,
                majorName
            );

            if (scoreData !== null) {
                results.push({
                    universityMajorId: um._id,
                    universityId: um.universityId,
                    majorId: um.majorId,
                    majorName: um.majorName,
                    admissionScore: scoreData,
                    admissionScoreYear: new Date().getFullYear(),
                    method: 'AI',
                    success: true
                });
                console.log(`${progress} ✓ Found: ${scoreData}`);
            } else {
                errors.push({
                    universityMajorId: um._id,
                    majorName: um.majorName,
                    error: 'No score found',
                    success: false
                });
                console.log(`${progress} ✗ No score found`);
            }
        } catch (error) {
            errors.push({
                universityMajorId: um._id,
                majorName: um.majorName,
                error: error.message,
                success: false
            });
            console.error(`${progress} ✗ Error:`, error.message);
        }
    }
w
    return { results, errors };
};
