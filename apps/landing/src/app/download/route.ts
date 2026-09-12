import { NextResponse } from 'next/server';
import { APK_DOWNLOAD_URL } from '../../constants/links';

export async function GET() {
  return NextResponse.redirect(APK_DOWNLOAD_URL, { status: 302 });
}
