import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

class FileRepository {
  constructor() {
    this.supabase = env.supabaseUrl && env.supabaseKey
      ? createClient(env.supabaseUrl, env.supabaseKey)
      : null;
  }

  async ensureBucketExists(bucketName) {
    if (!this.supabase) {
      return { success: false, error: 'Chưa cấu hình Supabase' };
    }

    const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
    if (listError) return { success: false, error: listError.message };

    if (!buckets.some((bucket) => bucket.name === bucketName)) {
      const { error } = await this.supabase.storage.createBucket(bucketName, { public: true });
      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  }

  async uploadFile(file, bucketName, folder) {
    if (!file?.buffer) {
      return { success: false, error: 'File không hợp lệ' };
    }

    const bucket = await this.ensureBucketExists(bucketName);
    if (!bucket.success) return bucket;

    const extension = file.originalname?.split('.').pop() || 'bin';
    const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
      .replace(/[^a-zA-Z0-9./_-]/g, '_');

    const { error } = await this.supabase.storage
      .from(bucketName)
      .upload(safeName, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) return { success: false, error: error.message };

    const { data } = this.supabase.storage.from(bucketName).getPublicUrl(safeName);
    return { success: true, url: data.publicUrl, path: safeName };
  }

  async deleteFile(bucketName, filePath) {
    if (!this.supabase || !filePath) return { success: true };
    const { error } = await this.supabase.storage.from(bucketName).remove([filePath]);
    return error ? { success: false, error: error.message } : { success: true };
  }

  extractPathFromUrl(bucketName, url) {
    if (!url) return null;
    const marker = `/${bucketName}/`;
    const index = url.indexOf(marker);
    if (index >= 0) return decodeURIComponent(url.slice(index + marker.length));
    return url.split('/').pop();
  }
}

export default new FileRepository();
