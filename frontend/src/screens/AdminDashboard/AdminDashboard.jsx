import { Card, CardContent } from '../../component/Card/Card';
import { Book, FileText, Users, GraduationCap, Globe, AlertCircle, School } from 'lucide-react';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const stats = [
    { icon: Globe, label: "Người dùng trực tuyến", count: 24 },
    { icon: Users, label: "Tổng người dùng", count: 156 },
    { icon: School, label: "Trường đại học", count: 32 },
    { icon: Users, label: "Đại diện trường đại học", count: 8 },
    { icon: GraduationCap, label: "Môn học", count: 12 },
    { icon: Book, label: "Tổ hợp môn", count: 15 },
    { icon: FileText, label: "Đề thi", count: 48 },
    { icon: AlertCircle, label: "Báo cáo vi phạm", count: 7 },
  ];

  // Test results data (points 1-10)
  const testResultsData = [
    { point: 1, count: 5 },
    { point: 2, count: 8 },
    { point: 3, count: 12 },
    { point: 4, count: 18 },
    { point: 5, count: 25 },
    { point: 6, count: 32 },
    { point: 7, count: 28 },
    { point: 8, count: 22 },
    { point: 9, count: 15 },
    { point: 10, count: 10 },
  ];

  // Violation report status data
  const violationData = [
    { id: 0, value: 15, label: 'Đang chờ' },
    { id: 1, value: 8, label: 'Từ chối' },
    { id: 2, value: 12, label: 'Chấp thuận' },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard quản trị viên</h1>

      <div className={styles.statsGrid}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className={styles.statCard}
              role="button"
              tabIndex={0}
            >
              <Card>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{stat.label}</h3>
                  <Icon className={styles.cardIcon} />
                </div>
                <CardContent>
                  <div className={styles.statCount}>{stat.count}</div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <div className={styles.chartsGrid}>
        <Card className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Kết quả kiểm tra theo điểm</h3>
          </div>
          <CardContent>
            <BarChart
              xAxis={[{ 
                scaleType: 'band', 
                data: testResultsData.map(d => d.point.toString()),
                label: 'Điểm'
              }]}
              series={[{ 
                data: testResultsData.map(d => d.count),
                label: 'Số lượng',
                color: '#2196F3'
              }]}
              height={300}
            />
          </CardContent>
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Trạng thái báo cáo vi phạm</h3>
          </div>
          <CardContent>
            <PieChart
              series={[{
                data: violationData,
                highlightScope: { faded: 'global', highlighted: 'item' },
                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                valueFormatter: (value) => `${value}`,
              }]}
              colors={['#3B82F6', '#E11D48', '#4CAF50']}
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* <Card className={styles.infoCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Thông tin hệ thống</h3>
        </div>
        <CardContent>
          <p className={styles.infoText}>Chào mừng bạn đến với bảng điều khiển quản trị viên.</p>
        </CardContent>
      </Card> */}
    </div>
  );
}