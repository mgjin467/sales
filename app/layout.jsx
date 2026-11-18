import 'leaflet/dist/leaflet.css';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import BottomTabs from '@/components/BottomTabs';
import MapDock from '@/components/MapDock';
import CoachPanel from '@/components/CoachPanel';
import AuthGate from '@/components/AuthGate';

export const metadata = {
  title: '현장노트',
  description: '신축 현장 발굴부터 시공사 신용도 확인까지, 건축자재 영업을 한곳에서',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body>
        <AuthGate>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="min-w-0 flex-1 pb-[calc(var(--tab-h)+12px)] md:pb-10">{children}</main>
            <MapDock />
          </div>
          <BottomTabs />
          <CoachPanel />
        </AuthGate>
      </body>
    </html>
  );
}
