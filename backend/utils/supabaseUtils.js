import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASEURL;
const SUPABASE_KEY = process.env.SUPABASEKEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const uploadFileToSupabase = async (file, bucket, folder) => {
    try {
        if (!file) {
            return { success: false, error: 'Không có file để upload' };
        }

        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const sanitizedName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .toLowerCase();
        const fileName = `${folder}/${timestamp}-${random}-${sanitizedName}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return { 
                success: false, 
                error: 'Lỗi khi upload file: ' + error.message 
            };
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return {
            success: true,
            url: publicUrlData.publicUrl,
            path: data.path
        };

    } catch (error) {
        console.error('Upload file error:', error);
        return { 
            success: false, 
            error: 'Lỗi khi upload file: ' + error.message 
        };
    }
};

export const deleteFileFromSupabase = async (bucket, filePath) => {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error('Supabase delete error:', error);
            return { 
                success: false, 
                error: 'Lỗi khi xóa file: ' + error.message 
            };
        }

        return { success: true };

    } catch (error) {
        console.error('Delete file error:', error);
        return { 
            success: false, 
            error: 'Lỗi khi xóa file: ' + error.message 
        };
    }
};

export const ensureBucketExists = async (bucket) => {
    try {
        const { data, error } = await supabase.storage.listBuckets();
        
        if (error) {
            console.error('Error listing buckets:', error);
            return;
        }

        const bucketExists = data.some(b => b.name === bucket);
        
        if (!bucketExists) {
            console.log(`Bucket '${bucket}' không tồn tại, tạo mới...`);
            await supabase.storage.createBucket(bucket, { 
                public: true 
            });
            console.log(`Bucket '${bucket}' đã được tạo`);
        }
    } catch (error) {
        console.error('Error ensuring bucket exists:', error);
    }
};

export default supabase;
