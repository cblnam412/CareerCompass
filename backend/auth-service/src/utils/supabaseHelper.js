import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Upload file lên Supabase
export const uploadFileToSupabase = async (file, bucketName, fileType = '') => {
    try {
        if (!file) {
            return {
                success: false,
                error: 'Không có file để upload'
            };
        }

        const fileBuffer = file.buffer;
        const fileName = `${Date.now()}-${fileType}-${file.originalname}`;
        const filePath = `${bucketName}/${fileName}`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, fileBuffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            throw error;
        }

        // Lấy URL public
        const { data: publicData } = supabase
            .storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return {
            success: true,
            path: filePath,
            url: publicData.publicUrl
        };
    } catch (error) {
        console.error('Upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Xóa file từ Supabase
export const deleteFileFromSupabase = async (bucketName, filePath) => {
    try {
        if (!filePath) {
            return {
                success: false,
                error: 'Không có đường dẫn file'
            };
        }

        const { data, error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

        if (error) {
            throw error;
        }

        return {
            success: true,
            message: 'Xóa file thành công'
        };
    } catch (error) {
        console.error('Delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Kiểm tra và tạo bucket nếu chưa tồn tại
export const ensureBucketExists = async (bucketName) => {
    try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            throw listError;
        }

        const bucketExists = buckets.some(b => b.name === bucketName);

        if (!bucketExists) {
            const { data, error: createError } = await supabase.storage.createBucket(
                bucketName,
                { public: true }
            );

            if (createError) {
                throw createError;
            }

            console.log(`✓ Bucket ${bucketName} đã được tạo`);
        }

        return { success: true };
    } catch (error) {
        console.error('Bucket error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
