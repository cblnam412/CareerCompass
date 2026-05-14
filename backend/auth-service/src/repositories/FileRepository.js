import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class FileRepository {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async uploadFile(file, bucketName, fileType = 'file') {
        try {
            if (!file || !file.data) {
                return { success: false, error: 'File không hợp lệ hoặc không có dữ liệu' };
            }

            const fileContent = file.data;
            const originalName = file.name || 'unnamed.png';
            const extension = originalName.split('.').pop();
            
            const safeFileName = `${Date.now()}-${fileType}.${extension}`.replace(/[^a-zA-Z0-9.-]/g, '_');
            
            console.log(`Upload lên bucket: ${bucketName}, file: ${safeFileName}`);

            const { data, error } = await this.supabase.storage
                .from(bucketName)
                .upload(safeFileName, fileContent, {
                    contentType: file.mimetype || 'application/octet-stream',
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Supabase upload error detail:', error);
                throw error;
            }

            const { data: publicData } = this.supabase.storage
                .from(bucketName)
                .getPublicUrl(safeFileName);

            console.log('Upload thành công, URL:', publicData.publicUrl);
            return {
                success: true,
                url: publicData.publicUrl,
                path: safeFileName
            };
        } catch (error) {
            console.error('Upload error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteFile(bucketName, filePath) {
        try {
            if (!filePath) {
                return {
                    success: false,
                    error: 'Không có đường dẫn file'
                };
            }

            const { data, error } = await this.supabase.storage
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
    }

    async deleteMultipleFiles(bucketName, filePaths) {
        try {
            if (!filePaths || filePaths.length === 0) {
                return {
                    success: false,
                    error: 'Không có file cần xóa'
                };
            }

            const { data, error } = await this.supabase.storage
                .from(bucketName)
                .remove(filePaths);

            if (error) {
                throw error;
            }

            return {
                success: true,
                message: `Xóa ${filePaths.length} file thành công`
            };
        } catch (error) {
            console.error('Delete multiple files error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }


    async ensureBucketExists(bucketName) {
        try {
            const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();

            if (listError) {
                throw listError;
            }

            const bucketExists = buckets.some(b => b.name === bucketName);

            if (!bucketExists) {
                const { data, error: createError } = await this.supabase.storage.createBucket(
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
    }


    getPublicUrl(bucketName, filePath) {
        try {
            const { data } = this.supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Get public URL error:', error);
            return null;
        }
    }

  
    async uploadAvatar(file) {
        return await this.uploadFile(file, 'user-avatars', 'avatars');
    }

    async deleteAvatar(filePath) {
        return await this.deleteFile('user-avatars', filePath);
    }

    async uploadStudentCard(file, cardType) {
        return await this.uploadFile(file, 'student-cards', cardType);
    }


    async deleteStudentCard(filePath) {
        return await this.deleteFile('student-cards', filePath);
    }

    extractFileNameFromUrl(url) {
        try {
            return url.split('/').pop();
        } catch (error) {
            console.error('Extract file name error:', error);
            return null;
        }
    }
}

export default new FileRepository();
