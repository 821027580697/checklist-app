// MongoDB 연결 유틸리티 — Mongoose 싱글톤 패턴
import mongoose from 'mongoose';

// 빌드 타임에는 env 변수가 없을 수 있으므로 함수 호출 시 체크
function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI 환경변수를 .env.local에 설정해주세요');
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// 글로벌 캐시 (Serverless 환경 핫 리로드 대응)
const globalWithMongo = global as typeof globalThis & { mongoose?: MongooseCache };
const cached: MongooseCache = globalWithMongo.mongoose || { conn: null, promise: null };

if (!globalWithMongo.mongoose) {
  globalWithMongo.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(getMongoUri(), opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
